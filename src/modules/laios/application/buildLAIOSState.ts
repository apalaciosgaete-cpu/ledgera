import { prisma } from "@/lib/prisma";
import {
  type LAIOSState,
  type OperatingStatus,
  type EngineState,
  type EngineStatus,
  resolveOperatingStatus,
} from "@/modules/laios/domain/laiosKernel";

export async function buildLAIOSState(userId: string): Promise<LAIOSState> {
  const now = new Date();

  const [
    monitorSummary,
    activeCases,
    activeWorkflows,
    pendingDecisions,
    pendingExecutions,
    adaptiveProfile,
    smartTaxScore,
  ] = await Promise.all([
    // Monitor — get latest monitoring signals count
    getMonitorStatus(userId).catch(() => ({ status: "OK" as EngineStatus, summary: "Monitor no disponible." })),
    // Active cases
    prisma.taxCase
      .count({ where: { userId, status: { in: ["OPEN", "ACTION_REQUIRED", "INVESTIGATING"] } } })
      .catch(() => 0),
    // Active workflows
    prisma.workflow
      .count({ where: { userId, status: { notIn: ["COMPLETED", "FAILED"] } } })
      .catch(() => 0),
    // Pending decisions — count signals from monitor
    getPendingDecisionsCount(userId).catch(() => 0),
    // Pending executions
    prisma.$queryRawUnsafe<{ count: bigint }[]>(
      `SELECT COUNT(*)::bigint AS count FROM execution_requests WHERE user_id = $1 AND status = 'PENDING'`,
      userId,
    ).catch(() => [{ count: BigInt(0) }]),
    // Adaptive profile
    prisma.adaptiveTaxProfile
      .findFirst({ where: { userId } })
      .catch(() => null),
    // Smart tax score
    prisma.smartTaxScore
      .findFirst({ where: { userId }, orderBy: { evaluatedAt: "desc" } })
      .catch(() => null),
  ]);

  const execCount = Number(pendingExecutions[0]?.count ?? 0);
  const profileScore = adaptiveProfile?.complianceScore ?? null;
  const taxHealthScoreValue = smartTaxScore?.score ?? null;

  // Build engine states
  const engineStates: EngineState[] = [
    { name: "Monitor", ...monitorSummary },
    { name: "Casos", status: activeCases > 0 ? (activeCases >= 5 ? "CRITICAL" : "ATTENTION") : "OK", summary: `${activeCases} caso(s) activo(s)` },
    { name: "Workflows", status: activeWorkflows > 0 ? (activeWorkflows >= 3 ? "ATTENTION" : "OK") : "OK", summary: `${activeWorkflows} workflow(s) activo(s)` },
    { name: "Decisiones", status: pendingDecisions > 0 ? (pendingDecisions >= 10 ? "ATTENTION" : "OK") : "OK", summary: `${pendingDecisions} decisión(es) pendiente(s)` },
    { name: "Ejecuciones", status: execCount > 0 ? (execCount >= 5 ? "ATTENTION" : "OK") : "OK", summary: `${execCount} ejecución(es) pendiente(s)` },
    {
      name: "Perfil Adaptativo",
      status: profileScore !== null && profileScore < 30 ? "ATTENTION" : "OK",
      summary: profileScore !== null ? `Score: ${Math.round(profileScore * 100)}%` : "Sin datos",
    },
    {
      name: "Memoria Tributaria",
      status: "OK",
      summary: taxHealthScoreValue !== null ? `Tax Score: ${taxHealthScoreValue}` : "Sin datos",
    },
  ];

  // Calculate tax health score
  const taxHealthScore = taxHealthScoreValue ?? 0;

  // Determine operating status
  const operatingStatus = resolveOperatingStatus(engineStates);

  // Generate executive summary
  const executiveSummary = generateExecutiveSummary(
    operatingStatus,
    activeCases,
    activeWorkflows,
    pendingDecisions,
    execCount,
    engineStates,
  );

  return {
    userId,
    monitoringStatus: monitorSummary.status,
    activeCases,
    activeWorkflows,
    pendingDecisions,
    pendingExecutions: execCount,
    adaptiveProfileScore: profileScore,
    taxHealthScore,
    operatingStatus,
    executiveSummary,
    engineStates,
    generatedAt: now,
  };
}

async function getMonitorStatus(
  userId: string,
): Promise<{ status: EngineStatus; summary: string }> {
  const risk = await prisma.taxRiskScore
    .findFirst({ where: { userId }, orderBy: { evaluatedAt: "desc" } })
    .catch(() => null);

  if (risk?.level === "CRITICAL") {
    return { status: "CRITICAL", summary: "Riesgo tributario crítico detectado." };
  }
  if (risk?.level === "HIGH") {
    return { status: "ATTENTION", summary: "Riesgo tributario elevado." };
  }
  return { status: "OK", summary: "Sin señales críticas." };
}

async function getPendingDecisionsCount(userId: string): Promise<number> {
  const [recommendations, agentPlans, automations] = await Promise.all([
    prisma.recommendation.count({ where: { userId, status: "ACTIVE" } }).catch(() => 0),
    prisma.$queryRawUnsafe<{ count: bigint }[]>(
      `SELECT COUNT(*)::bigint AS count FROM agent_plans WHERE user_id = $1 AND status = 'PROPOSED'`,
      userId,
    ).catch(() => [{ count: BigInt(0) }]),
    prisma.$queryRawUnsafe<{ count: bigint }[]>(
      `SELECT COUNT(*)::bigint AS count FROM automation_proposals WHERE user_id = $1 AND status = 'PROPOSED'`,
      userId,
    ).catch(() => [{ count: BigInt(0) }]),
  ]);

  return recommendations + Number(agentPlans[0]?.count ?? 0) + Number(automations[0]?.count ?? 0);
}

