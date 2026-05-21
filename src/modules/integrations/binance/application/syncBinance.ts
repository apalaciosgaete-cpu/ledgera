import {
  fetchAllDepositsWindowed,
  fetchAllTradesWindowed,
  fetchAllWithdrawalsWindowed,
} from "../infrastructure/binanceClient";
import {
  updateSyncError,
  updateSyncSuccess,
} from "../infrastructure/exchangeConnectionRepository";
import { upsertImportRecord } from "../infrastructure/exchangeImportRepository";
import {
  normalizeDeposit,
  normalizeTrade,
  normalizeWithdraw,
} from "./normalizeBinanceTrade";
import {
  BINANCE_SPOT_PAIRS,
  type SyncCheckpoint,
  type SyncResult,
} from "../domain/binanceTypes";

// Fecha de inicio por defecto: 1 enero 2018 (inicio de los exchanges masivos)
const DEFAULT_START_MS = new Date("2018-01-01").getTime();

export async function syncBinance(
  userId:       string,
  connectionId: string,
  apiKey:       string,
  apiSecret:    string,
  checkpointJson: string | null,
): Promise<SyncResult> {
  const checkpoint: SyncCheckpoint = checkpointJson
    ? (JSON.parse(checkpointJson) as SyncCheckpoint)
    : {};

  const result: SyncResult = { imported: 0, skipped: 0, errors: [] };

  // ── 1. Trades por símbolo en ventanas de 24h ───────────────────────────────
  for (const pair of BINANCE_SPOT_PAIRS) {
    const startMs = checkpoint[pair]
      ? new Date(checkpoint[pair]).getTime()
      : DEFAULT_START_MS;

    try {
      for await (const batch of fetchAllTradesWindowed(pair, startMs, apiKey, apiSecret)) {
        for (const raw of batch) {
          const normalized = normalizeTrade(raw);
          const { isNew } = await upsertImportRecord(
            userId,
            connectionId,
            "BINANCE",
            normalized,
            JSON.stringify(raw),
          );
          isNew ? result.imported++ : result.skipped++;
        }
        // Actualiza checkpoint al trade más reciente del lote
        const latestMs = Math.max(...batch.map(t => t.time));
        checkpoint[pair] = new Date(latestMs + 1).toISOString();
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      // Ignora "Invalid symbol" — el par simplemente no fue operado
      if (!msg.includes("-1121")) {
        result.errors.push(`${pair}: ${msg}`);
      }
    }
  }

  // ── 2. Depósitos en ventanas de 90 días ────────────────────────────────────
  const depositStart = checkpoint["deposits"]
    ? new Date(checkpoint["deposits"]).getTime()
    : DEFAULT_START_MS;

  try {
    for await (const batch of fetchAllDepositsWindowed(depositStart, apiKey, apiSecret)) {
      for (const raw of batch) {
        const normalized = normalizeDeposit(raw);
        const { isNew } = await upsertImportRecord(
          userId,
          connectionId,
          "BINANCE",
          normalized,
          JSON.stringify(raw),
        );
        isNew ? result.imported++ : result.skipped++;
      }
      const latestMs = Math.max(...batch.map(d => d.insertTime));
      checkpoint["deposits"] = new Date(latestMs + 1).toISOString();
    }
  } catch (err) {
    result.errors.push(`deposits: ${err instanceof Error ? err.message : String(err)}`);
  }

  // ── 3. Retiros en ventanas de 90 días ─────────────────────────────────────
  const withdrawStart = checkpoint["withdrawals"]
    ? new Date(checkpoint["withdrawals"]).getTime()
    : DEFAULT_START_MS;

  try {
    for await (const batch of fetchAllWithdrawalsWindowed(withdrawStart, apiKey, apiSecret)) {
      for (const raw of batch) {
        const normalized = normalizeWithdraw(raw);
        const { isNew } = await upsertImportRecord(
          userId,
          connectionId,
          "BINANCE",
          normalized,
          JSON.stringify(raw),
        );
        isNew ? result.imported++ : result.skipped++;
      }
      const latestMs = Math.max(...batch.map(w => new Date(w.applyTime).getTime()));
      checkpoint["withdrawals"] = new Date(latestMs + 1).toISOString();
    }
  } catch (err) {
    result.errors.push(`withdrawals: ${err instanceof Error ? err.message : String(err)}`);
  }

  // ── 4. Persiste checkpoint y estado ──────────────────────────────────────
  if (result.errors.length === 0) {
    await updateSyncSuccess(connectionId, checkpoint);
  } else {
    await updateSyncError(connectionId, result.errors.join(" | "));
  }

  return result;
}
