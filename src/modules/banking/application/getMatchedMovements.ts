import { prisma } from "@/lib/prisma";

export type MatchedRecord = {
  bankMovement: {
    id:          string;
    bankName:    string | null;
    occurredAt:  string;
    description: string;
    amountClp:   number;
    direction:   string;
    status:      string;
  };
  portfolioMovement: {
    id:         string;
    type:       string;
    symbol:     string;
    quantity:   number;
    priceUsd:   number;
    executedAt: string;
    source:     string | null;
  } | null;
  confidence: number | null;
  matchedAt:  string | null;
  reason:     string | null;
};

export async function getMatchedMovements(userId: string): Promise<MatchedRecord[]> {
  const bankMovements = await prisma.bankMovement.findMany({
    where: {
      userId,
      status:                     "MATCHED",
      matchedPortfolioMovementId: { not: null },
    },
    orderBy: { matchedAt: "desc" },
    take: 200,
  });

  if (bankMovements.length === 0) return [];

  const portfolioIds = bankMovements
    .map(m => m.matchedPortfolioMovementId)
    .filter((id): id is string => id !== null);

  const portfolioMovements = await prisma.portfolioMovement.findMany({
    where: { id: { in: portfolioIds }, deletedAt: null },
  });

  const byId = new Map(portfolioMovements.map(p => [p.id, p]));

  return bankMovements.map(bank => {
    const portfolio = byId.get(bank.matchedPortfolioMovementId!) ?? null;
    return {
      bankMovement: {
        id:          bank.id,
        bankName:    bank.bankName ?? null,
        occurredAt:  bank.occurredAt.toISOString(),
        description: bank.description,
        amountClp:   bank.amountClp,
        direction:   bank.direction,
        status:      bank.status,
      },
      portfolioMovement: portfolio ? {
        id:         portfolio.id,
        type:       portfolio.type,
        symbol:     portfolio.symbol,
        quantity:   portfolio.quantity,
        priceUsd:   portfolio.priceUsd,
        executedAt: portfolio.executedAt.toISOString(),
        source:     portfolio.source ?? null,
      } : null,
      confidence: bank.matchedConfidence ?? null,
      matchedAt:  bank.matchedAt?.toISOString() ?? null,
      reason:     bank.matchedReason ?? null,
    };
  });
}
