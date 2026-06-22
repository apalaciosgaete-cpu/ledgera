import { prisma } from "@/lib/prisma";
import {
  type DecisionCategory,
  type DecisionItem,
  type DecisionCenterQueue,
  type DecisionPriority,
} from "@/modules/decision-center/domain/decision-center";
import { evaluateMonitoringSignals } from "@/modules/monitoring/application/evaluateMonitoringSignals";

const SEEN_PREFIX = "__dc_";

function deduplicate(items: DecisionItem[]): DecisionItem[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = `${SEEN_PREFIX}${item.source}::${item.sourceId ?? item.title}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export async function buildDecisionCenter(userId: string): Promise<DecisionCenterQueue> {
  const now = new Date();

  const [
    monitorSummary,
    recommendations,
    agentPlans,
    simulations,
    automationProposals,
    riskScore,
    taxScore,
    pendingTasks,
  ] = await Promise.all([
    evaluateMonitoringSignals(userId).catch(() => null),
    prisma.recommendation.findMany({
      where: { userId, status: "ACTIVE" },
      orderBy: { createdAt: "desc" },
      take: 50,
    }).catch(() => []),
    prisma.$queryRawUnsafe<Array<{ id: string; title: string; description: string; priority: string; expected_impact: string; created_at: Date }>>(
      `SELECT id, title, description, priority, expected_impact, created_at FROM agent_plans WHERE user_id = $1 AND status = 'PROPOSED' ORDER BY created_at DESC LIMIT 50`,
      userId,
    ).catch(() => []),
    prisma.$queryRawUnsafe<Array<{ id: string; name: string; scenario_type: string; projected_risk: number | null; projected_score: number | null; created_at: Date }>>(
      `SELECT id, name, scenario_type, projected_risk, projected_score, created_at FROM tax_simulations WHERE user_id = $1 ORDER BY created_at DESC LIMIT 20`,
      userId,
    ).catch(() => []),
    prisma.$queryRawUnsafe<Array<{ id: string; title: string | null; description: string | null; status: string; created_at: Date }>>(
      `SELECT id, title, description, status, created_at FROM automation_proposals WHERE user_id = $1 AND status = 'PROPOSED' ORDER BY created_at DESC LIMIT 20`,
      userId,
    ).catch(() => []),
    prisma.taxRiskScore.findFirst({ where: { userId }, orderBy: { evaluatedAt: "desc" } }).catch(() => null),
    prisma.smartTaxScore.findFirst({ where: { userId }, orderBy: { evaluatedAt: "desc" } }).catch(() => null),
    prisma.task.count({ where: { userId, status: { notIn: ["COMPLETED", "CANCELLED"] } } }).catch(() => 0),
  ]);

  const items: DecisionItem[] = [];

  // 1. From Monitor signals
  if (monitorSummary) {
    for (const signal of monitorSummary.signals) {
      let category: DecisionCategory = "RIESGO";
      if (signal.type === "DOCUMENT_REJECTED") category = "DOCUMENTACION";
      else if (signal.type === "TASKS_ACCUMULATED") category = "CUMPLIMIENTO";
      else if (signal.type === "RECOMMENDATIONS_PENDING") category = "AI";
      else if (signal.type === "AUTOMATIONS_PENDING") category = "AUTOMATIZACION";
      else if (signal.type === "AGENT_PLANS_PENDING") category = "AI";

      let priority: DecisionPriority = "MEDIUM";
      if (signal.severity === "CRITICAL") priority = "CRITICAL";
      else if (signal.severity === "WARNING") priority = "HIGH";

      items.push({
        id: `monitor-${signal.id}`,
        title: signal.title,
        description: signal.description,
        category,
        source: "MONITOR",
        priority,
        impact: typeof signal.value === "number" ? { label: "Valor", value: signal.value, type: "RISK" } : null,
        actionLabel: signal.actionLabel,
        actionHref: signal.actionHref,
        sourceId: signal.id,
        metadata: { signalType: signal.type },
        detectedAt: signal.detectedAt,
      });
    }
  }

  // 2. From Active Recommendations
  for (const rec of recommendations) {
    items.push({
      id: `rec-${rec.id}`,
      title: rec.title ?? "Recomendación pendiente",
      description: rec.description ?? "",
      category: "AI",
      source: "COPILOTO",
      priority: "MEDIUM",
      impact: null,
      actionLabel: "Ver recomendación",
      actionHref: "/recomendaciones",
      sourceId: rec.id,
      metadata: null,
      detectedAt: rec.createdAt instanceof Date ? rec.createdAt : now,
    });
  }

  // 3. From Agent Plans
  for (const plan of agentPlans) {
    const planPriority: DecisionPriority = plan.priority === "CRITICAL" ? "CRITICAL"
      : plan.priority === "HIGH" ? "HIGH"
      : plan.priority === "LOW" ? "LOW"
      : "MEDIUM";
    items.push({
      id: `agent-${plan.id}`,
      title: plan.title ?? "Plan AI propuesto",
      description: plan.description ?? "",
      category: "AI",
      source: "AGENT_AI",
      priority: planPriority,
      impact: plan.expected_impact ? { label: "Impacto esperado", value: 0, type: "SCORE" } : null,
      actionLabel: "Revisar plan",
      actionHref: "/ai-center",
      sourceId: plan.id,
      metadata: { expectedImpact: plan.expected_impact ?? null },
      detectedAt: plan.created_at instanceof Date ? plan.created_at : now,
    });
  }

  // 4. From Risk Score
  if (riskScore) {
    const r = riskScore as { level?: string; score?: number };
    if (r.level === "CRITICAL" || r.level === "HIGH" || (r.score != null && r.score >= 60)) {
      items.push({
        id: "risk-score-decision",
        title: r.level === "CRITICAL" ? "Riesgo tributario crítico" : "Riesgo tributario elevado",
        description: `Tu nivel de riesgo es ${r.level === "CRITICAL" ? "crítico" : "alto"} (score: ${r.score ?? "?"}). Revisa tu expediente.`,
        category: "RIESGO",
        source: "MONITOR",
        priority: r.level === "CRITICAL" ? "CRITICAL" : "HIGH",
        impact: r.score != null ? { label: "Risk Score", value: r.score, type: "RISK" } : null,
        actionLabel: "Ver expediente",
        actionHref: "/mi-expediente",
        sourceId: "risk-score",
        metadata: { level: r.level, score: r.score },
        detectedAt: now,
      });
    }
  }

  // 5. From Tax Score
  if (taxScore) {
    const scoreVal = (taxScore as { score?: number })?.score;
    if (scoreVal != null && scoreVal < 50) {
      items.push({
        id: "tax-score-decision",
        title: "Score tributario bajo",
        description: `Tu Smart Tax Score es ${scoreVal}. Revisa las recomendaciones para mejorarlo.`,
        category: "AHORRO_TRIBUTARIO",
        source: "MONITOR",
        priority: scoreVal < 30 ? "CRITICAL" : "HIGH",
        impact: { label: "Tax Score", value: scoreVal, type: "SCORE" },
        actionLabel: "Ver score",
        actionHref: "/score-tributario",
        sourceId: "tax-score",
        metadata: { score: scoreVal },
        detectedAt: now,
      });
    }
  }

  // 6. From Pending Tasks
  if (pendingTasks >= 5) {
    items.push({
      id: "tasks-pending-decision",
      title: "Tareas pendientes acumuladas",
      description: `Tienes ${pendingTasks} tareas sin completar. Completarlas reduce el riesgo general.`,
      category: "CUMPLIMIENTO",
      source: "MONITOR",
      priority: pendingTasks >= 15 ? "CRITICAL" : pendingTasks >= 10 ? "HIGH" : "MEDIUM",
      impact: { label: "Tareas", value: pendingTasks, type: "COMPLIANCE" },
      actionLabel: "Ver tareas",
      actionHref: "/tareas",
      sourceId: "tasks-pending",
      metadata: { count: pendingTasks },
      detectedAt: now,
    });
  }

  // 7. From Automation Proposals (direct source)
  for (const prop of automationProposals) {
    items.push({
      id: `auto-${prop.id}`,
      title: prop.title ?? "Propuesta de automatización",
      description: prop.description ?? "LEDGERA sugiere automatizar un proceso tributario.",
      category: "AUTOMATIZACION",
      source: "AUTOMATION",
      priority: "MEDIUM",
      impact: null,
      actionLabel: "Revisar propuesta",
      actionHref: "/ai-center",
      sourceId: prop.id,
      metadata: { status: prop.status },
      detectedAt: prop.created_at instanceof Date ? prop.created_at : now,
    });
  }

  // 8. From Simulador (simulations)
  for (const sim of simulations) {
    const hasProjection = sim.projected_risk != null || sim.projected_score != null;
    items.push({
      id: `sim-${sim.id}`,
      title: `Simulación: ${sim.name ?? "Escenario " + sim.scenario_type}`,
      description: hasProjection
        ? `Riesgo proyectado: ${sim.projected_risk ?? "—"} | Score proyectado: ${sim.projected_score ?? "—"}. Revisa los resultados.`
        : `Simulación de tipo ${sim.scenario_type}. Revisa los resultados y acciones sugeridas.`,
      category: "AHORRO_TRIBUTARIO",
      source: "SIMULADOR",
      priority: "LOW",
      impact: sim.projected_score != null ? { label: "Score proyectado", value: sim.projected_score, type: "SCORE" } : null,
      actionLabel: "Ver simulación",
      actionHref: "/simulador",
      sourceId: sim.id,
      metadata: { scenarioType: sim.scenario_type, projectedRisk: sim.projected_risk, projectedScore: sim.projected_score },
      detectedAt: sim.created_at instanceof Date ? sim.created_at : now,
    });
  }

  // Deduplicate
  const unique = deduplicate(items);

  // Sort by priority (CRITICAL first) then by impact value descending
  const sorted = unique.sort((a, b) => {
    const priorityOrder: Record<DecisionPriority, number> = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
    const prioDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
    if (prioDiff !== 0) return prioDiff;
    const impactA = a.impact?.value ?? 0;
    const impactB = b.impact?.value ?? 0;
    return impactB - impactA;
  });

  const urgentCount = sorted.filter((i) => i.priority === "CRITICAL").length;
  const attentionCount = sorted.filter((i) => i.priority === "HIGH").length;
  const opportunityCount = sorted.filter((i) => i.priority === "MEDIUM" || i.priority === "LOW").length;

  return {
    userId,
    total: sorted.length,
    urgentCount,
    attentionCount,
    opportunityCount,
    items: sorted,
    generatedAt: now,
  };
}
