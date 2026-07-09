import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/shared";
import { fail } from "@/shared/apiResponse";
import { buildUserScopeWhere } from "@/modules/identity/domain/accessPolicy";
import { normalizeSymbol, round } from "@/shared/utils/math";

// Force dynamic rendering because routes use request.headers/cookies
export const dynamic = "force-dynamic";

type RawMovement = {
  id: string;
  type: string;
  symbol: string;
  quantity: number;
  priceUsd: number;
  feeUsd: number | null;
  executedAt: Date;
};

type Position = {
  symbol: string;
  quantity: number;
  averageCostUsd: number;
  costBasisUsd: number;
  operations: number;
  lastDate: Date;
  needsReview: boolean;
};

type FxSnapshot = { value: number; source: string; cachedAt: number };
type PriceSnapshot = { data: Record<string, { priceUsd: number | null; source: string }>; cachedAt: number };

const EXTERNAL_FETCH_TIMEOUT_MS = 1_800;
const MARKET_CACHE_TTL_MS = 5 * 60 * 1000;
const FALLBACK_USD_CLP = 950;
const STABLE_USD = new Set(["USDT", "USDC", "DAI", "BUSD", "FDUSD", "TUSD"]);
const BINANCE_BASES = new Set([
  "BTC", "ETH", "BNB", "SOL", "XRP", "ADA", "DOGE", "TRX", "AVAX", "DOT", "LINK", "LTC", "BCH", "UNI", "AAVE", "MATIC", "POL",
]);

let fxCache: FxSnapshot | null = null;
const priceCache = new Map<string, PriceSnapshot>();

function isFresh(cachedAt: number): boolean {
  return Date.now() - cachedAt < MARKET_CACHE_TTL_MS;
}

function classify(type: string): "IN" | "OUT" | "IGNORE" {
  const clean = type.trim().toUpperCase();
  if (["BUY", "DEPOSIT", "TRANSFER_IN", "INFLOW", "STAKING_REWARD", "REWARD", "AIRDROP"].includes(clean)) return "IN";
  if (["SELL", "WITHDRAW", "TRANSFER_OUT", "OUTFLOW", "SPEND"].includes(clean)) return "OUT";
  return "IGNORE";
}

async function fetchWithTimeout(url: string, init: RequestInit = {}, timeoutMs = EXTERNAL_FETCH_TIMEOUT_MS): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
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

function setFxCache(value: number, source: string): { value: number; source: string } {
  fxCache = { value, source, cachedAt: Date.now() };
  return { value, source };
}

async function fetchUsdClp(): Promise<{ value: number; source: string }> {
  if (fxCache && isFresh(fxCache.cachedAt)) {
    return { value: fxCache.value, source: fxCache.source };
  }

  const headers = { Accept: "application/json" };

  try {
    const latestRes = await fetchWithTimeout("https://mindicador.cl/api/dolar", { headers, cache: "no-store" });
    if (latestRes.ok) {
      const latestData = await latestRes.json();
      const latestValue = readMindicadorValue(latestData);
      if (latestValue !== null) return setFxCache(latestValue, "mindicador.cl");
    }
  } catch {
    // Try dated endpoint below before using secondary provider.
  }

  try {
    const today = new Date();
    const day = String(today.getUTCDate()).padStart(2, "0");
    const month = String(today.getUTCMonth() + 1).padStart(2, "0");
    const year = today.getUTCFullYear();
    const datedRes = await fetchWithTimeout(`https://mindicador.cl/api/dolar/${day}-${month}-${year}`, { headers, cache: "no-store" });
    if (datedRes.ok) {
      const datedData = await datedRes.json();
      const datedValue = readMindicadorValue(datedData);
      if (datedValue !== null) return setFxCache(datedValue, "mindicador.cl");
    }
  } catch {
    // Try secondary provider below.
  }

  try {
    const secondaryRes = await fetchWithTimeout("https://open.er-api.com/v6/latest/USD", { headers, cache: "no-store" });
    if (secondaryRes.ok) {
      const secondaryData = await secondaryRes.json();
      const secondaryValue = readOpenExchangeValue(secondaryData);
      if (secondaryValue !== null) return setFxCache(secondaryValue, "open.er-api.com");
    }
  } catch {
    // fallback below
  }

  if (fxCache) return { value: fxCache.value, source: `${fxCache.source}:cache` };
  return setFxCache(FALLBACK_USD_CLP, "respaldo_temporal");
}

