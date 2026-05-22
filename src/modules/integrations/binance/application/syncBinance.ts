import {
  fetchAccountInfo,
  fetchAllDepositsWindowed,
  fetchAllTradesWindowed,
  fetchAllWithdrawalsWindowed,
} from "../infrastructure/binanceClient";
import { upsertImportRecord } from "../infrastructure/exchangeImportRepository";
import {
  normalizeDeposit,
  normalizeTrade,
  normalizeWithdraw,
} from "./normalizeBinanceTrade";
import {
  BINANCE_SPOT_PAIRS,
  type FirstSyncFailure,
  type SymbolSyncStats,
  type SyncCheckpoint,
  type SyncResult,
} from "../domain/binanceTypes";

const STABLECOIN_ASSETS = new Set(["USDT", "USDC", "BUSD", "FDUSD", "TUSD", "DAI", "USDP"]);
const DYNAMIC_QUOTES    = ["USDT", "USDC", "BUSD", "FDUSD", "BTC"];

// Prepend dynamic pairs from non-zero balances so they're synced first.
async function buildPairList(apiKey: string, apiSecret: string, limit: number): Promise<string[]> {
  const dynamic: string[] = [];
  const seen = new Set<string>();
  try {
    const info = await fetchAccountInfo(apiKey, apiSecret);
    for (const { asset, free, locked } of info.balances) {
      const a = asset.toUpperCase();
      if (STABLECOIN_ASSETS.has(a)) continue;
      if (parseFloat(free) + parseFloat(locked) <= 0) continue;
      for (const q of DYNAMIC_QUOTES) {
        const pair = `${a}${q}`;
        if (!seen.has(pair)) { seen.add(pair); dynamic.push(pair); }
      }
    }
  } catch { /* fall back to static list only */ }
  const merged: string[] = [...dynamic];
  for (const p of BINANCE_SPOT_PAIRS) {
    if (!seen.has(p)) { seen.add(p); merged.push(p); }
  }
  return merged.slice(0, limit);
}

function getStartMs(): number {
  const raw = process.env.BINANCE_SYNC_START_DATE ?? "2024-01-01";
  const ms  = new Date(raw).getTime();
  return Number.isFinite(ms) ? ms : new Date("2024-01-01").getTime();
}

function getSymbolLimit(): number {
  const val = Number(process.env.BINANCE_SYNC_SYMBOL_LIMIT ?? "35");
  return Number.isFinite(val) && val > 0 ? Math.min(val, BINANCE_SPOT_PAIRS.length) : 35;
}

// Max ventanas de tiempo (≈días) por símbolo por ejecución. Evita timeouts en Vercel.
function getWindowLimit(): number {
  const val = Number(process.env.BINANCE_SYNC_WINDOW_LIMIT ?? "999");
  return Number.isFinite(val) && val > 0 ? val : 999;
}

export type SyncOutput = {
  result:     SyncResult;
  checkpoint: SyncCheckpoint;
};

