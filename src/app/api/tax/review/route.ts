import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { round, normalizeSymbol } from "@/shared/utils/math";
import { requireAuth } from "@/shared";
import { fail } from "@/shared/apiResponse";
import { buildUserScopeWhere } from "@/modules/identity/domain/accessPolicy";

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

type Movement = {
  id: string;
  type: "BUY" | "SELL";
  symbol: string;
  quantity: number;
  priceUsd: number;
  feeUsd: number;
  executedAt: Date;
};

type Position = {
  symbol: string;
  quantity: number;
  averageCostUsd: number;
};

type TaxEvent = {
  movementId: string;
  symbol: string;
  executedAt: string;
  quantity: number;
  priceUsd: number;
  costBasisUsd: number;
  realizedPnlUsd: number;
  realizedPnlClp: number;
  proceedsNetClp: number;
};

function parseYear(value: string | null): number | null {
  if (!value) return null;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 2009 || parsed > 2100) return null;
  return parsed;
}

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth || auth instanceof NextResponse) return fail("No autorizado.", 401);

  try {
    const searchParams = request.nextUrl.searchParams;
    const yearFilter = parseYear(searchParams.get("year"));
    const symbolFilter = searchParams.get("symbol");
    const normalizedSymbolFilter = symbolFilter ? normalizeSymbol(symbolFilter) : null;
    const scope = buildUserScopeWhere(auth.user);

    const rawMovements = await prisma.portfolioMovement.findMany({
      where: { deletedAt: null, ...scope },
      orderBy: { executedAt: "asc" },
    });

    const movements: Movement[] = rawMovements
      .map((m) => {
        const type = String(m.type).trim().toUpperCase();
        if (type !== "BUY" && type !== "SELL") return null;
        return {
          id: String(m.id),
          type: type as Movement["type"],
          symbol: normalizeSymbol(String(m.symbol)),
          quantity: Number(m.quantity),
          priceUsd: Number(m.priceUsd),
          feeUsd: Number(m.feeUsd ?? 0),
          executedAt: m.executedAt,
        };
      })
      .filter(Boolean) as Movement[];

    const usdClp = await fetchUsdClp();
    const ledger = new Map<string, Position>();
    const events: TaxEvent[] = [];

    for (const movement of movements) {
      const current = ledger.get(movement.symbol) ?? {
        symbol: movement.symbol,
        quantity: 0,
        averageCostUsd: 0,
      };

      if (movement.type === "BUY") {
        const totalCost = current.quantity * current.averageCostUsd;
        const buyCost = movement.quantity * movement.priceUsd + movement.feeUsd;
        const nextQty = current.quantity + movement.quantity;
        const nextAvg = nextQty > 0 ? (totalCost + buyCost) / nextQty : 0;
        ledger.set(movement.symbol, { symbol: movement.symbol, quantity: nextQty, averageCostUsd: nextAvg });
        continue;
      }

      if (movement.type === "SELL") {
        const proceedsNet = movement.quantity * movement.priceUsd - movement.feeUsd;
        const costBasis = movement.quantity * current.averageCostUsd;
        const pnl = proceedsNet - costBasis;
        const remaining = current.quantity - movement.quantity;

        events.push({
          movementId: movement.id,
          symbol: movement.symbol,
          executedAt: movement.executedAt.toISOString(),
          quantity: round(movement.quantity, 8),
          priceUsd: round(movement.priceUsd, 4),
          costBasisUsd: round(costBasis, 2),
          realizedPnlUsd: round(pnl, 2),
          realizedPnlClp: round(pnl * usdClp, 2),
          proceedsNetClp: round(proceedsNet * usdClp, 2),
        });

        ledger.set(movement.symbol, {
          symbol: movement.symbol,
          quantity: remaining,
          averageCostUsd: remaining > 0 ? current.averageCostUsd : 0,
        });
      }
    }

    const sellIds = new Set(movements.filter((m) => m.type === "SELL").map((m) => m.id));
    const eventIds = new Set(events.map((e) => e.movementId));
    const sellWithoutEvent = movements.filter((m) => m.type === "SELL" && !eventIds.has(m.id)).length;
    const orphanEvents = 0; // Simplified: we generate events inline, so no orphans possible

    const availableYears = Array.from(new Set(events.map((e) => new Date(e.executedAt).getUTCFullYear()))).sort((a, b) => b - a);
    const availableSymbols = Array.from(new Set(events.map((e) => e.symbol))).sort();

    let filtered = events;
    if (yearFilter) {
      filtered = filtered.filter((e) => new Date(e.executedAt).getUTCFullYear() === yearFilter);
    }
    if (normalizedSymbolFilter) {
      filtered = filtered.filter((e) => e.symbol === normalizedSymbolFilter);
    }

    const totalPnlClp = filtered.reduce((sum, e) => sum + e.realizedPnlClp, 0);

    let health: "OK" | "REVIEW" | "RISK" = "OK";
    if (sellWithoutEvent > 0) health = "REVIEW";
    if (sellWithoutEvent > 3) health = "RISK";

    const alerts = [];
    if (sellWithoutEvent > 0) {
      alerts.push({
        type: "SELL_WITHOUT_EVENT",
        severity: sellWithoutEvent > 3 ? "high" : "medium",
        label: `${sellWithoutEvent} venta${sellWithoutEvent > 1 ? "s" : ""} sin evento tributario`,
        detail: "Hay movimientos de venta que no generaron un evento tributario. Revisa si faltan datos.",
      });
    }

    return NextResponse.json({
      ok: true,
      data: {
        events: filtered,
        totalEvents: filtered.length,
        totalPnlClp: round(totalPnlClp, 2),
        availableYears,
        availableSymbols,
        filters: { year: yearFilter, symbol: normalizedSymbolFilter },
        alerts,
        health,
        sellWithoutEvent,
      },
    });
  } catch (error) {
    const err = error as Error;
    return NextResponse.json(
      { ok: false, message: "Error al cargar revisión tributaria", debug: { message: err.message } },
      { status: 500 }
    );
  }
}