async function fetchPrices(symbols: string[]): Promise<Record<string, { priceUsd: number | null; source: string }>> {
  const result: Record<string, { priceUsd: number | null; source: string }> = {};
  const pairs = symbols.filter((symbol) => BINANCE_BASES.has(symbol)).map((symbol) => `${symbol}USDT`).sort();
  const cacheKey = pairs.join(",");

  for (const symbol of symbols) {
    result[symbol] = STABLE_USD.has(symbol) ? { priceUsd: 1, source: "stablecoin" } : { priceUsd: null, source: "sin_precio" };
  }

  if (pairs.length === 0) return result;

  const cached = priceCache.get(cacheKey);
  if (cached && isFresh(cached.cachedAt)) {
    return { ...result, ...cached.data };
  }

  try {
    const res = await fetchWithTimeout(`https://api.binance.com/api/v3/ticker/price?symbols=${encodeURIComponent(JSON.stringify(pairs))}`, { cache: "no-store" });
    if (!res.ok) throw new Error("prices");
    const data = await res.json();
    if (!Array.isArray(data)) return result;

    const fetched: Record<string, { priceUsd: number | null; source: string }> = {};
    for (const quote of data) {
      const pair = String(quote.symbol ?? "");
      const symbol = pair.replace(/USDT$/, "");
      const price = Number(quote.price);
      if (symbol && Number.isFinite(price) && price > 0) fetched[symbol] = { priceUsd: price, source: "binance" };
    }

    priceCache.set(cacheKey, { data: fetched, cachedAt: Date.now() });
    return { ...result, ...fetched };
  } catch {
    if (cached) return { ...result, ...cached.data };
    return result;
  }
}