function generateExecutiveSummary(
  status: OperatingStatus,
  activeCases: number,
  activeWorkflows: number,
  pendingDecisions: number,
  pendingExecutions: number,
  engineStates: EngineState[],
): string {
  const parts: string[] = [];
  parts.push(`Estado General: ${status}`);

  const criticalEngines = engineStates.filter((e) => e.status === "CRITICAL");
  const attentionEngines = engineStates.filter((e) => e.status === "ATTENTION");

  if (activeCases > 0) {
    parts.push(`Se detectan ${activeCases} caso(s) tributario(s) activo(s).`);
  }
  if (activeWorkflows > 0) {
    parts.push(`Existe(n) ${activeWorkflows} workflow(s) en ejecución.`);
  }
  if (pendingDecisions > 0) {
    parts.push(`Hay ${pendingDecisions} decisión(es) pendiente(s) de revisión.`);
  }
  if (pendingExecutions > 0) {
    parts.push(`${pendingExecutions} ejecución(es) supervisada(s) esperando aprobación.`);
  }
  if (criticalEngines.length > 0) {
    parts.push(`Motores en estado crítico: ${criticalEngines.map((e) => e.name).join(", ")}.`);
  }
  if (attentionEngines.length > 0) {
    parts.push(`Motores requiriendo atención: ${attentionEngines.map((e) => e.name).join(", ")}.`);
  }
  if (status === "OPTIMAL" || status === "NORMAL") {
    parts.push("No se detectan riesgos críticos. El sistema opera dentro de parámetros normales.");
  }

  return parts.join(" ");
}

export async function saveLAIOSState(state: LAIOSState): Promise<void> {
  const now = new Date();

  // Remove old states (keep last 30)
  await prisma.$executeRawUnsafe(
    `DELETE FROM laios_states WHERE user_id = $1 AND id NOT IN (SELECT id FROM laios_states WHERE user_id = $1 ORDER BY created_at DESC LIMIT 30)`,
    state.userId,
  ).catch(() => null);

  await prisma.$executeRawUnsafe(
    `INSERT INTO laios_states (id, user_id, operating_status, active_cases, active_workflows, pending_decisions, pending_executions, adaptive_profile_score, tax_health_score, executive_summary, engine_states, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::jsonb, $12::timestamptz)`,
    crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    state.userId,
    state.operatingStatus,
    state.activeCases,
    state.activeWorkflows,
    state.pendingDecisions,
    state.pendingExecutions,
    state.adaptiveProfileScore,
    state.taxHealthScore,
    state.executiveSummary,
    JSON.stringify(state.engineStates),
    now.toISOString(),
  );
}

export async function getLatestLAIOSState(userId: string): Promise<LAIOSState | null> {
  const rows = await prisma.$queryRawUnsafe<Record<string, unknown>[]>(
    `SELECT id, user_id, operating_status, active_cases, active_workflows, pending_decisions, pending_executions, adaptive_profile_score, tax_health_score, executive_summary, engine_states, created_at
     FROM laios_states
     WHERE user_id = $1
     ORDER BY created_at DESC
     LIMIT 1`,
    userId,
  );

  if (rows.length === 0) return null;

  const row = rows[0];
  return {
    id: row.id as string,
    userId: row.user_id as string,
    monitoringStatus: "", // from engine_states
    activeCases: Number(row.active_cases),
    activeWorkflows: Number(row.active_workflows),
    pendingDecisions: Number(row.pending_decisions),
    pendingExecutions: Number(row.pending_executions),
    adaptiveProfileScore: row.adaptive_profile_score != null ? Number(row.adaptive_profile_score) : null,
    taxHealthScore: row.tax_health_score != null ? Number(row.tax_health_score) : null,
    operatingStatus: row.operating_status as OperatingStatus,
    executiveSummary: row.executive_summary as string,
    engineStates: parseEngineStates(row.engine_states),
    generatedAt: row.created_at instanceof Date ? row.created_at : new Date(row.created_at as string),
  };
}

function parseEngineStates(data: unknown): EngineState[] {
  if (!data) return [];
  try {
    if (typeof data === "string") return JSON.parse(data);
    return data as EngineState[];
  } catch {
    return [];
  }
}

export async function getExpertLAIOSStates(
  limit = 50,
): Promise<{ userId: string; operatingStatus: string; executiveSummary: string; generatedAt: Date }[]> {
  const rows = await prisma.$queryRawUnsafe<Record<string, unknown>[]>(
    `SELECT DISTINCT ON (user_id) user_id, operating_status, executive_summary, created_at
     FROM laios_states
     ORDER BY user_id, created_at DESC
     LIMIT $1`,
    limit,
  );

  return rows.map((r) => ({
    userId: r.user_id as string,
    operatingStatus: r.operating_status as string,
    executiveSummary: r.executive_summary as string,
    generatedAt: r.created_at instanceof Date ? r.created_at : new Date(r.created_at as string),
  }));
}
