import {
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

// Maximum pair checks per month-sync to stay within Vercel 60s timeout.
// Budget: 60s / ~500ms per call ≈ 120 calls − 2 (deposits/withdrawals) = ~90 pairs.
const MAX_PAIRS = 88;

const STABLECOIN_ASSETS = new Set(["USDT", "USDC", "BUSD", "FDUSD", "TUSD", "DAI", "USDP"]);

// Build pair list from coins seen in this period's deposits/withdrawals
// merged with the static BINANCE_SPOT_PAIRS.
// Dynamic coins only get a USDT pair (most liquid/common) to keep overhead minimal.
function buildPairList(discoveredCoins: Set<string>): string[] {
  const seen  = new Set<string>();
  const pairs: string[] = [];

  // Dynamic pairs first — coins active in this specific period take priority.
  for (const coin of discoveredCoins) {
    const a = coin.toUpperCase();
    if (STABLECOIN_ASSETS.has(a)) continue;
    const pair = `${a}USDT`;
    if (!seen.has(pair)) { seen.add(pair); pairs.push(pair); }
  }

  // Static list covers broad historical coverage.
  for (const p of BINANCE_SPOT_PAIRS) {
    if (!seen.has(p)) { seen.add(p); pairs.push(p); }
  }

  return pairs.slice(0, MAX_PAIRS);
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

  let imported = 0;
  let skipped  = 0;
  const errors: string[] = [];
  const discoveredCoins = new Set<string>();

  // ── 1. Depósitos primero — descubrir monedas activas en el período ────────
  try {
    for await (const { batch } of fetchAllDepositsWindowed(startMs, apiKey, apiSecret, endMs)) {
      for (const raw of batch) {
        discoveredCoins.add(raw.coin.toUpperCase());
        const normalized = normalizeDeposit(raw);
        const { isNew }  = await upsertImportRecord(userId, connectionId, "BINANCE", normalized, JSON.stringify(raw));
        isNew ? imported++ : skipped++;
      }
    }
  } catch (err) {
    errors.push(`deposits: ${err instanceof Error ? err.message : String(err)}`);
  }

  // ── 2. Retiros — más monedas para descubrir ───────────────────────────────
  try {
    for await (const { batch } of fetchAllWithdrawalsWindowed(startMs, apiKey, apiSecret, endMs)) {
      for (const raw of batch) {
        discoveredCoins.add(raw.coin.toUpperCase());
        const normalized = normalizeWithdraw(raw);
        const { isNew }  = await upsertImportRecord(userId, connectionId, "BINANCE", normalized, JSON.stringify(raw));
        isNew ? imported++ : skipped++;
      }
    }
  } catch (err) {
    errors.push(`withdrawals: ${err instanceof Error ? err.message : String(err)}`);
  }

  // ── 3. Lista de pares (coins del período + estáticos, cap MAX_PAIRS) ───────
  const pairs = buildPairList(discoveredCoins);

  // ── 4. Trades por símbolo ─────────────────────────────────────────────────
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

  return { imported, skipped, errors };
}
