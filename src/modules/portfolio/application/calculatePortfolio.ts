import { round, normalizeSymbol as sharedNormalizeSymbol } from "@/shared/utils/math";

// ─── Tipos ─────────────────────────────────────────────────────────────────────

export type PortfolioMovementType = "BUY" | "SELL" | "DEPOSIT" | "WITHDRAW";

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
}

export interface CalculatedPortfolioPosition {
  symbol: string;
  quantity: number;
  averageCostUsd: number;
  totalCostUsd: number;
  averageCostClp: number;
  totalCostClp: number;
}

export interface CalculatedPortfolioTotals {
  symbolCount: number;
  totalQuantity: number;
  totalCostUsd: number;
  totalCostClp: number;
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

// ─── FX inline ────────────────────────────────────────────────────────────────

async function fetchUsdClp(): Promise<{ rate: number; source: string; asOf: string }> {
  try {
    const today = new Date();
    const day = String(today.getUTCDate()).padStart(2, "0");
    const month = String(today.getUTCMonth() + 1).padStart(2, "0");
    const year = today.getUTCFullYear();
    const res = await fetch(
      `https://mindicador.cl/api/dolar/${day}-${month}-${year}`,
      { headers: { Accept: "application/json" } }
    );
    if (!res.ok) throw new Error("no response");
    const data = await res.json();
    const valor = data?.serie?.[0]?.valor;
    if (typeof valor === "number" && valor > 0) {
      return { rate: valor, source: "MINDICADOR", asOf: today.toISOString() };
    }
  } catch { /* fallback */ }
  return { rate: 950, source: "STATIC", asOf: new Date().toISOString() };
}

async function convertUsdToClp(amountUsd: number): Promise<number> {
  const fx = await fetchUsdClp();
  return Math.round(amountUsd * fx.rate * 100) / 100;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function normalizeMovementType(type: string): PortfolioMovementType | null {
  if (type === "BUY" || type === "SELL" || type === "DEPOSIT" || type === "WITHDRAW") return type;
  return null;
}

function toTimestamp(occurredAt?: string | Date): number {
  if (!occurredAt) return 0;
  const ts = new Date(occurredAt).getTime();
  return Number.isFinite(ts) ? ts : 0;
}

// ─── Funcion principal ─────────────────────────────────────────────────────────

export async function calculatePortfolio(
  movements: PortfolioMovement[],
): Promise<CalculatedPortfolio> {

  const sortedMovements = [...movements].sort(
    (a, b) => toTimestamp(a.occurredAt) - toTimestamp(b.occurredAt),
  );

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

    const current: PositionAccumulator = positionsMap.get(symbol) ?? {
      symbol,
      quantity: 0,
      totalCostUsd: 0,
    };

    if (type === "BUY") {
      const buyTotalCostUsd = quantity * priceUsd + feeUsd;
      current.quantity += quantity;
      current.totalCostUsd += buyTotalCostUsd;
      positionsMap.set(symbol, current);
      continue;
    }

    // DEPOSIT: suma cantidad sin base de costo (transferencia externa, priceUsd=0)
    if (type === "DEPOSIT") {
      current.quantity += quantity;
      positionsMap.set(symbol, current);
      continue;
    }

    // SELL / WITHDRAW: reducen posición proporcionalmente (WITHDRAW sin PnL tributario)
    if (current.quantity <= 0) {
      positionsMap.set(symbol, current);
      continue;
    }

    const sellQuantity = Math.min(quantity, current.quantity);
    const currentAverageCostUsd =
      current.quantity > 0 ? current.totalCostUsd / current.quantity : 0;

    current.quantity -= sellQuantity;
    current.totalCostUsd -= sellQuantity * currentAverageCostUsd;

    if (Math.abs(current.quantity) < 0.0000001) current.quantity = 0;
    if (Math.abs(current.totalCostUsd) < 0.0000001) current.totalCostUsd = 0;

    positionsMap.set(symbol, current);
  }

  // FX actual para display
  const fxRate = await fetchUsdClp();

  const positions: CalculatedPortfolioPosition[] = [];

  for (const [, position] of positionsMap) {
    if (position.quantity <= 0) continue;

    const averageCostUsd =
      position.quantity > 0 ? position.totalCostUsd / position.quantity : 0;

    const totalCostClpRaw = await convertUsdToClp(position.totalCostUsd);
    const averageCostClpRaw =
      position.quantity > 0 ? totalCostClpRaw / position.quantity : 0;

    positions.push({
      symbol: position.symbol,
      quantity: round(position.quantity, 2),
      averageCostUsd: round(averageCostUsd, 2),
      totalCostUsd: round(position.totalCostUsd, 2),
      averageCostClp: round(averageCostClpRaw, 2),
      totalCostClp: round(totalCostClpRaw, 2),
    });
  }

  positions.sort((a, b) => a.symbol.localeCompare(b.symbol));

  const totals: CalculatedPortfolioTotals = {
    symbolCount: positions.length,
    totalQuantity: round(positions.reduce((acc, p) => acc + p.quantity, 0), 2),
    totalCostUsd: round(positions.reduce((acc, p) => acc + p.totalCostUsd, 0), 2),
    totalCostClp: round(positions.reduce((acc, p) => acc + p.totalCostClp, 0), 2),
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