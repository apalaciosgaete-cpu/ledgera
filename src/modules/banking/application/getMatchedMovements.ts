import { prisma } from "@/lib/prisma";

export type MatchedEntry = {
  bankMovement: {
    id:          string;
    description: string;
    amountClp:   number;
    occurredAt:  string;
    bankName:    string | null;
  };
  portfolioMovement: {
    id:         string;
    symbol:     string;
    type:       string;
    quantity:   number;
    priceUsd:   number;
    executedAt: string;
    source:     string | null;
  };
  confidence: number | null;
  matchedAt:  string | null;
  reason:     string | null;
};

export async function getMatchedMovements(userId: string): Promise<MatchedEntry[]> {
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

  return bankMovements.flatMap(bank => {
    const portfolio = byId.get(bank.matchedPortfolioMovementId!);
    if (!portfolio) return [];
    return [{
      bankMovement: {
        id:          bank.id,
        description: bank.description,
        amountClp:   bank.amountClp,
        occurredAt:  bank.occurredAt.toISOString(),
        bankName:    bank.bankName ?? null,
      },
      portfolioMovement: {
        id:         portfolio.id,
        symbol:     portfolio.symbol,
        type:       portfolio.type,
        quantity:   portfolio.quantity,
        priceUsd:   portfolio.priceUsd,
        executedAt: portfolio.executedAt.toISOString(),
        source:     portfolio.source ?? null,
      },
      confidence: bank.matchedConfidence ?? null,
      matchedAt:  bank.matchedAt?.toISOString() ?? null,
      reason:     bank.matchedReason ?? null,
    }];
  });
}
