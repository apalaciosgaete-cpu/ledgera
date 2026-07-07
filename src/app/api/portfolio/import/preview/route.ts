// Force dynamic rendering because routes use request.headers/cookies
export const dynamic = 'force-dynamic';

import { prisma } from "@/lib/prisma";
import {
  calculatePortfolio,
  type PortfolioMovement,
  type PortfolioMovementType,
} from "@/modules/portfolio/application/calculatePortfolio";
import { ok, serverError } from "@/shared/apiResponse";

type RawPortfolioMovement = {
  id: string;
  type: string;
  symbol: string;
  quantity: number;
  priceUsd: number;
  feeUsd: number;
  executedAt: Date;
};

function normalizeMovementType(value: string): PortfolioMovementType | null {
  if (value === "BUY" || value === "SELL") {
    return value;
  }

  return null;
}

export async function GET() {
  try {
    const rawMovements = (await prisma.portfolioMovement.findMany({
      where: {
        deletedAt: null,
      },
      orderBy: {
        executedAt: "asc",
      },
      select: {
        id: true,
        type: true,
        symbol: true,
        quantity: true,
        priceUsd: true,
        feeUsd: true,
        executedAt: true,
      },
    })) as RawPortfolioMovement[];

    const movements: PortfolioMovement[] = [];

    for (const movement of rawMovements) {
      const type = normalizeMovementType(movement.type);

      if (!type) {
        continue;
      }

      movements.push({
        id: movement.id,
        type,
        symbol: movement.symbol,
        quantity: movement.quantity,
        priceUsd: movement.priceUsd,
        feeUsd: movement.feeUsd,
        occurredAt: movement.executedAt,
      });
    }

    const portfolio = await calculatePortfolio(movements);

    return ok(portfolio, "Portfolio calculado correctamente.");
  } catch (error) {
    return serverError(error);
  }
}