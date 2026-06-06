// src/app/api/audit/fifo/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/shared";
import { fail } from "@/shared/apiResponse";
import { buildUserScopeWhere } from "@/modules/identity/domain/accessPolicy";

interface InventoryLot {
  movementId: string;
  executedAt: Date;
  quantity: number;
  unitCostUsd: number;
}

interface ConsumedLot {
  movementId: string;
  executedAt: string;
  quantityConsumed: number;
  unitCostUsd: number;
  costBasisUsd: number;
}

interface FifoSale {
  movementId: string;
  symbol: string;
  executedAt: string;
  quantity: number;
  priceUsd: number;
  feeUsd: number;
  proceedsGrossUsd: number;
  proceedsNetUsd: number;
  costBasisUsd: number;
  realizedPnlUsd: number;
  averageCostUsdAtSale: number;
  consumedLots: ConsumedLot[];
  missingQuantity: number;
}

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth || auth instanceof NextResponse) return fail("No autorizado.", 401);

  try {
    const { searchParams } = new URL(request.url);
    const yearParam = searchParams.get("year");
    const symbolParam = searchParams.get("symbol");
    const year = yearParam ? Number(yearParam) : null;
    const symbol = symbolParam?.trim().toUpperCase() || null;

    const scope = buildUserScopeWhere(auth.user);

    const range = year
      ? { gte: new Date(`${year}-01-01T00:00:00.000Z`), lt: new Date(`${year + 1}-01-01T00:00:00.000Z`) }
      : undefined;

    const movements = await prisma.portfolioMovement.findMany({
      where: {
        deletedAt: null,
        ...scope,
        ...(range ? { executedAt: range } : {}),
        ...(symbol ? { symbol } : {}),
      },
      orderBy: [{ executedAt: "asc" }, { id: "asc" }],
      select: {
        id: true,
        type: true,
        symbol: true,
        quantity: true,
        priceUsd: true,
        feeUsd: true,
        executedAt: true,
      },
    });

    const inventory: Record<string, InventoryLot[]> = {};
    const sales: FifoSale[] = [];

    for (const m of movements) {
      const type = String(m.type).trim().toUpperCase();
      const sym = m.symbol;
      const qty = Number(m.quantity) || 0;
      const price = Number(m.priceUsd) || 0;
      const fee = Number(m.feeUsd) || 0;

      if (!inventory[sym]) inventory[sym] = [];

      if (type === "BUY" || type === "DEPOSIT") {
        const totalCostUsd = qty * price + fee;
        const unitCostUsd = qty > 0 ? totalCostUsd / qty : 0;
        inventory[sym].push({
          movementId: m.id,
          executedAt: m.executedAt,
          quantity: qty,
          unitCostUsd,
        });
      } else if (type === "SELL") {
        let remaining = qty;
        let costBasisUsd = 0;
        const consumedLots: ConsumedLot[] = [];
        const lots = inventory[sym];

        while (remaining > 0.00000001 && lots.length > 0) {
          const lot = lots[0];
          const consume = Math.min(remaining, lot.quantity);
          const lotCost = consume * lot.unitCostUsd;
          costBasisUsd += lotCost;
          consumedLots.push({
            movementId: lot.movementId,
            executedAt: lot.executedAt.toISOString(),
            quantityConsumed: consume,
            unitCostUsd: lot.unitCostUsd,
            costBasisUsd: lotCost,
          });
          lot.quantity -= consume;
          remaining -= consume;
          if (lot.quantity <= 0.00000001) lots.shift();
        }

        const consumedQty = qty - remaining;
        const proceedsGrossUsd = qty * price;
        const proceedsNetUsd = proceedsGrossUsd - fee;
        const averageCostUsdAtSale = consumedQty > 0 ? costBasisUsd / consumedQty : 0;

        sales.push({
          movementId: m.id,
          symbol: sym,
          executedAt: m.executedAt.toISOString(),
          quantity: qty,
          priceUsd: price,
          feeUsd: fee,
          proceedsGrossUsd,
          proceedsNetUsd,
          costBasisUsd: Math.round(costBasisUsd * 1e8) / 1e8,
          realizedPnlUsd: Math.round((proceedsNetUsd - costBasisUsd) * 1e8) / 1e8,
          averageCostUsdAtSale: Math.round(averageCostUsdAtSale * 1e8) / 1e8,
          consumedLots,
          missingQuantity: Math.round(remaining * 1e8) / 1e8,
        });
      } else if (type === "WITHDRAW") {
        let remaining = qty;
        const lots = inventory[sym];
        while (remaining > 0.00000001 && lots.length > 0) {
          const lot = lots[0];
          const consume = Math.min(remaining, lot.quantity);
          lot.quantity -= consume;
          remaining -= consume;
          if (lot.quantity <= 0.00000001) lots.shift();
        }
      }
    }

    return NextResponse.json({
      ok: true,
      data: {
        year,
        symbol,
        totalMovements: movements.length,
        totalSales: sales.length,
        sales,
      },
    });
  } catch (error) {
    const err = error as Error;
    return NextResponse.json(
      { ok: false, message: "Error al calcular FIFO", debug: { message: err.message } },
      { status: 500 }
    );
  }
}
