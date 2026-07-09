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
  source: string;
};

type Position = {
  symbol: string;
  quantity: number;
  averageCostUsd: number;
  costBasisUsd: number;
  operations: number;
  lastDate: Date;
  needsReview: boolean;
  origins: Set<string>;
};

type PriceQuote = { priceUsd: number | null; source: string };
type FxSnapshot = { value: number; source: string; cachedAt: number };
type PriceSnapshot = { data: Record<string, PriceQuote>; cachedAt: number };

const EXTERNAL_FETCH_TIMEOUT_MS = 1_800;
const MARKET_CACHE_TTL_MS = 5 * 60 * 1000;
const RECENT_FX_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
const FALLBACK_USD_CLP = 950;
const STABLE_USD = new Set(["USDT", "USDC", "DAI", "BUSD", "FDUSD", "TUSD"]);

const COINGECKO_IDS: Record<string, string> = {
  AAVE: "aave",
  ADA: "cardano",
  ALGO: "algorand",
  ARB: "arbitrum",
  ATOM: "cosmos",
  AVAX: "avalanche-2",
  AXL: "axelar",
  BCH: "bitcoin-cash",
  BNB: "binancecoin",
  BTC: "bitcoin",
  DAI: "dai",
  DOGE: "dogecoin",
  DOT: "polkadot",
  ETH: "ethereum",
  HBAR: "hedera-hashgraph",
  LINK: "chainlink",
  LTC: "litecoin",
  MATIC: "matic-network",
  METIS: "metis-token",
  MTL: "metal",
  NEAR: "near",
  OP: "optimism",
  POL: "polygon-ecosystem-token",
  SOL: "solana",
  SUI: "sui",
  TON: "the-open-network",
  TRX: "tron",
  UNI: "uniswap",
  USDC: "usd-coin",
  USDT: "tether",
  XLM: "stellar",
  XRP: "ripple",
};

let fxCache: FxSnapshot | null = null;
const priceCache = new Map<string, PriceSnapshot>();

function isFresh(cachedAt: number): boolean {
  return Date.now() - cachedAt < MARKET_CACHE_TTL_MS;
}

function isMindicadorSource(source: string | null | undefined): boolean {
  return (source ?? "").trim().toLowerCase().includes("mindicador");
}

function normalizeOriginSource(value: string | null | undefined): string {
  const original = (value ?? "").trim();
  if (!original) return "Sin origen";
  const clean = original.toLowerCase();
  if (clean.includes("binance")) return "Binance";
  if (clean.includes("buda")) return "Buda";
  if (clean.includes("coinbase")) return "Coinbase";
  if (clean.includes("kraken")) return "Kraken";
  if (clean.includes("okx")) return "OKX";
  if (clean.includes("kucoin")) return "KuCoin";
  if (clean.includes("crypto.com")) return "Crypto.com";
  if (clean === "manual") return "Manual";
  return original;
}

