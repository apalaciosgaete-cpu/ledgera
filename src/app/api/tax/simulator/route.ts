import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { round, normalizeSymbol } from "@/shared/utils/math";
import { requireAuth } from "@/shared";
import { fail } from "@/shared/apiResponse";
import { buildUserScopeWhere } from "@/modules/identity/domain/accessPolicy";
import {
  calculatePortfolio,
  type PortfolioMovement,
} from "@/modules/portfolio/application/calculatePortfolio";
import { getCoinGeckoPricesUsd } from "@/modules/portfolio/infrastructure/coingecko";
import { getCoinGeckoIdBySymbol } from "@/modules/portfolio/domain/assetMarketMap";

function parsePositive(value: string | null): number | null {
  if (!value) return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return parsed;
}

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth || auth instanceof NextResponse) return fail("No autorizado.", 401);

  try {
    const searchParams = request.nextUrl.searchParams;
    const symbol = normalizeSymbol(searchParams.get("symbol") ?? "");
    const quantity = parsePositive(searchParams.get("quantity"));
    const priceUsd = parsePositive(searchParams.get("priceUsd"));

    if (!symbol) return fail("Indica el activo a simular.", 400);
    if (!quantity) return fail("Indica la cantidad a vender.", 400);
    if (!priceUsd) return fail("Indica el precio estimado.", 400);

    const scope = buildUserScopeWhere(auth.user);

    const rawMovements = await prisma.portfolioMovement.findMany({
      where: { deletedAt: null, ...scope },
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
    });

    const movements = rawMovements
      .map((m) => {
        const type = String(m.type).trim().toUpperCase();
        if (type !== "BUY" && type !== "SELL" && type !== "DEPOSIT" && type !== "WITHDRAW" && type !== "STAKING_REWARD") {
          return null;
        }
        return {
          id: String(m.id),
          type: type as PortfolioMovement["type"],
          symbol: normalizeSymbol(String(m.symbol)),
          quantity: Number(m.quantity),
          priceUsd: Number(m.priceUsd),
          feeUsd: Number(m.feeUsd ?? 0),
          occurredAt: m.executedAt,
        };
      })
      .filter(Boolean) as PortfolioMovement[];

    const portfolio = await calculatePortfolio(movements);
    const position = portfolio.positions.find((p) => p.symbol === symbol);

    if (!position || position.quantity <= 0) {
      return fail(`No tienes saldo de ${symbol} para simular una venta.`, 400);
    }

    if (quantity > position.quantity) {
      return fail(
        `Intentas vender ${quantity} ${symbol} pero solo tienes ${position.quantity} disponibles.`,
        400
      );
    }

    const marketId = getCoinGeckoIdBySymbol(symbol);
    let currentPriceUsd = 0;
    if (marketId) {
      try {
        const prices = await getCoinGeckoPricesUsd([marketId]);
        currentPriceUsd = Number(prices[marketId] ?? 0);
      } catch {
        // ignore
      }
    }

    const avgCostUsd = position.averageCostUsd;
    const costBasisUsd = quantity * avgCostUsd;
    const proceedsGrossUsd = quantity * priceUsd;
    const realizedPnlUsd = proceedsGrossUsd - costBasisUsd;
    const taxRate = 0.065;
    const taxUsd = realizedPnlUsd > 0 ? round(realizedPnlUsd * taxRate, 2) : 0;

    const usdClp = portfolio.fx.usdToClp;
    const costBasisClp = round(costBasisUsd * usdClp, 2);
    const proceedsGrossClp = round(proceedsGrossUsd * usdClp, 2);
    const realizedPnlClp = round(realizedPnlUsd * usdClp, 2);
    const taxClp = round(taxUsd * usdClp, 2);

    return NextResponse.json({
      ok: true,
      data: {
        symbol,
        quantity,
        priceUsd,
        currentPriceUsd: round(currentPriceUsd, 4),
        avgCostUsd: round(avgCostUsd, 4),
        availableQuantity: round(position.quantity, 8),
        costBasisUsd: round(costBasisUsd, 2),
        costBasisClp,
        proceedsGrossUsd: round(proceedsGrossUsd, 2),
        proceedsGrossClp,
        realizedPnlUsd: round(realizedPnlUsd, 2),
        realizedPnlClp,
        taxUsd,
        taxClp,
        taxRate,
        usdClp: round(usdClp, 4),
        fxSource: portfolio.fx.source,
      },
    });
  } catch (error) {
    const err = error as Error;
    return NextResponse.json(
      { ok: false, message: "Error al simular venta", debug: { message: err.message } },
      { status: 500 }
    );
  }
}
