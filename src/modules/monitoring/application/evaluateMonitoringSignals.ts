import { prisma } from "@/lib/prisma";
import { resolveMonitoringStatus, type MonitoringSignal, type MonitoringSummary } from "@/modules/monitoring/domain/monitoring";

export async function evaluateMonitoringSignals(userId: string): Promise<MonitoringSummary> {
  const [risk, rejectedDocuments, pendingTasks, activeRecommendations, automationRows, agentPlanRows] = await Promise.all([
    prisma.taxRiskScore.findFirst({ where: { userId }, orderBy: { evaluatedAt: "desc" } }),
    prisma.taxDocument.count({ where: { userId, status: "REJECTED" } }),
    prisma.task.count({ where: { userId, status: { notIn: ["COMPLETED", "CANCELLED"] } } }),
    prisma.recommendation.count({ where: { userId, status: "ACTIVE" } }),
    prisma.$queryRawUnsafe<{ count: bigint }[]>(
      "SELECT COUNT(*)::bigint AS count FROM automation_proposals WHERE user_id = $1 AND status = 'PROPOSED'",
      userId,
    ).catch(() => [{ count: BigInt(0) }]),
    prisma.$queryRawUnsafe<{ count: bigint }[]>(
      "SELECT COUNT(*)::bigint AS count FROM agent_plans WHERE user_id = $1 AND status = 'PROPOSED'",
      userId,
    ).catch(() => [{ count: BigInt(0) }]),
  ]);

  const signals: MonitoringSignal[] = [];
  const now = new Date();

  if (risk?.level === "CRITICAL") {
    signals.push({
      id: "risk-critical",
      type: "RISK_CRITICAL",
      severity: "CRITICAL",
      title: "Riesgo tributario crítico",
      description: "LEDGERA detectó un nivel de riesgo crítico que requiere revisión inmediata.",
      actionLabel: "Ver expediente",
      actionHref: "/mi-expediente",
      value: risk.score,
      detectedAt: now,
    });
  } else if (risk?.level === "HIGH") {
    signals.push({
      id: "risk-high",
      type: "RISK_HIGH",
      severity: "WARNING",
      title: "Riesgo tributario alto",
      description: "Hay señales de riesgo que conviene revisar durante esta jornada.",
      actionLabel: "Ver Centro AI",
      actionHref: "/ai-center",
      value: risk.score,
      detectedAt: now,
    });
  }

  if (rejectedDocuments > 0) {
    signals.push({
      id: "documents-rejected",
      type: "DOCUMENT_REJECTED",
      severity: "CRITICAL",
      title: "Documentos rechazados",
      description: "Existen documentos tributarios rechazados que deben corregirse.",
      actionLabel: "Ver documentos",
      actionHref: "/documentos",
      value: rejectedDocuments,
      detectedAt: now,
    });
  }

  if (pendingTasks >= 10) {
    signals.push({
      id: "tasks-accumulated",
      type: "TASKS_ACCUMULATED",
      severity: "WARNING",
      title: "Tareas acumuladas",
      description: "Hay varias tareas pendientes. Conviene priorizarlas antes de que aumente el riesgo.",
      actionLabel: "Ver tareas",
      actionHref: "/tareas",
      value: pendingTasks,
      detectedAt: now,
    });
  }

  if (activeRecommendations >= 5) {
    signals.push({
      id: "recommendations-pending",
      type: "RECOMMENDATIONS_PENDING",
      severity: "WARNING",
      title: "Recomendaciones pendientes",
      description: "Hay recomendaciones activas que pueden mejorar tu salud tributaria.",
      actionLabel: "Ver recomendaciones",
      actionHref: "/recomendaciones",
      value: activeRecommendations,
      detectedAt: now,
    });
  }

  const automations = Number(automationRows[0]?.count ?? 0);
  if (automations > 0) {
    signals.push({
      id: "automations-pending",
      type: "AUTOMATIONS_PENDING",
      severity: "INFO",
      title: "Automatizaciones sugeridas",
      description: "LEDGERA tiene propuestas supervisadas pendientes de revisión.",
      actionLabel: "Ver Centro AI",
      actionHref: "/ai-center",
      value: automations,
      detectedAt: now,
    });
  }

  const agentPlans = Number(agentPlanRows[0]?.count ?? 0);
  if (agentPlans > 0) {
    signals.push({
      id: "agent-plans-pending",
      type: "AGENT_PLANS_PENDING",
      severity: "INFO",
      title: "Planes AI pendientes",
      description: "Existen planes supervisados que puedes aprobar o revisar.",
      actionLabel: "Ver Centro AI",
      actionHref: "/ai-center",
      value: agentPlans,
      detectedAt: now,
    });
  }

  return {
    userId,
    status: resolveMonitoringStatus(signals),
    signals,
    criticalCount: signals.filter((signal) => signal.severity === "CRITICAL").length,
    warningCount: signals.filter((signal) => signal.severity === "WARNING").length,
    generatedAt: now,
  };
}
