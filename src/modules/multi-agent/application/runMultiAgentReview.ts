import { prisma } from "@/lib/prisma";
import { recordAuditEvent } from "@/modules/audit/application/recordAuditEvent";
import {
  type AgentAssessment,
  type AgentAssessmentSeverity,
  type MultiAgentReport,
  type SpecializedAgentType,
  type SubjectType,
  AGENT_TYPES,
  resolveFinalSeverity,
} from "@/modules/multi-agent/domain/agent";
import {
  saveAssessment,
  findAssessmentsBySubject,
} from "@/modules/multi-agent/infrastructure/agentAssessmentRepository";

interface AgentInput {
  userId: string;
  subjectType: SubjectType;
  subjectId: string;
}

async function riskAgent(input: AgentInput): Promise<Omit<AgentAssessment, "id" | "createdAt">> {
  const riskScore = await prisma.taxRiskScore
    .findFirst({ where: { userId: input.userId }, orderBy: { evaluatedAt: "desc" } })
    .catch(() => null);

  const severity: AgentAssessmentSeverity = riskScore?.level === "CRITICAL" ? "CRITICAL"
    : riskScore?.level === "HIGH" ? "HIGH"
    : riskScore?.level === "MEDIUM" ? "MEDIUM"
    : "LOW";

  return {
    userId: input.userId,
    agentType: "RISK_AGENT",
    subjectType: input.subjectType,
    subjectId: input.subjectId,
    severity,
    confidence: riskScore ? Math.min(0.95, 0.5 + (riskScore.score ?? 0) / 200) : 0.3,
    summary: riskScore
      ? `Riesgo tributario ${riskScore.level?.toLowerCase() ?? "desconocido"} (score: ${riskScore.score ?? "?"}).`
      : "Sin datos de riesgo disponibles.",
    recommendation: riskScore?.level === "CRITICAL"
      ? "Revisar expediente tributario completo. Programar revisión con asesor dentro de 48 horas."
      : riskScore?.level === "HIGH"
        ? "Monitorear señales de riesgo. Revisar Centro AI para recomendaciones."
        : "Mantener monitoreo regular.",
    metadata: { riskScore: riskScore?.score ?? null, riskLevel: riskScore?.level ?? null },
  };
}

async function complianceAgent(input: AgentInput): Promise<Omit<AgentAssessment, "id" | "createdAt">> {
  const [pendingTasks, activeRecommendations, openCases] = await Promise.all([
    prisma.task.count({ where: { userId: input.userId, status: { notIn: ["COMPLETED", "CANCELLED"] } } }).catch(() => 0),
    prisma.recommendation.count({ where: { userId: input.userId, status: "ACTIVE" } }).catch(() => 0),
    prisma.taxCase.count({ where: { userId: input.userId, status: { in: ["OPEN", "ACTION_REQUIRED"] } } }).catch(() => 0),
  ]);

  const totalIssues = pendingTasks + activeRecommendations + openCases;

  const severity: AgentAssessmentSeverity = totalIssues >= 20 ? "CRITICAL"
    : totalIssues >= 10 ? "HIGH"
    : totalIssues >= 5 ? "MEDIUM"
    : "LOW";

  return {
    userId: input.userId,
    agentType: "COMPLIANCE_AGENT",
    subjectType: input.subjectType,
    subjectId: input.subjectId,
    severity,
    confidence: Math.min(0.9, 0.4 + totalIssues * 0.03),
    summary: `Cumplimiento: ${pendingTasks} tareas pendientes, ${activeRecommendations} recomendaciones activas, ${openCases} casos abiertos.`,
    recommendation: totalIssues >= 10
      ? `Priorizar la resolución de ${totalIssues} incidencias de cumplimiento. Comenzar por casos críticos.`
      : "Nivel de cumplimiento aceptable. Mantener seguimiento regular.",
    metadata: { pendingTasks, activeRecommendations, openCases, totalIssues },
  };
}

