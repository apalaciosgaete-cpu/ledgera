import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import type {
  TaxRiskBreakdownItem,
  TaxRiskLevel,
  TaxRiskScore,
} from "@/modules/risk/domain/risk";

export async function saveTaxRiskScore(input: {
  userId: string;
  score: number;
  level: TaxRiskLevel;
  breakdown: TaxRiskBreakdownItem[];
}): Promise<TaxRiskScore> {
  const row = await prisma.taxRiskScore.create({
    data: {
      userId: input.userId,
      score: input.score,
      level: input.level,
      breakdown: input.breakdown as unknown as Prisma.InputJsonValue,
    },
  });

  return mapTaxRiskScore(row);
}

export async function getLatestTaxRiskScoreByUserId(
  userId: string,
): Promise<TaxRiskScore | null> {
  const row = await prisma.taxRiskScore.findFirst({
    where: { userId },
    orderBy: { evaluatedAt: "desc" },
  });

  return row ? mapTaxRiskScore(row) : null;
}

export async function listTaxRiskScores(filters?: {
  level?: TaxRiskLevel;
  limit?: number;
}): Promise<TaxRiskScore[]> {
  const rows = await prisma.taxRiskScore.findMany({
    where: { level: filters?.level },
    orderBy: [{ score: "desc" }, { evaluatedAt: "desc" }],
    take: filters?.limit ?? 100,
  });

  return rows.map(mapTaxRiskScore);
}

function mapTaxRiskScore(row: {
  id: string;
  userId: string;
  score: number;
  level: string;
  breakdown: unknown;
  evaluatedAt: Date;
}): TaxRiskScore {
  return {
    id: row.id,
    userId: row.userId,
    score: row.score,
    level: row.level as TaxRiskLevel,
    breakdown: row.breakdown as TaxRiskBreakdownItem[],
    evaluatedAt: row.evaluatedAt,
  };
}