export async function syncBinance(
  userId:         string,
  connectionId:   string,
  apiKey:         string,
  apiSecret:      string,
  checkpointJson: string | null,
): Promise<SyncOutput> {
  const checkpoint: SyncCheckpoint = checkpointJson
    ? (JSON.parse(checkpointJson) as SyncCheckpoint)
    : {};

  const defaultStartMs = getStartMs();
  const symbolLimit    = getSymbolLimit();
  const windowLimit    = getWindowLimit();
  const pairs          = await buildPairList(apiKey, apiSecret, symbolLimit);

  const symbolStats: Record<string, SymbolSyncStats> = {};
  let firstFailure: FirstSyncFailure | null = null;
  let imported = 0;
  let skipped  = 0;
  const errors: string[] = [];

  // ── 1. Trades por símbolo en ventanas de 24h ───────────────────────────
  for (const pair of pairs) {
    const startMs = checkpoint[pair]
      ? new Date(checkpoint[pair]).getTime()
      : defaultStartMs;

    const stats: SymbolSyncStats = { imported: 0, skipped: 0, failed: false };

    try {
      let windows = 0;
      for await (const { batch, windowStart, windowEnd } of fetchAllTradesWindowed(pair, startMs, apiKey, apiSecret)) {
        if (windows >= windowLimit) break;
        for (const raw of batch) {
          const normalized = await normalizeTrade(raw);
          const { isNew }  = await upsertImportRecord(
            userId,
            connectionId,
            "BINANCE",
            normalized,
            JSON.stringify(raw),
          );
          isNew ? stats.imported++ : stats.skipped++;
        }
        // Avanza checkpoint al final de la ventana procesada
        checkpoint[pair] = new Date(windowEnd + 1).toISOString();
        windows++;
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);

      // Ignora "Invalid symbol" — el par simplemente no fue operado en esta cuenta
      if (msg.includes("-1121")) {
        symbolStats[pair] = stats;
        continue;
      }

      stats.failed = true;
      errors.push(`${pair}: ${msg}`);

      if (!firstFailure) {
        firstFailure = {
          symbol:      pair,
          windowStart: checkpoint[pair] ?? new Date(defaultStartMs).toISOString(),
          windowEnd:   new Date().toISOString(),
        };
      }
    }

    imported += stats.imported;
    skipped  += stats.skipped;
    symbolStats[pair] = stats;
  }

  // ── 2. Depósitos en ventanas de 90 días ───────────────────────────────
  const depositStartMs = checkpoint["deposits"]
    ? new Date(checkpoint["deposits"]).getTime()
    : defaultStartMs;

  const depositStats: SymbolSyncStats = { imported: 0, skipped: 0, failed: false };

  try {
    let depWindows = 0;
    for await (const { batch, windowEnd } of fetchAllDepositsWindowed(depositStartMs, apiKey, apiSecret)) {
      if (depWindows >= windowLimit) break;
      for (const raw of batch) {
        const normalized = normalizeDeposit(raw);
        const { isNew }  = await upsertImportRecord(
          userId,
          connectionId,
          "BINANCE",
          normalized,
          JSON.stringify(raw),
        );
        isNew ? depositStats.imported++ : depositStats.skipped++;
      }
      checkpoint["deposits"] = new Date(windowEnd + 1).toISOString();
      depWindows++;
    }
  } catch (err) {
    depositStats.failed = true;
    const msg = err instanceof Error ? err.message : String(err);
    errors.push(`deposits: ${msg}`);

    if (!firstFailure) {
      firstFailure = {
        symbol:      "deposits",
        windowStart: checkpoint["deposits"] ?? new Date(defaultStartMs).toISOString(),
        windowEnd:   new Date().toISOString(),
      };
    }
  }

  imported += depositStats.imported;
  skipped  += depositStats.skipped;
  symbolStats["deposits"] = depositStats;

  // ── 3. Retiros en ventanas de 90 días ─────────────────────────────────
  const withdrawStartMs = checkpoint["withdrawals"]
    ? new Date(checkpoint["withdrawals"]).getTime()
    : defaultStartMs;

  const withdrawStats: SymbolSyncStats = { imported: 0, skipped: 0, failed: false };

  try {
    let wdWindows = 0;
    for await (const { batch, windowEnd } of fetchAllWithdrawalsWindowed(withdrawStartMs, apiKey, apiSecret)) {
      if (wdWindows >= windowLimit) break;
      for (const raw of batch) {
        const normalized = normalizeWithdraw(raw);
        const { isNew }  = await upsertImportRecord(
          userId,
          connectionId,
          "BINANCE",
          normalized,
          JSON.stringify(raw),
        );
        isNew ? withdrawStats.imported++ : withdrawStats.skipped++;
      }
      checkpoint["withdrawals"] = new Date(windowEnd + 1).toISOString();
      wdWindows++;
    }
  } catch (err) {
    withdrawStats.failed = true;
    const msg = err instanceof Error ? err.message : String(err);
    errors.push(`withdrawals: ${msg}`);

    if (!firstFailure) {
      firstFailure = {
        symbol:      "withdrawals",
        windowStart: checkpoint["withdrawals"] ?? new Date(defaultStartMs).toISOString(),
        windowEnd:   new Date().toISOString(),
      };
    }
  }

  imported += withdrawStats.imported;
  skipped  += withdrawStats.skipped;
  symbolStats["withdrawals"] = withdrawStats;

  return {
    result: { imported, skipped, errors, symbolStats, firstFailure },
    checkpoint,
  };
}