async function documentAgent(input: AgentInput): Promise<Omit<AgentAssessment, "id" | "createdAt">> {
  const [rejectedDocs, totalDocs] = await Promise.all([
    prisma.taxDocument.count({ where: { userId: input.userId, status: "REJECTED" } }).catch(() => 0),
    prisma.taxDocument.count({ where: { userId: input.userId } }).catch(() => 0),
  ]);

  const severity: AgentAssessmentSeverity = rejectedDocs >= 5 ? "CRITICAL"
    : rejectedDocs >= 3 ? "HIGH"
    : rejectedDocs >= 1 ? "MEDIUM"
    : "LOW";

  return {
    userId: input.userId,
    agentType: "DOCUMENT_AGENT",
    subjectType: input.subjectType,
    subjectId: input.subjectId,
    severity,
    confidence: totalDocs > 0 ? Math.min(0.95, rejectedDocs / totalDocs + 0.3) : 0.3,
    summary: rejectedDocs > 0
      ? `${rejectedDocs} de ${totalDocs} documentos tributarios rechazados. Requieren corrección urgente.`
      : "Todos los documentos tributarios están en estado válido.",
    recommendation: rejectedDocs > 0
      ? `Corregir y reenviar ${rejectedDocs} documento(s) rechazado(s) dentro de las próximas 48 horas.`
      : "No se requieren acciones correctivas documentales.",
    metadata: { rejectedDocuments: rejectedDocs, totalDocuments: totalDocs },
  };
}

async function financialAgent(input: AgentInput): Promise<Omit<AgentAssessment, "id" | "createdAt">> {
  const [riskScore, taxScore, pendingTasks] = await Promise.all([
    prisma.taxRiskScore.findFirst({ where: { userId: input.userId }, orderBy: { evaluatedAt: "desc" } }).catch(() => null),
    prisma.smartTaxScore.findFirst({ where: { userId: input.userId }, orderBy: { evaluatedAt: "desc" } }).catch(() => null),
    prisma.task.count({ where: { userId: input.userId, status: { notIn: ["COMPLETED", "CANCELLED"] } } }).catch(() => 0),
  ]);

  const riskValue = riskScore?.score ?? 0;
  const taxValue = taxScore?.score ?? 0;
  const estimatedImpact = Math.round((riskValue * pendingTasks * 0.05 + (100 - taxValue) * 0.1) * 100) / 100;

  const severity: AgentAssessmentSeverity = estimatedImpact >= 50 ? "CRITICAL"
    : estimatedImpact >= 20 ? "HIGH"
    : estimatedImpact >= 5 ? "MEDIUM"
    : "LOW";

  return {
    userId: input.userId,
    agentType: "FINANCIAL_AGENT",
    subjectType: input.subjectType,
    subjectId: input.subjectId,
    severity,
    confidence: riskScore && taxScore ? 0.7 : 0.4,
    summary: `Impacto financiero estimado: ${estimatedImpact}. Risk Score: ${riskValue}, Tax Score: ${taxValue}.`,
    recommendation: estimatedImpact >= 20
      ? `El impacto financiero potencial es significativo (${estimatedImpact}). Se recomienda revisión de asesor tributario.`
      : "Impacto financiero controlado. Mantener monitoreo.",
    metadata: { estimatedImpact, riskScore: riskValue, taxScore: taxValue, pendingTasks },
  };
}

async function executionAgent(input: AgentInput): Promise<Omit<AgentAssessment, "id" | "createdAt">> {
  const [activeAutomations, agentPlans] = await Promise.all([
    prisma.$queryRawUnsafe<{ count: bigint }[]>(
      `SELECT COUNT(*)::bigint AS count FROM automation_proposals WHERE user_id = $1 AND status = 'PROPOSED'`,
      input.userId,
    ).catch(() => [{ count: BigInt(0) }]),
    prisma.$queryRawUnsafe<{ count: bigint }[]>(
      `SELECT COUNT(*)::bigint AS count FROM agent_plans WHERE user_id = $1 AND status = 'PROPOSED'`,
      input.userId,
    ).catch(() => [{ count: BigInt(0) }]),
  ]);

  const totalActions = Number(activeAutomations[0]?.count ?? 0) + Number(agentPlans[0]?.count ?? 0);

  const severity: AgentAssessmentSeverity = totalActions >= 10 ? "HIGH"
    : totalActions >= 3 ? "MEDIUM"
    : "LOW";

  return {
    userId: input.userId,
    agentType: "EXECUTION_AGENT",
    subjectType: input.subjectType,
    subjectId: input.subjectId,
    severity,
    confidence: totalActions > 0 ? 0.6 : 0.5,
    summary: totalActions > 0
      ? `${totalActions} acción(es) supervisada(s) pendiente(s): ${activeAutomations[0]?.count ?? 0} automatizaciones, ${agentPlans[0]?.count ?? 0} planes AI.`
      : "No hay acciones supervisadas pendientes.",
    recommendation: totalActions > 0
      ? `Revisar ${totalActions} propuestas de ejecución supervisada en el Centro AI.`
      : "Sin propuestas de ejecución pendientes.",
    metadata: { pendingAutomations: Number(activeAutomations[0]?.count ?? 0), pendingAgentPlans: Number(agentPlans[0]?.count ?? 0) },
  };
}

