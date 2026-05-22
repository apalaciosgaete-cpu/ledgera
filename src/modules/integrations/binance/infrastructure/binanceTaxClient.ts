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
      // Extract HTTP status from error message if present ("→ 400:", "→ 403:", etc.)
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
