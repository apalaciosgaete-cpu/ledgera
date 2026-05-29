import { prisma } from "@/lib/prisma";

// ── Exchange ──────────────────────────────────────────────────────────────────

export async function findExchangeRecordsByIds(ids: string[], userId: string) {
  return prisma.exchangeImportRecord.findMany({
    where: { id: { in: ids }, userId },
  });
}

export async function findExchangeRecordGroupByMovementId(movementId: string, userId: string) {
  return prisma.exchangeImportRecord.findMany({
    where:   { userId, movementId },
    orderBy: { occurredAt: "asc" },
  });
}

export async function findExchangeRecordGroupByTimeWindow(
  normalizedEventType: string | null,
  occurredAt:          Date,
  userId:              string,
  windowMs:            number = 5 * 60 * 1000,
) {
  const from = new Date(occurredAt.getTime() - windowMs);
  const to   = new Date(occurredAt.getTime() + windowMs);
  return prisma.exchangeImportRecord.findMany({
    where:   { userId, normalizedEventType, occurredAt: { gte: from, lte: to } },
    orderBy: { occurredAt: "asc" },
  });
}

// ── Bank ──────────────────────────────────────────────────────────────────────

export async function findBankMovementById(id: string, userId: string) {
  return prisma.bankMovement.findFirst({ where: { id, userId } });
}

export async function findBankMovementsByIds(ids: string[], userId: string) {
  return prisma.bankMovement.findMany({
    where:  { id: { in: ids }, userId },
    select: { id: true, status: true },
  });
}

export async function findBankMovementsForMatching(userId: string, statuses: string[]) {
  return prisma.bankMovement.findMany({
    where:   { userId, status: { in: statuses } },
    orderBy: { occurredAt: "desc" },
  });
}

export async function findAlreadyMatchedPortfolioMovementIds(userId: string, excludeBankId?: string) {
  const rows = await prisma.bankMovement.findMany({
    where: {
      userId,
      matchedPortfolioMovementId: { not: null },
      ...(excludeBankId ? { id: { not: excludeBankId } } : {}),
    },
    select: { matchedPortfolioMovementId: true },
  });
  return rows.map((r) => r.matchedPortfolioMovementId!).filter(Boolean);
}

export async function findPortfolioMovementsInWindow(
  userId:     string,
  from:       Date,
  to:         Date,
  sources:    string[],
  excludeIds: string[] = [],
) {
  return prisma.portfolioMovement.findMany({
    where: {
      userId,
      deletedAt:  null,
      executedAt: { gte: from, lte: to },
      source:     { in: sources },
      ...(excludeIds.length > 0 ? { id: { notIn: excludeIds } } : {}),
    },
    orderBy: { executedAt: "desc" },
  });
}

export async function findPortfolioMovementById(id: string, userId: string) {
  return prisma.portfolioMovement.findFirst({
    where: { id, userId, deletedAt: null },
    select: { id: true },
  });
}

export async function updateBankMovementStatus(
  id:     string,
  userId: string,
  status: string,
) {
  return prisma.bankMovement.updateMany({
    where: { id, userId },
    data:  { status },
  });
}

export async function updateBankMovementsToIgnored(ids: string[], userId: string) {
  return prisma.bankMovement.updateMany({
    where: { id: { in: ids }, userId, status: { in: ["IMPORTED", "REVIEW"] } },
    data:  { status: "IGNORED" },
  });
}

export async function updateBankMovementMatch(
  id:                  string,
  portfolioMovementId: string,
  confidence:          number,
  reason:              string,
) {
  return prisma.bankMovement.update({
    where: { id },
    data: {
      status:                     "MATCHED",
      matchedPortfolioMovementId: portfolioMovementId,
      matchedConfidence:          confidence,
      matchedReason:              reason,
      matchedAt:                  new Date(),
    },
  });
}

export async function bulkUpdateBankMovementCandidates(
  entries: Array<{ id: string; confidence: number; promote: boolean }>,
) {
  if (entries.length === 0) return;
  await prisma.$transaction(
    entries.map((e) =>
      prisma.bankMovement.update({
        where: { id: e.id },
        data: {
          matchedConfidence: e.confidence,
          ...(e.promote ? { status: "REVIEW" } : {}),
        },
      }),
    ),
  );
}
