import { round, normalizeSymbol as sharedNormalizeSymbol } from "@/shared/utils/math";

export type PortfolioMovementType = "BUY" | "SELL" | "DEPOSIT" | "WITHDRAW" | "STAKING_REWARD";

export interface PortfolioMovement {
  id: string;
  type: PortfolioMovementType;
  symbol: string;
  quantity: number;
  priceUsd: number;
  feeUsd?: number;
  occurredAt?: string | Date;
}

interface PositionAccumulator {
  symbol: string;
  quantity: number;
  totalCostUsd: number;
  boughtQuantity: number;
  soldQuantity: number;
  depositedQuantity: number;
  withdrawnQuantity: number;
  stakingRewardQuantity: number;
  buyCostUsd: number;
  sellProceedsUsd: number;
  depositValueUsd: number;
  stakingRewardValueUsd: number;
  buyFeesUsd: number;
  sellFeesUsd: number;
}

export interface CalculatedPortfolioPosition {
  symbol: string;
  quantity: number;
  averageCostUsd: number;
  totalCostUsd: number;
  averageCostClp: number;
  totalCostClp: number;
  boughtQuantity: number;
  soldQuantity: number;
  depositedQuantity: number;
  withdrawnQuantity: number;
  stakingRewardQuantity: number;
  buyCostUsd: number;
  sellProceedsUsd: number;
  depositValueUsd: number;
  stakingRewardValueUsd: number;
  capitalContributedUsd: number;
  buyFeesUsd: number;
  sellFeesUsd: number;
  buyCostClp: number;
  sellProceedsClp: number;
  depositValueClp: number;
  stakingRewardValueClp: number;
  capitalContributedClp: number;
}

export interface CalculatedPortfolioTotals {
  symbolCount: number;
  totalQuantity: number;
  totalCostUsd: number;
  totalCostClp: number;
  totalBoughtQuantity: number;
  totalSoldQuantity: number;
  totalStakingRewardQuantity: number;
  totalBuyCostUsd: number;
  totalSellProceedsUsd: number;
  totalStakingRewardValueUsd: number;
  totalCapitalContributedUsd: number;
  totalBuyCostClp: number;
  totalSellProceedsClp: number;
  totalStakingRewardValueClp: number;
  totalCapitalContributedClp: number;
}

export interface CalculatedPortfolioFx {
  usdToClp: number;
  source: string;
  asOf: string;
}

export interface CalculatedPortfolio {
  positions: CalculatedPortfolioPosition[];
  totals: CalculatedPortfolioTotals;
  fx: CalculatedPortfolioFx;
}

type FxCache = { rate: number; source: string; asOf: string; cachedAt: number };
let fxCache: FxCache | null = null;
const FX_TTL_MS = 15 * 60 * 1000;
const FALLBACK_USD_CLP = 950;

