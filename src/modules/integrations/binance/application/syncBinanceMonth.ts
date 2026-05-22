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
import { BINANCE_SPOT_PAIRS } from "../domain/binanceTypes";

const STABLECOIN_ASSETS = new Set(["USDT", "USDC", "BUSD", "FDUSD", "TUSD", "DAI", "USDP"]);
const DYNAMIC_QUOTES    = ["USDT", "USDC", "BUSD", "FDUSD", "BTC"];

// Build pair list from current account balances merged with the static list.
// Non-zero balance assets generate candidate pairs for all major quote assets.
// Invalid pairs are already handled gracefully (-1121 → silently skipped).
async function buildPairList(apiKey: string, apiSecret: string): Promise<string[]> {
  const seen  = new Set(BINANCE_SPOT_PAIRS);
  const pairs = [...BINANCE_SPOT_PAIRS];
  try {
    const info = await fetchAccountInfo(apiKey, apiSecret);
    for (const { asset, free, locked } of info.balances) {
      const a = asset.toUpperCase();
      if (STABLECOIN_ASSETS.has(a)) continue;
      if (parseFloat(free) + parseFloat(locked) <= 0) continue;
      for (const q of DYNAMIC_QUOTES) {
        const pair = `${a}${q}`;
        if (!seen.has(pair)) { seen.add(pair); pairs.push(pair); }
      }
    }
  } catch { /* fall back to static list */ }
  return pairs;
}

export type MonthSyncResult = {
  imported: number;
  skipped:  number;
  errors:   string[];
};

export async function syncBinanceMonth(
  userId:       string,
  connectionId: string,
  apiKey:       string,
  apiSecret:    string,
  year:         number,
  month:        number,
): Promise<MonthSyncResult> {
  const startMs = new Date(year, month - 1, 1).getTime();
  const endMs   = Math.min(new Date(year, month, 1).getTime() - 1, Date.now());

  if (startMs > endMs) {
    return { imported: 0, skipped: 0, errors: [] };
  }

  const pairs = await buildPairList(apiKey, apiSecret);

  let imported = 0;
  let skipped  = 0;
  const errors: string[] = [];

  // ── Trades por símbolo ────────────────────────────────────────────
  for (const pair of pairs) {
    try {
      for await (const { batch } of fetchAllTradesWindowed(pair, startMs, apiKey, apiSecret, endMs)) {
        for (const raw of batch) {
          const normalized = await normalizeTrade(raw);
          const { isNew }  = await upsertImportRecord(userId, connectionId, "BINANCE", normalized, JSON.stringify(raw));
          isNew ? imported++ : skipped++;
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("-1121")) continue;
      errors.push(`${pair}: ${msg}`);
    }
  }

  // ── Depósitos ─────────────────────────────────────────────────────
  try {
    for await (const { batch } of fetchAllDepositsWindowed(startMs, apiKey, apiSecret, endMs)) {
      for (const raw of batch) {
        const normalized = normalizeDeposit(raw);
        const { isNew }  = await upsertImportRecord(userId, connectionId, "BINANCE", normalized, JSON.stringify(raw));
        isNew ? imported++ : skipped++;
      }
    }
  } catch (err) {
    errors.push(`deposits: ${err instanceof Error ? err.message : String(err)}`);
  }

  // ── Retiros ───────────────────────────────────────────────────────
  try {
    for await (const { batch } of fetchAllWithdrawalsWindowed(startMs, apiKey, apiSecret, endMs)) {
      for (const raw of batch) {
        const normalized = normalizeWithdraw(raw);
        const { isNew }  = await upsertImportRecord(userId, connectionId, "BINANCE", normalized, JSON.stringify(raw));
        isNew ? imported++ : skipped++;
      }
    }
  } catch (err) {
    errors.push(`withdrawals: ${err instanceof Error ? err.message : String(err)}`);
  }

  return { imported, skipped, errors };
}
