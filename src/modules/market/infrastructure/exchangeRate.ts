import { prisma } from "@/lib/prisma";

const FALLBACK_USD_CLP = 950;

async function fetchMindicadorRate(date: Date): Promise<number | null> {
  try {
    const d     = new Date(date);
    const day   = String(d.getUTCDate()).padStart(2, "0");
    const month = String(d.getUTCMonth() + 1).padStart(2, "0");
    const year  = d.getUTCFullYear();
    const url   = `https://mindicador.cl/api/dolar/${day}-${month}-${year}`;
    const res   = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) return null;
    const data  = await res.json();
    const valor = (data as { serie?: { valor: number }[] })?.serie?.[0]?.valor;
    return typeof valor === "number" && valor > 0 ? valor : null;
  } catch {
    return null;
  }
}

/**
 * Returns the USD/CLP rate for a given date.
 * Resolution order:
 *   1. Exact match in fxRate table
 *   2. Mindicador API (and upserts result for future use)
 *   3. Closest past rate in fxRate table
 *   4. Hardcoded fallback (950)
 */
export async function resolveUsdClpRate(date: Date): Promise<number> {
  const dateStr = date.toISOString().slice(0, 10);
  const dateKey = new Date(`${dateStr}T00:00:00.000Z`);

  try {
    const exact = await prisma.fxRate.findFirst({
      where: { currency: "USD", date: dateKey },
    });
    if (exact && Number(exact.valueClp) > 0) return Number(exact.valueClp);
  } catch { /* continuar */ }

  const fetched = await fetchMindicadorRate(date);
  if (fetched && fetched > 0) {
    try {
      await prisma.fxRate.upsert({
        where:  { currency_date: { currency: "USD", date: dateKey } },
        update: { valueClp: fetched, source: "mindicador" },
        create: { currency: "USD", date: dateKey, valueClp: fetched, source: "mindicador" },
      });
    } catch { /* no bloquear */ }
    return fetched;
  }

  try {
    const closest = await prisma.fxRate.findFirst({
      where:   { currency: "USD", date: { lte: dateKey } },
      orderBy: { date: "desc" },
    });
    if (closest && Number(closest.valueClp) > 0) return Number(closest.valueClp);
  } catch { /* continuar */ }

  return FALLBACK_USD_CLP;
}