const AGENT_RUNNERS: Record<SpecializedAgentType, (input: AgentInput) => Promise<Omit<AgentAssessment, "id" | "createdAt">>> = {
  RISK_AGENT: riskAgent,
  COMPLIANCE_AGENT: complianceAgent,
  DOCUMENT_AGENT: documentAgent,
  FINANCIAL_AGENT: financialAgent,
  EXECUTION_AGENT: executionAgent,
};

export async function runMultiAgentReview(
  userId: string,
  subjectType: SubjectType,
  subjectId: string,
): Promise<MultiAgentReport> {
  const now = new Date();

  await recordAuditEvent({
    userId,
    category: "AI",
    severity: "INFO",
    event: "multi_agent_review_started",
    description: `Revisión multiagente iniciada para ${subjectType}:${subjectId}`,
    result: "SUCCESS",
    entityType: subjectType,
    entityId: subjectId,
    metadata: { subjectType, subjectId },
  }).catch(() => null);

  const input: AgentInput = { userId, subjectType, subjectId };

  // Run all 5 agents in parallel
  const results = await Promise.all(
    AGENT_TYPES.map(async (agentType) => {
      try {
        const runner = AGENT_RUNNERS[agentType];
        const assessment = await runner(input);

        const saved = await saveAssessment({
          userId: assessment.userId,
          agentType: assessment.agentType,
          subjectType: assessment.subjectType,
          subjectId: assessment.subjectId,
          severity: assessment.severity,
          confidence: assessment.confidence,
          summary: assessment.summary,
          recommendation: assessment.recommendation,
          metadata: assessment.metadata,
        });

        await recordAuditEvent({
          userId,
          category: "AI",
          severity: "INFO",
          event: "multi_agent_assessment_created",
          description: `${agentType} evaluó ${subjectType}`,
          result: "SUCCESS",
          entityType: "AgentAssessment",
          entityId: saved.id,
          metadata: { agentType, severity: assessment.severity, confidence: assessment.confidence },
        }).catch(() => null);

        return saved;
      } catch {
        // Fallback assessment on error
        const fallback = await saveAssessment({
          userId,
          agentType,
          subjectType,
          subjectId,
          severity: "LOW",
          confidence: 0,
          summary: `El ${agentType} no pudo completar su evaluación.`,
          recommendation: "Reintentar la revisión más tarde.",
          metadata: { error: true },
        });
        return fallback;
      }
    }),
  );

  const finalSeverity = resolveFinalSeverity(results);
  const finalSummary = results
    .filter((a) => a.severity === finalSeverity)
    .map((a) => a.summary)
    .join(" | ");

  const finalRecommendation = results
    .filter((a) => a.severity === finalSeverity || a.severity === "HIGH")
    .slice(0, 3)
    .map((a) => `[${a.agentType}] ${a.recommendation}`)
    .join("\n");

  await recordAuditEvent({
    userId,
    category: "AI",
    severity: finalSeverity === "CRITICAL" ? "CRITICAL" : finalSeverity === "HIGH" ? "WARNING" : "INFO",
    event: "multi_agent_review_completed",
    description: `Revisión multiagente completada. Severidad final: ${finalSeverity}`,
    result: "SUCCESS",
    entityType: subjectType,
    entityId: subjectId,
    metadata: { finalSeverity, assessmentsCount: results.length },
  }).catch(() => null);

  return {
    userId,
    subjectType,
    subjectId,
    assessments: results,
    finalSeverity,
    finalSummary,
    finalRecommendation,
    generatedAt: now,
  };
}
