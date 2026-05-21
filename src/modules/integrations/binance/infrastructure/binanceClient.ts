import {
  BINANCE_BASE_URL,
  MS_24H,
  MS_90D,
  type BinanceAccountInfo,
  type BinanceDepositRaw,
  type BinanceTradeRaw,
  type BinanceWithdrawRaw,
} from "../domain/binanceTypes";
import { buildSignedParams } from "./binanceSigner";

function getTimeoutMs(): number {
  const val = Number(process.env.BINANCE_REQUEST_TIMEOUT_MS ?? "15000");
  return Number.isFinite(val) && val > 0 ? val : 15_000;
}

async function binanceFetch<T>(
  path: string,
  params: Record<string, string | number>,
  apiKey: string,
  apiSecret: string,
): Promise<T> {
  const qs     = buildSignedParams(params, apiSecret);
  const url    = `${BINANCE_BASE_URL}${path}?${qs}`;
  const signal = AbortSignal.timeout(getTimeoutMs());

  const res = await fetch(url, {
    headers: { "X-MBX-APIKEY": apiKey },
    cache:   "no-store",
    signal,
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Binance ${path} → ${res.status}: ${body}`);
  }

  return res.json() as Promise<T>;
}

export async function fetchAccountInfo(
  apiKey: string,
  apiSecret: string,
): Promise<BinanceAccountInfo> {
  return binanceFetch<BinanceAccountInfo>("/api/v3/account", { recvWindow: 10000 }, apiKey, apiSecret);
}

export async function fetchTradesForSymbol(
  symbol: string,
  startTime: number,
  endTime: number,
  apiKey: string,
  apiSecret: string,
): Promise<BinanceTradeRaw[]> {
  return binanceFetch<BinanceTradeRaw[]>(
    "/api/v3/myTrades",
    { symbol, startTime, endTime, limit: 1000 },
    apiKey,
    apiSecret,
  );
}

export async function fetchDeposits(
  startTime: number,
  endTime: number,
  apiKey: string,
  apiSecret: string,
): Promise<BinanceDepositRaw[]> {
  return binanceFetch<BinanceDepositRaw[]>(
    "/sapi/v1/capital/deposit/hisrec",
    { startTime, endTime, limit: 1000 },
    apiKey,
    apiSecret,
  );
}

export async function fetchWithdrawals(
  startTime: number,
  endTime: number,
  apiKey: string,
  apiSecret: string,
): Promise<BinanceWithdrawRaw[]> {
  return binanceFetch<BinanceWithdrawRaw[]>(
    "/sapi/v1/capital/withdraw/history",
    { startTime, endTime, limit: 1000 },
    apiKey,
    apiSecret,
  );
}

// ── Windowed generators ────────────────────────────────────────────────────
// Each yield includes the window boundaries so callers can track failures.

export type TradeWindow    = { batch: BinanceTradeRaw[];    windowStart: number; windowEnd: number };
export type DepositWindow  = { batch: BinanceDepositRaw[];  windowStart: number; windowEnd: number };
export type WithdrawWindow = { batch: BinanceWithdrawRaw[]; windowStart: number; windowEnd: number };

export async function* fetchAllTradesWindowed(
  symbol: string,
  startMs: number,
  apiKey: string,
  apiSecret: string,
): AsyncGenerator<TradeWindow> {
  const now = Date.now();
  let cursor = startMs;

  while (cursor < now) {
    const windowEnd = Math.min(cursor + MS_24H - 1, now);
    const batch     = await fetchTradesForSymbol(symbol, cursor, windowEnd, apiKey, apiSecret);
    yield { batch, windowStart: cursor, windowEnd };
    cursor = windowEnd + 1;
  }
}

export async function* fetchAllDepositsWindowed(
  startMs: number,
  apiKey: string,
  apiSecret: string,
): AsyncGenerator<DepositWindow> {
  const now = Date.now();
  let cursor = startMs;

  while (cursor < now) {
    const windowEnd = Math.min(cursor + MS_90D - 1, now);
    const batch     = await fetchDeposits(cursor, windowEnd, apiKey, apiSecret);
    yield { batch, windowStart: cursor, windowEnd };
    cursor = windowEnd + 1;
  }
}

export async function* fetchAllWithdrawalsWindowed(
  startMs: number,
  apiKey: string,
  apiSecret: string,
): AsyncGenerator<WithdrawWindow> {
  const now = Date.now();
  let cursor = startMs;

  while (cursor < now) {
    const windowEnd = Math.min(cursor + MS_90D - 1, now);
    const batch     = await fetchWithdrawals(cursor, windowEnd, apiKey, apiSecret);
    yield { batch, windowStart: cursor, windowEnd };
    cursor = windowEnd + 1;
  }
}
