import { prisma } from "@/lib/prisma";
import { evaluateMonitoringSignals } from "@/modules/monitoring/application/evaluateMonitoringSignals";
import { decisionKey, priorityWeight, type DecisionCenterSummary, type DecisionItem, type DecisionPriority } from "@/modules/decision-center/domain/decision";

export async function buildDecisionCenter(userId: string): Promise<DecisionCenterSummary> {
  const [monitoring, recommendations, automationRows, agentPlanRows] = await Promise.all([
    evaluateMonitoringSignals(userId),
    prisma.recommendation.findMany({
      where: { userId, status: "ACTIVE" },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.$queryRawUnsafe<Array<{ id: string; title: string; description: string; priority: string; createdAt: Date }>>(
      `SELECT id, title, description, priority, created_at AS "createdAt"
       FROM automation_proposals
       WHERE user_id = $1 AND status = 'PROPOSED'
       ORDER BY created_at DESC
       LIMIT 20`,
      userId,
    ).catch(() => []),
    prisma.$queryRawUnsafe<Array<{ id: string; title: string; description: string; priority: string; expectedImpact: string; createdAt: Date }>>(
      `SELECT id, title, description, priority, expected_impact AS "expectedImpact", created_at AS "createdAt"
       FROM agent_plans
       WHERE user_id = $1 AND status = 'PROPOSED'
       ORDER BY created_at DESC
       LIMIT 20`,
      userId,
    ).catch(() => []),
  ]);

  const decisions: DecisionItem[] = [];
  const now = new Date();

  for (const signal of monitoring.signals) {
    const priority: DecisionPriority = signal.severity === "CRITICAL" ? "CRITICAL" : signal.severity === "WARNING" ? "HIGH" : "LOW";
    decisions.push({
      id: decisionKey("MonitoringSignal", signal.id, signal.title),
      category: signal.type.includes("DOCUMENT") ? "DOCUMENTATION" : signal.type.includes("AUTOMATION") ? "AUTOMATION" : "RISK",
      priority,
      title: signal.title,
      description: signal.description,
      impact: `Señal detectada: ${signal.value ?? "sin valor"}`,
      actionLabel: signal.actionLabel,
      actionHref: signal.actionHref,
      sourceType: "MonitoringSignal",
      sourceId: signal.id,
      score: priorityWeight(priority),
      createdAt: signal.detectedAt,
    });
  }

  for (const recommendation of recommendations) {
    const priority = mapPriority(recommendation.priority);
    decisions.push({
      id: decisionKey("Recommendation", recommendation.id, recommendation.title),
      category: "COMPLIANCE",
      priority,
      title: recommendation.title,
      description: recommendation.description,
      impact: "Puede mejorar cumplimiento, score o reducir riesgo.",
      actionLabel: "Ver recomendaciones",
      actionHref: "/recomendaciones",
      sourceType: "Recommendation",
      sourceId: recommendation.id,
      score: priorityWeight(priority),
      createdAt: recommendation.createdAt,
    });
  }

  for (const automation of automationRows) {
    const priority = mapPriority(automation.priority);
    decisions.push({
      id: decisionKey("AutomationProposal", automation.id, automation.title),
      category: "AUTOMATION",
      priority,
      title: automation.title,
      description: automation.description,
      impact: "Automatización supervisada pendiente de aprobación.",
      actionLabel: "Ver Centro AI",
      actionHref: "/ai-center",
      sourceType: "AutomationProposal",
      sourceId: automation.id,
      score: priorityWeight(priority),
      createdAt: automation.createdAt,
    });
  }

  for (const plan of agentPlanRows) {
    const priority = mapPriority(plan.priority);
    decisions.push({
      id: decisionKey("AgentPlan", plan.id, plan.title),
      category: "AI",
      priority,
      title: plan.title,
      description: plan.description,
      impact: plan.expectedImpact,
      actionLabel: "Ver Centro AI",
      actionHref: "/ai-center",
      sourceType: "AgentPlan",
      sourceId: plan.id,
      score: priorityWeight(priority),
      createdAt: plan.createdAt,
    });
  }

  const deduped = Array.from(new Map(decisions.map((decision) => [decision.id, decision])).values())
    .sort((a, b) => b.score - a.score || b.createdAt.getTime() - a.createdAt.getTime());

  return {
    userId,
    decisions: deduped,
    criticalCount: deduped.filter((decision) => decision.priority === "CRITICAL").length,
    highCount: deduped.filter((decision) => decision.priority === "HIGH").length,
    generatedAt: now,
  };
}

function mapPriority(priority: string): DecisionPriority {
  if (priority === "CRITICAL") return "CRITICAL";
  if (priority === "HIGH") return "HIGH";
  if (priority === "LOW") return "LOW";
  return "MEDIUM";
}
