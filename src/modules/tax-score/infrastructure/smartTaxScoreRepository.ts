import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { SmartTaxScore, SmartTaxScoreBreakdownItem, SmartTaxScoreLevel } from "@/modules/tax-score/domain/smartTaxScore";

export interface SaveSmartTaxScoreInput {
  userId: string;
  score: number;
  level: SmartTaxScoreLevel;
  breakdown: SmartTaxScoreBreakdownItem[];
  evaluatedAt?: Date;
}

function mapRowToDomain(row: {
  id: string;
  userId: string;
  score: number;
  level: string;
  breakdown: unknown;
  evaluatedAt: Date;
}): SmartTaxScore {
  return {
    id: row.id,
    userId: row.userId,
    score: row.score,
    level: row.level as SmartTaxScoreLevel,
    breakdown: row.breakdown as SmartTaxScoreBreakdownItem[],
    evaluatedAt: row.evaluatedAt,
  };
}

export async function saveSmartTaxScore(input: SaveSmartTaxScoreInput): Promise<SmartTaxScore> {
  const row = await prisma.smartTaxScore.create({
    data: {
      userId: input.userId,
      score: input.score,
      level: input.level,
      breakdown: input.breakdown as unknown as Prisma.InputJsonValue,
      evaluatedAt: input.evaluatedAt ?? new Date(),
    },
  });

  return mapRowToDomain(row);
}

export async function getLatestSmartTaxScoreByUserId(userId: string): Promise<SmartTaxScore | null> {
  const row = await prisma.smartTaxScore.findFirst({
    where: { userId },
    orderBy: { evaluatedAt: "desc" },
  });

  return row ? mapRowToDomain(row) : null;
}

export async function listSmartTaxScores(filters?: {
  level?: string;
  minScore?: number;
  maxScore?: number;
  limit?: number;
}): Promise<SmartTaxScore[]> {
  const rows = await prisma.smartTaxScore.findMany({
    where: {
      ...(filters?.level ? { level: filters.level } : {}),
      ...(filters?.minScore !== undefined ? { score: { gte: filters.minScore } } : {}),
      ...(filters?.maxScore !== undefined ? { score: { lte: filters.maxScore } } : {}),
    },
    orderBy: { evaluatedAt: "desc" },
    take: filters?.limit ?? 100,
  });

  return rows.map(mapRowToDomain);
}
