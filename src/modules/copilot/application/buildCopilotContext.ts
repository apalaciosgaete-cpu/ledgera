import { prisma } from "@/lib/prisma";
import type { CopilotContext } from "@/modules/copilot/domain/copilot";

export async function buildCopilotContext(userId: string): Promise<CopilotContext> {
  const [risk, smartScore, openAlerts, criticalAlerts, pendingTasks, recommendations, rejectedDocuments, adaptiveProfile, memoryPatterns, userRecord] = await Promise.all([
    prisma.taxRiskScore.findFirst({ where: { userId }, orderBy: { evaluatedAt: "desc" } }),
    prisma.smartTaxScore.findFirst({ where: { userId }, orderBy: { evaluatedAt: "desc" } }),
    prisma.alert.count({ where: { userId, status: { not: "RESOLVED" } } }),
    prisma.alert.count({ where: { userId, status: { not: "RESOLVED" }, severity: "CRITICAL" } }),
    prisma.task.count({ where: { userId, status: { notIn: ["COMPLETED", "CANCELLED"] } } }),
    prisma.recommendation.count({ where: { userId, status: "ACTIVE" } }),
    prisma.taxDocument.count({ where: { userId, status: "REJECTED" } }),
    prisma.adaptiveTaxProfile.findUnique({ where: { userId } }).catch(() => null),
    prisma.$queryRawUnsafe<{ count: bigint }[]>(
      "SELECT COUNT(*)::bigint AS count FROM tax_memory_patterns WHERE user_id = $1",
      userId,
    ).catch(() => [{ count: BigInt(0) }]),
    prisma.users.findUnique({ where: { id: userId }, select: { role: true, onboardingData: true } }).catch(() => null),
  ]);

  // Resolve profile type: prefer onboarding profileType, fallback to user role
  const rawOnboarding = userRecord?.onboardingData as { profileType?: string } | null | undefined;
  const profileType = rawOnboarding?.profileType ?? userRecord?.role ?? null;

  return {
    userId,
    riskLevel: risk?.level ?? null,
    riskScore: risk?.score ?? null,
    smartScore: smartScore?.score ?? null,
    openAlerts,
    criticalAlerts,
    pendingTasks,
    activeRecommendations: recommendations,
    rejectedDocuments,
    adaptiveProfileType: adaptiveProfile?.profileType ?? null,
    memoryPatterns: Number(memoryPatterns[0]?.count ?? 0),
    profileType,
  };
}
