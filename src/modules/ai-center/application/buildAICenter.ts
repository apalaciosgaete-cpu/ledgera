import { prisma } from "@/lib/prisma";
import { buildLearningProfile } from "@/modules/learning-engine/application/buildLearningProfile";
import { getTaxMemory } from "@/modules/tax-memory/application/getTaxMemory";

export async function buildAICenter(userId: string) {
  const [risk, smartScore, alerts, tasks, recommendations, automations, orchestrations, memory, learning] = await Promise.all([
    prisma.taxRiskScore.findFirst({ where: { userId }, orderBy: { evaluatedAt: "desc" } }),
    prisma.smartTaxScore.findFirst({ where: { userId }, orderBy: { evaluatedAt: "desc" } }),
    prisma.alert.count({ where: { userId, status: { not: "RESOLVED" } } }),
    prisma.task.count({ where: { userId, status: { notIn: ["COMPLETED", "CANCELLED"] } } }),
    prisma.recommendation.count({ where: { userId, status: "ACTIVE" } }),
    prisma.$queryRawUnsafe<{ count: bigint }[]>(
      "SELECT COUNT(*)::bigint AS count FROM automation_proposals WHERE user_id = $1 AND status = 'PROPOSED'",
      userId,
    ).catch(() => [{ count: BigInt(0) }]),
    prisma.$queryRawUnsafe<{ status: string; executedAt: Date }[]>(
      "SELECT status, executed_at AS \"executedAt\" FROM ai_orchestration_runs WHERE user_id = $1 ORDER BY executed_at DESC LIMIT 1",
      userId,
    ).catch(() => []),
    getTaxMemory(userId).catch(() => ({ ok: false as const, patterns: [] })),
    buildLearningProfile(userId).catch(() => ({ ok: false as const, message: "learning unavailable" })),
  ]);

  return {
    risk: {
      level: risk?.level ?? null,
      score: risk?.score ?? null,
    },
    smartScore: smartScore?.score ?? null,
    counts: {
      alerts,
      tasks,
      recommendations,
      automationProposals: Number(automations[0]?.count ?? 0),
      memoryPatterns: memory.ok ? memory.patterns.length : 0,
    },
    orchestration: {
      status: orchestrations[0]?.status ?? null,
      executedAt: orchestrations[0]?.executedAt?.toISOString() ?? null,
    },
    learning: learning.ok
      ? { ...learning.profile, generatedAt: learning.profile.generatedAt.toISOString() }
      : null,
    memory: memory.ok
      ? memory.patterns.slice(0, 5).map((pattern) => ({
          id: pattern.id,
          title: pattern.title,
          description: pattern.description,
          strength: pattern.strength,
          category: pattern.category,
        }))
      : [],
  };
}
