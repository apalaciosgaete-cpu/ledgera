import { prisma } from "@/lib/prisma";

export async function findStagingDecisionByValidationCode(validationCode: string) {
  return prisma.stagingDecision.findUnique({ where: { validationCode } });
}

export async function findStagingDecisionsByStagingEvent(stagingEventId: string, userId: string) {
  return prisma.stagingDecision.findMany({
    where:   { stagingEventId, userId },
    orderBy: { createdAt: "desc" },
  });
}

export async function findRecentStagingDecisions(userId: string, limit = 50) {
  return prisma.stagingDecision.findMany({
    where:   { userId },
    orderBy: { createdAt: "desc" },
    take:    limit,
  });
}
