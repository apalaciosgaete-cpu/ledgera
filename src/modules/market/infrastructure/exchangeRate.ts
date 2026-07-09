import { prisma } from "@/lib/prisma";

const FALLBACK_USD_CLP = 950;
const EXTERNAL_FETCH_TIMEOUT_MS = 1_800;
const FX_CACHE_TTL_MS = 60_000;

const fxCache = new Map<string, { value: number; expiresAt: number }>();

function formatMindicadorDate(date: Date): string {
  const d = new Date(date);
  const day = String(d.getUTCDate()).padStart(2, "0");
  const month = String(d.getUTCMonth() + 1).padStart(2, "0");
  const year = d.getUTCFullYear();
  return `${day}-${month}-${year}`;
}

function readMindicadorValue(data: unknown): number | null {
  if (typeof data !== "object" || data === null) return null;
  const serie = (data as { serie?: unknown }).serie;
  if (!Array.isArray(serie)) return null;

  for (const entry of serie) {
    if (typeof entry !== "object" || entry === null) continue;
    const value = (entry as { valor?: unknown }).valor;
    if (typeof value === "number" && Number.isFinite(value) && value > 0) return value;
  }

  return null;
}

function readOpenExchangeValue(data: unknown): number | null {
  if (typeof data !== "object" || data === null) return null;
  const rates = (data as { rates?: unknown; conversion_rates?: unknown }).rates ?? (data as { conversion_rates?: unknown }).conversion_rates;
  if (typeof rates !== "object" || rates === null) return null;
  const value = (rates as { CLP?: unknown }).CLP;
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : null;
}

async function fetchMindicadorRate(date: Date): Promise<number | null> {
  const headers = { Accept: "application/json" };

  try {
    const latest = await fetch("https://mindicador.cl/api/dolar", {
      headers,
      cache: "no-store",
      signal: AbortSignal.timeout(EXTERNAL_FETCH_TIMEOUT_MS),
    });
    if (latest.ok) {
      const data = await latest.json();
      const value = readMindicadorValue(data);
      if (value !== null) return value;
    }
  } catch {
    // Try dated endpoint below.
  }

  try {
    const res = await fetch(`https://mindicador.cl/api/dolar/${formatMindicadorDate(date)}`, {
      headers,
      cache: "no-store",
      signal: AbortSignal.timeout(EXTERNAL_FETCH_TIMEOUT_MS),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return readMindicadorValue(data);
  } catch {
    return null;
  }
}

async function fetchSecondaryUsdClpRate(): Promise<number | null> {
  try {
    const res = await fetch("https://open.er-api.com/v6/latest/USD", {
      headers: { Accept: "application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(EXTERNAL_FETCH_TIMEOUT_MS),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return readOpenExchangeValue(data);
  } catch {
    return null;
  }
}

/**
 * Returns the USD/CLP rate for a given date.
 * Resolution order:
 *   1. Exact match in fxRate table
 *   2. Latest Mindicador API value, then dated Mindicador endpoint
 *   3. Secondary public FX provider for operational continuity
 *   4. Closest past rate in fxRate table
 *   5. Temporary support value when no source is available
 */
export async function resolveUsdClpRate(date: Date): Promise<number> {
  const dateStr = date.toISOString().slice(0, 10);
  const dateKey = new Date(`${dateStr}T00:00:00.000Z`);

  const cached = fxCache.get(dateStr);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.value;
  }

  let rate: number | null = null;
  let source = "unknown";

  try {
    const exact = await prisma.fxRate.findFirst({
      where: { currency: "USD", date: dateKey },
    });
    if (exact && Number(exact.valueClp) > 0) {
      rate = Number(exact.valueClp);
      source = exact.source || "fxRate";
    }
  } catch { /* continuar */ }

  if (rate === null) {
    const fetched = await fetchMindicadorRate(date);
    if (fetched && fetched > 0) {
      rate = fetched;
      source = "mindicador.cl";
    }
  }

  if (rate === null) {
    const secondary = await fetchSecondaryUsdClpRate();
    if (secondary && secondary > 0) {
      rate = secondary;
      source = "open.er-api.com";
    }
  }

  if (rate !== null && source !== "fxRate") {
    try {
      await prisma.fxRate.upsert({
        where: { currency_date: { currency: "USD", date: dateKey } },
        update: { valueClp: rate, source },
        create: { currency: "USD", date: dateKey, valueClp: rate, source },
      });
    } catch { /* no bloquear */ }
  }

  if (rate === null) {
    try {
      const closest = await prisma.fxRate.findFirst({
        where: { currency: "USD", date: { lte: dateKey } },
        orderBy: { date: "desc" },
      });
      if (closest && Number(closest.valueClp) > 0) rate = Number(closest.valueClp);
    } catch { /* continuar */ }
  }

  if (rate === null) {
    if (cached) return cached.value;
    rate = FALLBACK_USD_CLP;
  }

  fxCache.set(dateStr, { value: rate, expiresAt: Date.now() + FX_CACHE_TTL_MS });
  return rate;
}
