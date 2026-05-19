import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { round, normalizeSymbol } from "@/shared/utils/math";

type CanonicalMovementType = "BUY" | "SELL";

type RawPortfolioMovement = {
  id: string;
  type: string;
  symbol: string;
  quantity: number;
  priceUsd: number;
  feeUsd: number | null;
  executedAt: Date;
};

type TaxSourceMovement = {
  id: string;
  type: CanonicalMovementType;
  symbol: string;
  quantity: number;
  priceUsd: number;
  feeUsd: number;
  executedAt: Date;
};

type PositionAccumulator = {
  symbol: string;
  quantity: number;
  averageCostUsd: number;
};

type TaxEvent = {
  movementId: string;
  eventType: "SELL";
  symbol: string;
  executedAt: string;
  quantity: number;
  proceedsGrossUsd: number;
  proceedsNetUsd: number;
  costBasisUsd: number;
  feeUsd: number;
  realizedPnlUsd: number;
  usdClp: number;
  proceedsGrossClp: number;
  proceedsNetClp: number;
  costBasisClp: number;
  feeClp: number;
  realizedPnlClp: number;
};

type TaxSummaryRow = {
  year: number;
  symbol: string;
  eventsCount: number;
  quantitySold: number;
  proceedsNetUsd: number;
  costBasisUsd: number;
  feeUsd: number;
  realizedPnlUsd: number;
  proceedsNetClp: number;
  costBasisClp: number;
  feeClp: number;
  realizedPnlClp: number;
};

// ─── FX inline ────────────────────────────────────────────────────────────────

