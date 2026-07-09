import { prisma } from "@/lib/prisma";

const FALLBACK_USD_CLP = 950;
const FX_CACHE_TTL_MS = 60_000;

const fxCache = new Map<string, { value: number; expiresAt: number }>();

function formatMindicadorDate(date: Date): string {
  const d     = new Date(date);
  const day   = String(d.getUTCDate()).padStart(2, "0");
  const month = String(d.getUTCMonth() + 1).padStart(2, "0");
  const year  = d.getUTCFullYear();
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

async function fetchMindicadorRate(date: Date): Promise<number | null> {
  const headers = { Accept: "application/json" };

  try {
    const latest = await fetch("https://mindicador.cl/api/dolar", {
      headers,
      cache: "no-store",
      signal: AbortSignal.timeout(4500),
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
      signal: AbortSignal.timeout(4500),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return readMindicadorValue(data);
  } catch {
    return null;
  }
}

/**
 * Returns the USD/CLP rate for a given date.
 * Resolution order:
 *   1. Exact match in fxRate table
 *   2. Latest Mindicador API value, then dated Mindicador endpoint
 *   3. Closest past rate in fxRate table
 *   4. Temporary support value when no source is available
 */
export async function resolveUsdClpRate(date: Date): Promise<number> {
  const dateStr = date.toISOString().slice(0, 10);
  const dateKey = new Date(`${dateStr}T00:00:00.000Z`);

  const cached = fxCache.get(dateStr);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.value;
  }

  let rate: number | null = null;

  try {
    const exact = await prisma.fxRate.findFirst({
      where: { currency: "USD", date: dateKey },
    });
    if (exact && Number(exact.valueClp) > 0) rate = Number(exact.valueClp);
  } catch { /* continuar */ }

  if (rate === null) {
    const fetched = await fetchMindicadorRate(date);
    if (fetched && fetched > 0) {
      try {
        await prisma.fxRate.upsert({
          where:  { currency_date: { currency: "USD", date: dateKey } },
          update: { valueClp: fetched, source: "mindicador.cl" },
          create: { currency: "USD", date: dateKey, valueClp: fetched, source: "mindicador.cl" },
        });
      } catch { /* no bloquear */ }
      rate = fetched;
    }
  }

  if (rate === null) {
    try {
      const closest = await prisma.fxRate.findFirst({
        where:   { currency: "USD", date: { lte: dateKey } },
        orderBy: { date: "desc" },
      });
      if (closest && Number(closest.valueClp) > 0) rate = Number(closest.valueClp);
    } catch { /* continuar */ }
  }

  if (rate === null) {
    if (cached) {
      return cached.value;
    }
    rate = FALLBACK_USD_CLP;
  }

  fxCache.set(dateStr, { value: rate, expiresAt: Date.now() + FX_CACHE_TTL_MS });
  return rate;
}