function formatMindicadorDate(date: Date): string {
  const day = String(date.getUTCDate()).padStart(2, "0");
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const year = date.getUTCFullYear();
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

async function fetchUsdClp(): Promise<{ rate: number; source: string; asOf: string }> {
  const now = Date.now();
  if (fxCache && now - fxCache.cachedAt < FX_TTL_MS) {
    return { rate: fxCache.rate, source: fxCache.source, asOf: fxCache.asOf };
  }

  const asOf = new Date().toISOString();
  const headers = { Accept: "application/json" };

  try {
    const res = await fetch("https://mindicador.cl/api/dolar", {
      headers,
      cache: "no-store",
      signal: AbortSignal.timeout(4500),
    });
    if (res.ok) {
      const data = await res.json();
      const value = readMindicadorValue(data);
      if (value !== null) {
        fxCache = { rate: value, source: "mindicador.cl", asOf, cachedAt: now };
        return { rate: value, source: "mindicador.cl", asOf };
      }
    }
  } catch {
    // Try dated endpoint below before using fallback.
  }

  try {
    const today = new Date();
    const res = await fetch(`https://mindicador.cl/api/dolar/${formatMindicadorDate(today)}`, {
      headers,
      cache: "no-store",
      signal: AbortSignal.timeout(4500),
    });
    if (res.ok) {
      const data = await res.json();
      const value = readMindicadorValue(data);
      if (value !== null) {
        fxCache = { rate: value, source: "mindicador.cl", asOf, cachedAt: now };
        return { rate: value, source: "mindicador.cl", asOf };
      }
    }
  } catch {
    // fallback below
  }

  const fallback = { rate: FALLBACK_USD_CLP, source: "respaldo_temporal", asOf };
  fxCache = { ...fallback, cachedAt: now };
  return fallback;
}

function convertUsdToClp(amountUsd: number, rate: number): number {
  return Math.round(amountUsd * rate * 100) / 100;
}

function normalizeMovementType(type: string): PortfolioMovementType | null {
  if (type === "BUY" || type === "SELL" || type === "DEPOSIT" || type === "WITHDRAW" || type === "STAKING_REWARD") return type;
  return null;
}

function toTimestamp(occurredAt?: string | Date): number {
  if (!occurredAt) return 0;
  const ts = new Date(occurredAt).getTime();
  return Number.isFinite(ts) ? ts : 0;
}

function createAccumulator(symbol: string): PositionAccumulator {
  return {
    symbol,
    quantity: 0,
    totalCostUsd: 0,
    boughtQuantity: 0,
    soldQuantity: 0,
    depositedQuantity: 0,
    withdrawnQuantity: 0,
    stakingRewardQuantity: 0,
    buyCostUsd: 0,
    sellProceedsUsd: 0,
    depositValueUsd: 0,
    stakingRewardValueUsd: 0,
    buyFeesUsd: 0,
    sellFeesUsd: 0,
  };
}

export async function prefetchFx(): Promise<{ usdToClp: number; source: string; asOf: string }> {
  const { rate, source, asOf } = await fetchUsdClp();
  return { usdToClp: rate, source, asOf };
}

export async function calculatePortfolio(movements: PortfolioMovement[]): Promise<CalculatedPortfolio> {
  const sortedMovements = [...movements].sort((a, b) => toTimestamp(a.occurredAt) - toTimestamp(b.occurredAt));
  const positionsMap = new Map<string, PositionAccumulator>();

  for (const movement of sortedMovements) {
    const type = normalizeMovementType(movement.type);
    const symbol = sharedNormalizeSymbol(movement.symbol);
    const quantity = Number(movement.quantity);
    const priceUsd = Number(movement.priceUsd);
    const feeUsd = Number(movement.feeUsd ?? 0);

    if (!type) continue;
    if (!symbol) continue;
    if (!Number.isFinite(quantity) || quantity <= 0) continue;
    if (!Number.isFinite(priceUsd) || priceUsd < 0) continue;
    if (!Number.isFinite(feeUsd) || feeUsd < 0) continue;

    const current = positionsMap.get(symbol) ?? createAccumulator(symbol);

    if (type === "BUY") {
      const buyTotalCostUsd = quantity * priceUsd + feeUsd;
      current.quantity += quantity;
      current.totalCostUsd += buyTotalCostUsd;
      current.boughtQuantity += quantity;
      current.buyCostUsd += buyTotalCostUsd;
      current.buyFeesUsd += feeUsd;
      positionsMap.set(symbol, current);
      continue;
    }

    if (type === "DEPOSIT") {
      const depositValueUsd = quantity * priceUsd;
      current.quantity += quantity;
      current.totalCostUsd += depositValueUsd;
      current.depositedQuantity += quantity;
      current.depositValueUsd += depositValueUsd;
      positionsMap.set(symbol, current);
      continue;
    }

    if (type === "STAKING_REWARD") {
      const stakingRewardValueUsd = quantity * priceUsd;
      current.quantity += quantity;
      current.totalCostUsd += stakingRewardValueUsd;
      current.stakingRewardQuantity += quantity;
      current.stakingRewardValueUsd += stakingRewardValueUsd;
      positionsMap.set(symbol, current);
      continue;
    }

    if (type === "SELL") {
      const sellQuantity = current.quantity > 0 ? Math.min(quantity, current.quantity) : quantity;
      const averageCostUsd = current.quantity > 0 ? current.totalCostUsd / current.quantity : 0;
      current.quantity -= sellQuantity;
      current.totalCostUsd -= Math.min(sellQuantity, Math.max(current.quantity + sellQuantity, 0)) * averageCostUsd;
      current.soldQuantity += quantity;
      current.sellProceedsUsd += quantity * priceUsd - feeUsd;
      current.sellFeesUsd += feeUsd;
    }

    if (type === "WITHDRAW") {
      const withdrawQuantity = current.quantity > 0 ? Math.min(quantity, current.quantity) : quantity;
      const averageCostUsd = current.quantity > 0 ? current.totalCostUsd / current.quantity : 0;
      current.quantity -= withdrawQuantity;
      current.totalCostUsd -= Math.min(withdrawQuantity, Math.max(current.quantity + withdrawQuantity, 0)) * averageCostUsd;
      current.withdrawnQuantity += quantity;
    }

    if (Math.abs(current.quantity) < 0.0000001) current.quantity = 0;
    if (Math.abs(current.totalCostUsd) < 0.0000001) current.totalCostUsd = 0;
    positionsMap.set(symbol, current);
  }

  const fxRate = await fetchUsdClp();
  const positions: CalculatedPortfolioPosition[] = [];

  for (const [, position] of positionsMap) {
    const averageCostUsd = position.quantity > 0 ? position.totalCostUsd / position.quantity : 0;
    const totalCostClpRaw = convertUsdToClp(position.totalCostUsd, fxRate.rate);
    const averageCostClpRaw = position.quantity > 0 ? totalCostClpRaw / position.quantity : 0;
    const capitalContributedUsd = position.buyCostUsd + position.depositValueUsd;

    positions.push({
      symbol: position.symbol,
      quantity: round(position.quantity, 8),
      averageCostUsd: round(averageCostUsd, 2),
      totalCostUsd: round(position.totalCostUsd, 2),
      averageCostClp: round(averageCostClpRaw, 2),
      totalCostClp: round(totalCostClpRaw, 2),
      boughtQuantity: round(position.boughtQuantity, 8),
      soldQuantity: round(position.soldQuantity, 8),
      depositedQuantity: round(position.depositedQuantity, 8),
      withdrawnQuantity: round(position.withdrawnQuantity, 8),
      stakingRewardQuantity: round(position.stakingRewardQuantity, 8),
      buyCostUsd: round(position.buyCostUsd, 2),
      sellProceedsUsd: round(position.sellProceedsUsd, 2),
      depositValueUsd: round(position.depositValueUsd, 2),
      stakingRewardValueUsd: round(position.stakingRewardValueUsd, 2),
      capitalContributedUsd: round(capitalContributedUsd, 2),
      buyFeesUsd: round(position.buyFeesUsd, 2),
      sellFeesUsd: round(position.sellFeesUsd, 2),
      buyCostClp: round(convertUsdToClp(position.buyCostUsd, fxRate.rate), 2),
      sellProceedsClp: round(convertUsdToClp(position.sellProceedsUsd, fxRate.rate), 2),
      depositValueClp: round(convertUsdToClp(position.depositValueUsd, fxRate.rate), 2),
      stakingRewardValueClp: round(convertUsdToClp(position.stakingRewardValueUsd, fxRate.rate), 2),
      capitalContributedClp: round(convertUsdToClp(capitalContributedUsd, fxRate.rate), 2),
    });
  }

  positions.sort((a, b) => a.symbol.localeCompare(b.symbol));

  const totals: CalculatedPortfolioTotals = {
    symbolCount: positions.filter((position) => position.quantity > 0).length,
    totalQuantity: round(positions.reduce((acc, p) => acc + p.quantity, 0), 8),
    totalCostUsd: round(positions.reduce((acc, p) => acc + p.totalCostUsd, 0), 2),
    totalCostClp: round(positions.reduce((acc, p) => acc + p.totalCostClp, 0), 2),
    totalBoughtQuantity: round(positions.reduce((acc, p) => acc + p.boughtQuantity, 0), 8),
    totalSoldQuantity: round(positions.reduce((acc, p) => acc + p.soldQuantity, 0), 8),
    totalStakingRewardQuantity: round(positions.reduce((acc, p) => acc + p.stakingRewardQuantity, 0), 8),
    totalBuyCostUsd: round(positions.reduce((acc, p) => acc + p.buyCostUsd, 0), 2),
    totalSellProceedsUsd: round(positions.reduce((acc, p) => acc + p.sellProceedsUsd, 0), 2),
    totalStakingRewardValueUsd: round(positions.reduce((acc, p) => acc + p.stakingRewardValueUsd, 0), 2),
    totalCapitalContributedUsd: round(positions.reduce((acc, p) => acc + p.capitalContributedUsd, 0), 2),
    totalBuyCostClp: round(positions.reduce((acc, p) => acc + p.buyCostClp, 0), 2),
    totalSellProceedsClp: round(positions.reduce((acc, p) => acc + p.sellProceedsClp, 0), 2),
    totalStakingRewardValueClp: round(positions.reduce((acc, p) => acc + p.stakingRewardValueClp, 0), 2),
    totalCapitalContributedClp: round(positions.reduce((acc, p) => acc + p.capitalContributedClp, 0), 2),
  };

  return {
    positions,
    totals,
    fx: {
      usdToClp: fxRate.rate,
      source: fxRate.source,
      asOf: fxRate.asOf,
    },
  };
}