async function fetchUsdClp(): Promise<number> {
  try {
    const today = new Date();
    const day = String(today.getUTCDate()).padStart(2, "0");
    const month = String(today.getUTCMonth() + 1).padStart(2, "0");
    const year = today.getUTCFullYear();
    const res = await fetch(
      `https://mindicador.cl/api/dolar/${day}-${month}-${year}`,
      { headers: { Accept: "application/json" } }
    );
    if (!res.ok) throw new Error();
    const data = await res.json();
    const valor = data?.serie?.[0]?.valor;
    if (typeof valor === "number" && valor > 0) return valor;
  } catch { /* fallback */ }
  return 950;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function normalizeType(type: string): CanonicalMovementType | null {
  const normalized = String(type).trim().toUpperCase();
  if (normalized === "BUY" || normalized === "SELL") return normalized;
  return null;
}

function parseYear(value: string | null): number | null {
  if (!value) return null;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 2009 || parsed > 2100) return null;
  return parsed;
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const yearFilter = parseYear(searchParams.get("year"));
    const symbolFilter = searchParams.get("symbol");
    const normalizedSymbolFilter = symbolFilter ? normalizeSymbol(symbolFilter) : null;

    const rawMovements = (await prisma.portfolioMovement.findMany({
      orderBy: { executedAt: "asc" },
    })) as RawPortfolioMovement[];

    const movements: TaxSourceMovement[] = rawMovements
      .map((movement) => {
        const type = normalizeType(String(movement.type));
        if (!type) return null;
        return {
          id: String(movement.id),
          type,
          symbol: normalizeSymbol(String(movement.symbol)),
          quantity: Number(movement.quantity),
          priceUsd: Number(movement.priceUsd),
          feeUsd: Number(movement.feeUsd ?? 0),
          executedAt: movement.executedAt,
        };
      })
      .filter((movement): movement is TaxSourceMovement => Boolean(movement));

    const usdClp = await fetchUsdClp();

    const ledger = new Map<string, PositionAccumulator>();
    const events: TaxEvent[] = [];

    for (const movement of movements) {
      const current = ledger.get(movement.symbol) ?? {
        symbol: movement.symbol,
        quantity: 0,
        averageCostUsd: 0,
      };

      if (movement.type === "BUY") {
        const currentTotalCostUsd = current.quantity * current.averageCostUsd;
        const buyNetCostUsd = movement.quantity * movement.priceUsd + movement.feeUsd;
        const nextQuantity = current.quantity + movement.quantity;
        const nextTotalCostUsd = currentTotalCostUsd + buyNetCostUsd;
        const nextAverageCostUsd = nextQuantity > 0 ? nextTotalCostUsd / nextQuantity : 0;
        ledger.set(movement.symbol, {
          symbol: movement.symbol,
          quantity: nextQuantity,
          averageCostUsd: nextAverageCostUsd,
        });
        continue;
      }

      if (movement.type === "SELL") {
        if (movement.quantity > current.quantity) {
          throw new Error(
            `Movimiento invalido para ${movement.symbol}: intenta vender ${movement.quantity}, pero solo hay ${current.quantity} disponible.`
          );
        }

        const proceedsGrossUsd = movement.quantity * movement.priceUsd;
        const proceedsNetUsd = proceedsGrossUsd - movement.feeUsd;
        const costBasisUsd = movement.quantity * current.averageCostUsd;
        const realizedPnlUsd = proceedsNetUsd - costBasisUsd;
        const remainingQuantity = current.quantity - movement.quantity;

        events.push({
          movementId: movement.id,
          eventType: "SELL",
          symbol: movement.symbol,
          executedAt: movement.executedAt.toISOString(),
          quantity: round(movement.quantity, 8),
          proceedsGrossUsd: round(proceedsGrossUsd, 8),
          proceedsNetUsd: round(proceedsNetUsd, 8),
          costBasisUsd: round(costBasisUsd, 8),
          feeUsd: round(movement.feeUsd, 8),
          realizedPnlUsd: round(realizedPnlUsd, 8),
          usdClp: round(usdClp, 4),
          proceedsGrossClp: round(proceedsGrossUsd * usdClp, 2),
          proceedsNetClp: round(proceedsNetUsd * usdClp, 2),
          costBasisClp: round(costBasisUsd * usdClp, 2),
          feeClp: round(movement.feeUsd * usdClp, 2),
          realizedPnlClp: round(realizedPnlUsd * usdClp, 2),
        });

        ledger.set(movement.symbol, {
          symbol: movement.symbol,
          quantity: remainingQuantity,
          averageCostUsd: remainingQuantity > 0 ? current.averageCostUsd : 0,
        });
      }
    }

    const filteredEvents = events.filter((event) => {
      const eventYear = new Date(event.executedAt).getUTCFullYear();
      if (yearFilter && eventYear !== yearFilter) return false;
      if (normalizedSymbolFilter && event.symbol !== normalizedSymbolFilter) return false;
      return true;
    });

    const grouped = new Map<string, TaxSummaryRow>();

    for (const event of filteredEvents) {
      const year = new Date(event.executedAt).getUTCFullYear();
      const key = `${year}_${event.symbol}`;
      const current = grouped.get(key) ?? {
        year,
        symbol: event.symbol,
        eventsCount: 0,
        quantitySold: 0,
        proceedsNetUsd: 0,
        costBasisUsd: 0,
        feeUsd: 0,
        realizedPnlUsd: 0,
        proceedsNetClp: 0,
        costBasisClp: 0,
        feeClp: 0,
        realizedPnlClp: 0,
      };

      current.eventsCount += 1;
      current.quantitySold += event.quantity;
      current.proceedsNetUsd += event.proceedsNetUsd;
      current.costBasisUsd += event.costBasisUsd;
      current.feeUsd += event.feeUsd;
      current.realizedPnlUsd += event.realizedPnlUsd;
      current.proceedsNetClp += event.proceedsNetClp;
      current.costBasisClp += event.costBasisClp;
      current.feeClp += event.feeClp;
      current.realizedPnlClp += event.realizedPnlClp;

      grouped.set(key, current);
    }

    const rows = Array.from(grouped.values())
      .map((row) => ({
        year: row.year,
        symbol: row.symbol,
        eventsCount: row.eventsCount,
        quantitySold: round(row.quantitySold, 8),
        proceedsNetUsd: round(row.proceedsNetUsd, 2),
        costBasisUsd: round(row.costBasisUsd, 2),
        feeUsd: round(row.feeUsd, 2),
        realizedPnlUsd: round(row.realizedPnlUsd, 2),
        proceedsNetClp: round(row.proceedsNetClp, 2),
        costBasisClp: round(row.costBasisClp, 2),
        feeClp: round(row.feeClp, 2),
        realizedPnlClp: round(row.realizedPnlClp, 2),
      }))
      .sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year;
        return a.symbol.localeCompare(b.symbol);
      });

    const totals = rows.reduce(
      (acc, row) => {
        acc.eventsCount += row.eventsCount;
        acc.quantitySold += row.quantitySold;
        acc.proceedsNetUsd += row.proceedsNetUsd;
        acc.costBasisUsd += row.costBasisUsd;
        acc.feeUsd += row.feeUsd;
        acc.realizedPnlUsd += row.realizedPnlUsd;
        acc.proceedsNetClp += row.proceedsNetClp;
        acc.costBasisClp += row.costBasisClp;
        acc.feeClp += row.feeClp;
        acc.realizedPnlClp += row.realizedPnlClp;
        return acc;
      },
      {
        eventsCount: 0,
        quantitySold: 0,
        proceedsNetUsd: 0,
        costBasisUsd: 0,
        feeUsd: 0,
        realizedPnlUsd: 0,
        proceedsNetClp: 0,
        costBasisClp: 0,
        feeClp: 0,
        realizedPnlClp: 0,
      }
    );

    return NextResponse.json({
      ok: true,
      message: "Resumen tributario obtenido correctamente",
      filters: { year: yearFilter, symbol: normalizedSymbolFilter },
      data: {
        usdClp: round(usdClp, 4),
        rows,
        totals: {
          eventsCount: totals.eventsCount,
          quantitySold: round(totals.quantitySold, 8),
          proceedsNetUsd: round(totals.proceedsNetUsd, 2),
          costBasisUsd: round(totals.costBasisUsd, 2),
          feeUsd: round(totals.feeUsd, 2),
          realizedPnlUsd: round(totals.realizedPnlUsd, 2),
          proceedsNetClp: round(totals.proceedsNetClp, 2),
          costBasisClp: round(totals.costBasisClp, 2),
          feeClp: round(totals.feeClp, 2),
          realizedPnlClp: round(totals.realizedPnlClp, 2),
        },
      },
    });
  } catch (error) {
    const err = error as Error;
    return NextResponse.json(
      {
        ok: false,
        message: "Error al obtener resumen tributario",
        debug: { message: err.message },
      },
      { status: 500 }
    );
  }
}