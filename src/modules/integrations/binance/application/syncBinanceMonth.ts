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

// Build pair list from:
// 1. Current account balances (non-zero, non-stablecoin assets)
// 2. Coins discovered during deposit/withdrawal sync for this period
// 3. Static BINANCE_SPOT_PAIRS as fallback coverage
async function buildPairList(
  apiKey:          string,
  apiSecret:       string,
  discoveredCoins: Set<string>,
): Promise<string[]> {
  const seen  = new Set<string>();
  const pairs: string[] = [];

  function addPairsForAsset(asset: string) {
    const a = asset.toUpperCase();
    if (STABLECOIN_ASSETS.has(a)) return;
    for (const q of DYNAMIC_QUOTES) {
      const pair = `${a}${q}`;
      if (!seen.has(pair)) { seen.add(pair); pairs.push(pair); }
    }
  }

  // Coins seen in deposits/withdrawals this period — most reliable source
  for (const coin of discoveredCoins) addPairsForAsset(coin);

  // Current account balances — catches coins still held
  try {
    const info = await fetchAccountInfo(apiKey, apiSecret);
    for (const { asset, free, locked } of info.balances) {
      if (parseFloat(free) + parseFloat(locked) <= 0) continue;
      addPairsForAsset(asset);
    }
  } catch { /* fall back to discovered + static */ }

  // Static list as broad coverage fallback
  for (const p of BINANCE_SPOT_PAIRS) {
    if (!seen.has(p)) { seen.add(p); pairs.push(p); }
  }

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

  // ── 3. Lista de pares extendida (balances + coins del período + estáticos) ─
  const pairs = await buildPairList(apiKey, apiSecret, discoveredCoins);

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
