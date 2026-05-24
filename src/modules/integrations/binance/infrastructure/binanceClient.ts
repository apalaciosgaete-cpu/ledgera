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

// ── Connection & validation types ──────────────────────────────────────────────

type BinanceApiRestrictionsResponse = {
  ipRestrict:                   boolean;
  createTime:                   number;
  enableReading:                boolean;
  enableSpotAndMarginTrading:   boolean;
  enableWithdrawals:            boolean;
  enableInternalTransfer:       boolean;
  permitsUniversalTransfer:     boolean;
  enableVanillaOptions:         boolean;
  enableFutures:                boolean;
  enablePortfolioMarginTrading: boolean;
  enableMargin:                 boolean;
};

export type BinanceValidationResult = {
  valid:        boolean;
  error?:       string;
  binanceCode?: number;
};

export type BinancePermissionsResult = {
  readonly:    boolean;
  permissions: string[];
  error?:      string;
};

function getTimeoutMs(): number {
  const val = Number(process.env.BINANCE_REQUEST_TIMEOUT_MS ?? "15000");
  return Number.isFinite(val) && val > 0 ? val : 15_000;
}

function getApiDelayMs(): number {
  const val = Number(process.env.BINANCE_API_DELAY_MS ?? "300");
  return Number.isFinite(val) && val >= 0 ? val : 300;
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
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
    await sleep(getApiDelayMs());
    throw new Error(`Binance ${path} → ${res.status}: ${body}`);
  }

  const data = await res.json() as T;
  await sleep(getApiDelayMs());
  return data;
}

// ── Connection & validation ────────────────────────────────────────────────────

export async function getServerTime(): Promise<number> {
  const res = await fetch(`${BINANCE_BASE_URL}/api/v3/time`);
  if (!res.ok) throw new Error(`No se pudo contactar Binance: HTTP ${res.status}`);
  const data = await res.json() as { serverTime: number };
  return data.serverTime;
}

export async function validateApiKey(
  apiKey:    string,
  apiSecret: string,
): Promise<BinanceValidationResult> {
  try {
    await binanceFetch<BinanceApiRestrictionsResponse>(
      "/sapi/v1/account/apiRestrictions",
      {},
      apiKey,
      apiSecret,
    );
    return { valid: true };
  } catch (err: unknown) {
    const e   = err as Error & { binanceCode?: number };
    const msg = e.message ?? "Error desconocido";
    const match = /→ \d+: (.*)/.exec(msg);
    try {
      const body        = JSON.parse(match?.[1] ?? "{}") as { code?: number; msg?: string };
      return { valid: false, error: body.msg ?? msg, binanceCode: body.code };
    } catch {
      return { valid: false, error: msg };
    }
  }
}

export async function validateReadonlyPermissions(
  apiKey:    string,
  apiSecret: string,
): Promise<BinancePermissionsResult> {
  let data: BinanceApiRestrictionsResponse;

  try {
    data = await binanceFetch<BinanceApiRestrictionsResponse>(
      "/sapi/v1/account/apiRestrictions",
      {},
      apiKey,
      apiSecret,
    );
  } catch (err: unknown) {
    const e = err as Error;
    return { readonly: false, permissions: [], error: e.message };
  }

  const permissions: string[] = [];
  if (data.enableReading)              permissions.push("READ");
  if (data.enableSpotAndMarginTrading) permissions.push("SPOT_TRADING");
  if (data.enableWithdrawals)          permissions.push("WITHDRAWALS");
  if (data.enableFutures)              permissions.push("FUTURES");
  if (data.enableMargin)               permissions.push("MARGIN");
  if (data.enableInternalTransfer)     permissions.push("INTERNAL_TRANSFER");

  const readonly =
    data.enableReading              === true &&
    data.enableSpotAndMarginTrading === false &&
    data.enableWithdrawals          === false;

  return { readonly, permissions };
}

// ── Data fetching ──────────────────────────────────────────────────────────────

export async function fetchAccountInfo(
  apiKey: string,
  apiSecret: string,
): Promise<BinanceAccountInfo> {
  return binanceFetch<BinanceAccountInfo>("/api/v3/account", { recvWindow: 10000 }, apiKey, apiSecret);
}

export async function fetchTradesForSymbol(
  symbol: string,
  startTime: number,
  apiKey: string,
  apiSecret: string,
): Promise<BinanceTradeRaw[]> {
  // endTime is intentionally omitted: Binance rejects windows > 24h (-1127).
  // Passing only startTime returns up to 1000 trades from that point forward.
  return binanceFetch<BinanceTradeRaw[]>(
    "/api/v3/myTrades",
    { symbol, startTime, limit: 1000 },
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
  symbol:    string,
  startMs:   number,
  apiKey:    string,
  apiSecret: string,
  endMs?:    number,
): AsyncGenerator<TradeWindow> {
  const ceiling = endMs !== undefined ? Math.min(endMs, Date.now()) : Date.now();
  let   cursor  = startMs;

  // endTime is NOT sent to Binance: the API rejects windows > 24h (-1127).
  // Without endTime, Binance returns up to 1000 trades from cursor forward.
  // We filter by ceiling locally and paginate only if exactly 1000 returned.
  while (cursor <= ceiling) {
    const raw = await fetchTradesForSymbol(symbol, cursor, apiKey, apiSecret);
    if (raw.length === 0) break;

    const batch = raw.filter(t => t.time <= ceiling);
    if (batch.length > 0) {
      yield { batch, windowStart: cursor, windowEnd: ceiling };
    }

    // If all 1000 results are within ceiling, there may be more — paginate.
    if (raw.length < 1000 || raw[raw.length - 1].time > ceiling) break;
    cursor = raw[raw.length - 1].time + 1;
  }
}

export async function* fetchAllDepositsWindowed(
  startMs:  number,
  apiKey:   string,
  apiSecret: string,
  endMs?:   number,
): AsyncGenerator<DepositWindow> {
  const ceiling = endMs !== undefined ? Math.min(endMs, Date.now()) : Date.now();
  let cursor = startMs;

  while (cursor < ceiling) {
    const windowEnd = Math.min(cursor + MS_90D - 1, ceiling);
    const batch     = await fetchDeposits(cursor, windowEnd, apiKey, apiSecret);
    yield { batch, windowStart: cursor, windowEnd };
    cursor = windowEnd + 1;
  }
}

export async function* fetchAllWithdrawalsWindowed(
  startMs:  number,
  apiKey:   string,
  apiSecret: string,
  endMs?:   number,
): AsyncGenerator<WithdrawWindow> {
  const ceiling = endMs !== undefined ? Math.min(endMs, Date.now()) : Date.now();
  let cursor = startMs;

  while (cursor < ceiling) {
    const windowEnd = Math.min(cursor + MS_90D - 1, ceiling);
    const batch     = await fetchWithdrawals(cursor, windowEnd, apiKey, apiSecret);
    yield { batch, windowStart: cursor, windowEnd };
    cursor = windowEnd + 1;
  }
}
