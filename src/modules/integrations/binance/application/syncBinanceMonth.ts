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

function getSymbolLimit(): number {
  const val = Number(process.env.BINANCE_SYNC_SYMBOL_LIMIT ?? "100");
  return Number.isFinite(val) && val > 0 ? Math.min(val, BINANCE_SPOT_PAIRS.length) : 35;
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

  const pairs = BINANCE_SPOT_PAIRS.slice(0, getSymbolLimit());

  let imported = 0;
  let skipped  = 0;
  const errors: string[] = [];

  // ── Trades por símbolo ────────────────────────────────────────────
  for (const pair of pairs) {
    try {
      for await (const { batch } of fetchAllTradesWindowed(pair, startMs, apiKey, apiSecret, endMs)) {
        for (const raw of batch) {
          const normalized = normalizeTrade(raw);
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
