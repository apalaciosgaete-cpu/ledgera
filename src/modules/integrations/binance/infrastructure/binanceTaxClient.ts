import { BINANCE_BASE_URL } from "../domain/binanceTypes";
import { buildSignedParams } from "./binanceSigner";

function getTimeoutMs(): number {
  const val = Number(process.env.BINANCE_REQUEST_TIMEOUT_MS ?? "15000");
  return Number.isFinite(val) && val > 0 ? val : 15_000;
}

async function binanceTaxFetch<T>(
  path:      string,
  params:    Record<string, string | number>,
  apiKey:    string,
  apiSecret: string,
): Promise<T> {
  const qs  = buildSignedParams(params, apiSecret);
  const url = `${BINANCE_BASE_URL}${path}?${qs}`;

  const res = await fetch(url, {
    headers: { "X-MBX-APIKEY": apiKey },
    cache:   "no-store",
    signal:  AbortSignal.timeout(getTimeoutMs()),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Binance Tax API ${path} → ${res.status}: ${body}`);
  }

  return (await res.json()) as T;
}

export async function validateBinanceTaxCredentials(
  apiKey:    string,
  apiSecret: string,
): Promise<boolean> {
  await binanceTaxFetch("/api/v3/account", { recvWindow: 10000 }, apiKey, apiSecret);
  return true;
}

// ── Generic endpoint probe ─────────────────────────────────────────────────────

type ProbeResult = {
  path:    string;
  ok:      boolean;
  status?: number;
  sample?: unknown;
  error?:  string;
};

const TAX_ENDPOINT_CANDIDATES = [
  "/sapi/v1/tax/query",
  "/sapi/v1/tax/transactions",
  "/sapi/v1/tax/report",
  "/sapi/v1/accountSnapshot",
  "/sapi/v1/capital/deposit/hisrec",
  "/sapi/v1/capital/withdraw/history",
] as const;

export async function probeBinanceTaxApi(
  apiKey:    string,
  apiSecret: string,
): Promise<ProbeResult[]> {
  const results: ProbeResult[] = [];

  for (const path of TAX_ENDPOINT_CANDIDATES) {
    try {
      const data = await binanceTaxFetch<unknown>(
        path,
        { recvWindow: 10000 },
        apiKey,
        apiSecret,
      );
      results.push({ path, ok: true, sample: data });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      const statusMatch = /→ (\d{3})/.exec(msg);
      results.push({
        path,
        ok:     false,
        status: statusMatch ? Number(statusMatch[1]) : undefined,
        error:  msg,
      });
    }
  }

  return results;
}

// ── Product probe ──────────────────────────────────────────────────────────────

export type ProductProbeResult = {
  product:    string;
  path:       string;
  ok:         boolean;
  status:     number | null;
  accessible: boolean;  // 200 OR 400 — endpoint exists even if params were wrong
  hasData:    boolean;
  sample:     unknown;
  error:      string | null;
};

type ProductProbeSpec = {
  product: string;
  path:    string;
  params:  Record<string, string | number>;
};

async function rawFetch(
  path:      string,
  params:    Record<string, string | number>,
  apiKey:    string,
  apiSecret: string,
): Promise<{ status: number; body: unknown }> {
  const merged = { recvWindow: 10000, ...params };
  const qs     = buildSignedParams(merged, apiSecret);
  const url    = `${BINANCE_BASE_URL}${path}?${qs}`;
  try {
    const res = await fetch(url, {
      headers: { "X-MBX-APIKEY": apiKey },
      cache:   "no-store",
      signal:  AbortSignal.timeout(getTimeoutMs()),
    });
    let body: unknown = null;
    try { body = await res.json(); } catch { body = await res.text().catch(() => null); }
    return { status: res.status, body };
  } catch (err) {
    return { status: 0, body: { _netError: err instanceof Error ? err.message : String(err) } };
  }
}

function extractSample(body: unknown): { hasData: boolean; sample: unknown } {
  if (!body) return { hasData: false, sample: null };
  if (Array.isArray(body)) {
    return { hasData: body.length > 0, sample: body[0] ?? null };
  }
  if (typeof body === "object" && body !== null) {
    const b = body as Record<string, unknown>;
    for (const key of ["data", "rows", "list", "result", "records"]) {
      const v = b[key];
      if (Array.isArray(v)) return { hasData: v.length > 0, sample: v[0] ?? null };
    }
    if (typeof b["total"] === "number" && b["total"] > 0) return { hasData: true, sample: body };
    return { hasData: false, sample: body };
  }
  return { hasData: false, sample: body };
}

function extractError(status: number, body: unknown): string | null {
  if (status === 0) {
    const b = body as Record<string, unknown> | null;
    return String(b?._netError ?? "timeout / network error");
  }
  if (typeof body === "object" && body !== null) {
    const b = body as Record<string, unknown>;
    const msg = b["msg"] ?? b["message"] ?? b["error"];
    return `HTTP ${status}${msg ? `: ${String(msg)}` : ""}`;
  }
  return `HTTP ${status}`;
}

export async function probeAllProducts(
  apiKey:    string,
  apiSecret: string,
): Promise<ProductProbeResult[]> {
  const now           = Date.now();
  const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;

  const specs: ProductProbeSpec[] = [
    { product: "Spot Trades",   path: "/api/v3/myTrades",                                       params: { symbol: "BTCUSDT", limit: 5 } },
    { product: "Convert",       path: "/sapi/v1/convert/tradeFlow",                              params: { startTime: thirtyDaysAgo, endTime: now } },
    { product: "Pay",           path: "/sapi/v1/pay/transactions",                               params: {} },
    { product: "Earn Flexible", path: "/sapi/v1/simple-earn/flexible/history/rewardsRecord",     params: { size: 1 } },
    { product: "Earn Locked",   path: "/sapi/v1/simple-earn/locked/history/rewardsRecord",       params: { size: 1 } },
    { product: "P2P",           path: "/sapi/v1/c2c/orderMatch/listUserOrderHistory",            params: { tradeType: "BUY" } },
    { product: "Distribution",  path: "/sapi/v1/asset/assetDividend",                            params: { limit: 5 } },
    { product: "Transfers",     path: "/sapi/v1/asset/transfer",                                 params: { type: "MAIN_UMFUTURE", size: 1 } },
  ];

  const results: ProductProbeResult[] = [];

  for (const spec of specs) {
    const { status, body } = await rawFetch(spec.path, spec.params, apiKey, apiSecret);
    const ok         = status === 200;
    const accessible = status === 200 || status === 400;
    const { hasData, sample } = ok ? extractSample(body) : { hasData: false, sample: null };
    const error = ok ? null : extractError(status, body);

    results.push({
      product: spec.product,
      path:    spec.path,
      ok,
      status:  status === 0 ? null : status,
      accessible,
      hasData,
      sample,
      error,
    });
  }

  return results;
}

// ── Monthly scan ───────────────────────────────────────────────────────────────

export type BinanceTaxScanProduct = {
  product: string;
  path:    string;
  ok:      boolean;
  status:  number | null;
  count:   number;
  sample:  unknown;
  error:   string | null;
};

function monthRangeUtc(year: number, month: number): { startTime: number; endTime: number } {
  const startTime = Date.UTC(year, month - 1, 1, 0, 0, 0, 0);
  const endTime   = Date.UTC(year, month,     1, 0, 0, 0, 0) - 1;
  return { startTime, endTime };
}

function countRows(body: unknown): { count: number; sample: unknown } {
  if (!body) return { count: 0, sample: null };

  if (Array.isArray(body)) {
    return { count: body.length, sample: body[0] ?? null };
  }

  if (typeof body === "object" && body !== null) {
    const b = body as Record<string, unknown>;

    for (const key of ["data", "rows", "list", "result", "records"]) {
      const value = b[key];
      if (Array.isArray(value)) {
        return { count: value.length, sample: value[0] ?? null };
      }
    }

    if (typeof b.total === "number") {
      return { count: b.total, sample: body };
    }

    return { count: 0, sample: body };
  }

  return { count: 0, sample: body };
}

export async function scanBinanceTaxProductsByMonth(
  apiKey:    string,
  apiSecret: string,
  year:      number,
  month:     number,
): Promise<BinanceTaxScanProduct[]> {
  const { startTime, endTime } = monthRangeUtc(year, month);

  const specs: ProductProbeSpec[] = [
    { product: "Spot Trades BTCUSDT",    path: "/api/v3/myTrades",                                    params: { symbol: "BTCUSDT",     startTime, endTime, limit: 1000 } },
    { product: "Spot Trades XRPUSDT",    path: "/api/v3/myTrades",                                    params: { symbol: "XRPUSDT",     startTime, endTime, limit: 1000 } },
    { product: "Convert",                path: "/sapi/v1/convert/tradeFlow",                           params: {                        startTime, endTime, limit: 1000 } },
    { product: "Pay",                    path: "/sapi/v1/pay/transactions",                            params: {                        startTime, endTime, limit: 100  } },
    { product: "Earn Flexible Rewards",  path: "/sapi/v1/simple-earn/flexible/history/rewardsRecord", params: { type: "REWARDS",       startTime, endTime, size:  100  } },
    { product: "Earn Locked Rewards",    path: "/sapi/v1/simple-earn/locked/history/rewardsRecord",   params: {                        startTime, endTime, size:  100  } },
    { product: "P2P BUY",               path: "/sapi/v1/c2c/orderMatch/listUserOrderHistory",         params: { tradeType: "BUY",      startTime, endTime              } },
    { product: "P2P SELL",              path: "/sapi/v1/c2c/orderMatch/listUserOrderHistory",         params: { tradeType: "SELL",     startTime, endTime              } },
    { product: "Distribution",           path: "/sapi/v1/asset/assetDividend",                        params: {                        startTime, endTime, limit: 500  } },
    { product: "Transfers",              path: "/sapi/v1/asset/transfer",                              params: { type: "MAIN_UMFUTURE", startTime, endTime, size:  100  } },
    { product: "Deposits",               path: "/sapi/v1/capital/deposit/hisrec",                     params: {                        startTime, endTime              } },
    { product: "Withdrawals",            path: "/sapi/v1/capital/withdraw/history",                   params: {                        startTime, endTime              } },
  ];

  const results: BinanceTaxScanProduct[] = [];

  for (const spec of specs) {
    const { status, body } = await rawFetch(spec.path, spec.params, apiKey, apiSecret);
    const ok               = status === 200;
    const { count, sample } = ok ? countRows(body) : { count: 0, sample: null };

    results.push({
      product: spec.product,
      path:    spec.path,
      ok,
      status:  status === 0 ? null : status,
      count,
      sample,
      error:   ok ? null : extractError(status, body),
    });
  }

  return results;
}