function formatOriginSources(origins: Set<string>): string {
  const normalized = Array.from(origins)
    .map(normalizeOriginSource)
    .filter((origin) => origin && origin !== "Sin origen");
  const unique = Array.from(new Set(normalized));
  if (unique.length === 0) return "Sin origen";
  return unique.join(", ");
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

async function getRecentStoredUsdClp(options: { officialOnly?: boolean } = {}): Promise<{ value: number; source: string } | null> {
  try {
    const closest = await prisma.fxRate.findFirst({
      where: { currency: "USD" },
      orderBy: { date: "desc" },
    });

    if (!closest || !Number.isFinite(closest.valueClp) || closest.valueClp <= 0) return null;
    if (Date.now() - closest.date.getTime() > RECENT_FX_MAX_AGE_MS) return null;
    if (options.officialOnly && !isMindicadorSource(closest.source)) return null;

    const source = isMindicadorSource(closest.source) ? "mindicador.cl:bd" : `${closest.source || "fxRate"}:bd`;
    return { value: closest.valueClp, source };
  } catch {
    return null;
  }
}

async function persistUsdClp(value: number, source: string): Promise<void> {
  try {
    const dateKey = new Date(new Date().toISOString().slice(0, 10) + "T00:00:00.000Z");
    await prisma.fxRate.upsert({
      where: { currency_date: { currency: "USD", date: dateKey } },
      update: { valueClp: value, source },
      create: { currency: "USD", date: dateKey, valueClp: value, source },
    });
  } catch {
    // No bloquear la carga del panel por persistencia de referencia FX.
  }
}

async function fetchMindicadorLatest(): Promise<{ value: number; source: string } | null> {
  const headers = { Accept: "application/json" };
  try {
    const latestRes = await fetchWithTimeout("https://mindicador.cl/api/dolar", { headers, cache: "no-store" });
    if (!latestRes.ok) return null;
    const latestData = await latestRes.json();
    const latestValue = readMindicadorValue(latestData);
    return latestValue !== null ? { value: latestValue, source: "mindicador.cl" } : null;
  } catch {
    return null;
  }
}

async function fetchMindicadorDated(): Promise<{ value: number; source: string } | null> {
  const headers = { Accept: "application/json" };
  try {
    const today = new Date();
    const day = String(today.getUTCDate()).padStart(2, "0");
    const month = String(today.getUTCMonth() + 1).padStart(2, "0");
    const year = today.getUTCFullYear();
    const datedRes = await fetchWithTimeout(`https://mindicador.cl/api/dolar/${day}-${month}-${year}`, { headers, cache: "no-store" });
    if (!datedRes.ok) return null;
    const datedData = await datedRes.json();
    const datedValue = readMindicadorValue(datedData);
    return datedValue !== null ? { value: datedValue, source: "mindicador.cl" } : null;
  } catch {
    return null;
  }
}

async function fetchSecondaryUsdClp(): Promise<{ value: number; source: string } | null> {
  try {
    const secondaryRes = await fetchWithTimeout("https://open.er-api.com/v6/latest/USD", { headers: { Accept: "application/json" }, cache: "no-store" });
    if (!secondaryRes.ok) return null;
    const secondaryData = await secondaryRes.json();
    const secondaryValue = readOpenExchangeValue(secondaryData);
    return secondaryValue !== null ? { value: secondaryValue, source: "open.er-api.com" } : null;
  } catch {
    return null;
  }
}

async function fetchUsdClp(): Promise<{ value: number; source: string }> {
  if (fxCache && isFresh(fxCache.cachedAt) && isMindicadorSource(fxCache.source)) {
    return { value: fxCache.value, source: fxCache.source };
  }

  const storedOfficial = await getRecentStoredUsdClp({ officialOnly: true });
  if (storedOfficial) return setFxCache(storedOfficial.value, storedOfficial.source);

  const [latest, dated] = await Promise.all([fetchMindicadorLatest(), fetchMindicadorDated()]);
  const mindicador = latest ?? dated;

  if (mindicador) {
    setFxCache(mindicador.value, mindicador.source);
    void persistUsdClp(mindicador.value, mindicador.source);
    return mindicador;
  }

  if (fxCache && isFresh(fxCache.cachedAt)) {
    return { value: fxCache.value, source: `${fxCache.source}:cache` };
  }

  const storedFallback = await getRecentStoredUsdClp();
  if (storedFallback) return setFxCache(storedFallback.value, storedFallback.source);

  const secondary = await fetchSecondaryUsdClp();
  if (secondary) {
    setFxCache(secondary.value, secondary.source);
    void persistUsdClp(secondary.value, secondary.source);
    return secondary;
  }

  return setFxCache(FALLBACK_USD_CLP, "respaldo_temporal");
}

function createInitialPriceMap(symbols: string[]): Record<string, PriceQuote> {
  const result: Record<string, PriceQuote> = {};
  for (const symbol of symbols) {
    result[symbol] = STABLE_USD.has(symbol) ? { priceUsd: 1, source: "stablecoin" } : { priceUsd: null, source: "sin_precio" };
  }
  return result;
}

async function fetchBinancePrices(symbols: string[]): Promise<Record<string, PriceQuote>> {
  const result: Record<string, PriceQuote> = {};
  if (symbols.length === 0) return result;

  try {
    const res = await fetchWithTimeout("https://api.binance.com/api/v3/ticker/price", { cache: "no-store" });
    if (!res.ok) return result;
    const data = await res.json();
    if (!Array.isArray(data)) return result;

    const tickers = new Map<string, number>();
    for (const quote of data) {
      const pair = String((quote as { symbol?: unknown }).symbol ?? "");
      const price = Number((quote as { price?: unknown }).price);
      if (pair.endsWith("USDT") && Number.isFinite(price) && price > 0) tickers.set(pair, price);
    }

    for (const symbol of symbols) {
      const price = tickers.get(`${symbol}USDT`);
      if (price !== undefined) result[symbol] = { priceUsd: price, source: "binance" };
    }
  } catch {
    return result;
  }

  return result;
}

async function fetchCoingeckoPrices(symbols: string[]): Promise<Record<string, PriceQuote>> {
  const result: Record<string, PriceQuote> = {};
  const ids = Array.from(new Set(symbols.map((symbol) => COINGECKO_IDS[symbol]).filter(Boolean)));
  if (ids.length === 0) return result;

  try {
    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${encodeURIComponent(ids.join(","))}&vs_currencies=usd`;
    const res = await fetchWithTimeout(url, { headers: { Accept: "application/json" }, cache: "no-store" });
    if (!res.ok) return result;
    const data = await res.json();
    if (typeof data !== "object" || data === null) return result;

    for (const symbol of symbols) {
      const id = COINGECKO_IDS[symbol];
      if (!id) continue;
      const price = Number((data as Record<string, { usd?: unknown }>)[id]?.usd);
      if (Number.isFinite(price) && price > 0) result[symbol] = { priceUsd: price, source: "coingecko" };
    }
  } catch {
    return result;
  }

  return result;
}

async function fetchPrices(symbols: string[]): Promise<Record<string, PriceQuote>> {
  const normalizedSymbols = Array.from(new Set(symbols.map((symbol) => normalizeSymbol(symbol)).filter(Boolean))).sort();
  const cacheKey = normalizedSymbols.join(",");

  const cached = priceCache.get(cacheKey);
  if (cached && isFresh(cached.cachedAt)) return cached.data;

  const result = createInitialPriceMap(normalizedSymbols);
  const nonStableSymbols = normalizedSymbols.filter((symbol) => !STABLE_USD.has(symbol));

  const [binancePrices, coingeckoPrices] = await Promise.all([fetchBinancePrices(nonStableSymbols), fetchCoingeckoPrices(nonStableSymbols)]);
  Object.assign(result, coingeckoPrices, binancePrices);

  priceCache.set(cacheKey, { data: result, cachedAt: Date.now() });
  return result;
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
      origins: new Set<string>(),
    };

    current.operations += 1;
    current.origins.add(movement.source || "Sin origen");
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
        source: true,
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
        originSource: formatOriginSources(position.origins),
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