function buildPositions(movements: RawMovement[]): Position[] {
  const map = new Map<string, Position>();

  for (const movement of movements) {
    const symbol = normalizeSymbol(String(movement.symbol));
    const quantity = Math.abs(Number(movement.quantity || 0));
    if (!symbol || !Number.isFinite(quantity) || quantity <= 0) continue;

    const direction = classify(String(movement.type));
    if (direction === "IGNORE") continue;

    const current = map.get(symbol) ?? {
      symbol,
      quantity: 0,
      averageCostUsd: 0,
      costBasisUsd: 0,
      operations: 0,
      lastDate: movement.executedAt,
      needsReview: false,
    };

    current.operations += 1;
    if (movement.executedAt.getTime() > current.lastDate.getTime()) current.lastDate = movement.executedAt;

    if (direction === "IN") {
      const movementCostUsd = quantity * Number(movement.priceUsd || 0) + Number(movement.feeUsd || 0);
      const nextQuantity = current.quantity + quantity;
      const nextCostBasisUsd = current.costBasisUsd + movementCostUsd;
      current.quantity = nextQuantity;
      current.costBasisUsd = nextCostBasisUsd;
      current.averageCostUsd = nextQuantity > 0 ? nextCostBasisUsd / nextQuantity : 0;
      if (String(movement.type).trim().toUpperCase() !== "BUY") current.needsReview = true;
    }

    if (direction === "OUT") {
      const outgoingQuantity = Math.min(quantity, current.quantity);
      current.costBasisUsd = Math.max(0, current.costBasisUsd - outgoingQuantity * current.averageCostUsd);
      current.quantity = Math.max(0, current.quantity - outgoingQuantity);
      current.averageCostUsd = current.quantity > 0 ? current.costBasisUsd / current.quantity : 0;
      if (quantity > outgoingQuantity) current.needsReview = true;
    }

    map.set(symbol, current);
  }

  return Array.from(map.values())
    .filter((position) => position.quantity > 0.00000001)
    .sort((a, b) => a.symbol.localeCompare(b.symbol));
}

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth || auth instanceof NextResponse) return fail("No autorizado.", 401);

  try {
    const movements = (await prisma.portfolioMovement.findMany({
      where: {
        deletedAt: null,
        ...buildUserScopeWhere(auth.user),
      },
      orderBy: { executedAt: "asc" },
      select: {
        id: true,
        type: true,
        symbol: true,
        quantity: true,
        priceUsd: true,
        feeUsd: true,
        executedAt: true,
      },
    })) as RawMovement[];

    const positions = buildPositions(movements);
    const [fx, prices] = await Promise.all([
      fetchUsdClp(),
      fetchPrices(positions.map((position) => position.symbol)),
    ]);

    const assets = positions.map((position) => {
      const quote = prices[position.symbol] ?? { priceUsd: null, source: "sin_precio" };
      const priceUsd = quote.priceUsd;
      const valueUsd = priceUsd === null ? null : position.quantity * priceUsd;
      const valueClp = valueUsd === null ? null : valueUsd * fx.value;
      const costBasisClp = position.costBasisUsd * fx.value;
      const unrealizedPnlClp = valueClp === null ? null : valueClp - costBasisClp;
      const unrealizedPnlPct = unrealizedPnlClp === null || costBasisClp <= 0 ? null : (unrealizedPnlClp / costBasisClp) * 100;

      return {
        symbol: position.symbol,
        quantity: round(position.quantity, 8),
        priceUsd: priceUsd === null ? null : round(priceUsd, 8),
        valueUsd: valueUsd === null ? null : round(valueUsd, 2),
        valueClp: valueClp === null ? null : round(valueClp, 0),
        averageCostUsd: round(position.averageCostUsd, 8),
        costBasisClp: round(costBasisClp, 0),
        unrealizedPnlClp: unrealizedPnlClp === null ? null : round(unrealizedPnlClp, 0),
        unrealizedPnlPct: unrealizedPnlPct === null ? null : round(unrealizedPnlPct, 2),
        operations: position.operations,
        lastDate: position.lastDate.toISOString(),
        status: priceUsd === null ? "FALTA_PRECIO" : position.needsReview ? "REVISAR_BASE" : costBasisClp <= 0 ? "FALTA_BASE" : "COMPLETO",
        priceSource: quote.source,
      };
    });

    const totals = assets.reduce(
      (acc, asset) => {
        acc.valueUsd += asset.valueUsd ?? 0;
        acc.valueClp += asset.valueClp ?? 0;
        acc.costBasisClp += asset.costBasisClp ?? 0;
        acc.unrealizedPnlClp += asset.unrealizedPnlClp ?? 0;
        return acc;
      },
      { valueUsd: 0, valueClp: 0, costBasisClp: 0, unrealizedPnlClp: 0 },
    );

    return NextResponse.json({
      ok: true,
      message: "Resumen de activos obtenido correctamente",
      data: {
        generatedAt: new Date().toISOString(),
        usdClp: round(fx.value, 4),
        fxSource: fx.source,
        totals: {
          valueUsd: round(totals.valueUsd, 2),
          valueClp: round(totals.valueClp, 0),
          costBasisClp: round(totals.costBasisClp, 0),
          unrealizedPnlClp: round(totals.unrealizedPnlClp, 0),
          unrealizedPnlPct: totals.costBasisClp > 0 ? round((totals.unrealizedPnlClp / totals.costBasisClp) * 100, 2) : null,
        },
        counts: {
          assets: assets.length,
          operations: movements.length,
          missingPrice: assets.filter((asset) => asset.status === "FALTA_PRECIO").length,
          review: assets.filter((asset) => asset.status === "REVISAR_BASE" || asset.status === "FALTA_BASE").length,
        },
        assets: assets.sort((a, b) => (b.valueClp ?? 0) - (a.valueClp ?? 0)),
      },
    });
  } catch (error) {
    const err = error as Error;
    return NextResponse.json({ ok: false, message: "Error al obtener resumen de activos", debug: { message: err.message } }, { status: 500 });
  }
}
