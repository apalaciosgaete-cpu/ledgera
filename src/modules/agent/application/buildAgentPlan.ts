import { prisma } from "@/lib/prisma";
import { recordAuditEvent } from "@/modules/audit/application/recordAuditEvent";
import { createAgentPlan } from "@/modules/agent/infrastructure/agentRepository";
import type { AgentPlan } from "@/modules/agent/domain/agent";

export type BuildAgentPlanResult =
  | { ok: true; created: number; plans: AgentPlan[] }
  | { ok: false; message: string };

export async function buildAgentPlans(userId: string): Promise<BuildAgentPlanResult> {
  try {
    const [risk, rejectedDocuments, pendingTasks] = await Promise.all([
      prisma.taxRiskScore.findFirst({ where: { userId }, orderBy: { evaluatedAt: "desc" } }),
      prisma.taxDocument.count({ where: { userId, status: "REJECTED" } }),
      prisma.task.count({ where: { userId, status: { notIn: ["COMPLETED", "CANCELLED"] } } }),
    ]);

    const plans: AgentPlan[] = [];

    if (risk && ["HIGH", "CRITICAL"].includes(risk.level)) {
      plans.push(await createAgentPlan({
        userId,
        title: "Plan para reducir riesgo tributario",
        description: "LEDGERA propone un plan supervisado para ordenar tareas, revisar alertas y recalcular el estado tributario.",
        priority: risk.level === "CRITICAL" ? "CRITICAL" : "HIGH",
        expectedImpact: "Reducir riesgo y mejorar visibilidad tributaria.",
        sourceType: "TaxRiskScore",
        sourceId: risk.id,
        steps: [
          { order: 1, type: "REQUEST_REVIEW", title: "Revisar señales de riesgo", description: "Revisar las causas principales del riesgo actual." },
          { order: 2, type: "CREATE_TASK", title: "Crear tarea de regularización", description: "Crear una tarea interna para resolver los puntos pendientes." },
          { order: 3, type: "RECALCULATE_RISK", title: "Recalcular riesgo", description: "Actualizar el riesgo después de ejecutar las acciones." },
        ],
        metadata: { riskLevel: risk.level, riskScore: risk.score },
      }));
    }

    if (rejectedDocuments > 0) {
      plans.push(await createAgentPlan({
        userId,
        title: "Plan para revisar documentos rechazados",
        description: "LEDGERA propone revisar documentos rechazados y crear seguimiento interno.",
        priority: "CRITICAL",
        expectedImpact: "Disminuir errores documentales y mejorar cumplimiento.",
        sourceType: "TaxDocument",
        sourceId: "rejected",
        steps: [
          { order: 1, type: "REQUEST_REVIEW", title: "Identificar documentos rechazados", description: "Revisar documentos rechazados pendientes." },
          { order: 2, type: "CREATE_TASK", title: "Crear tarea crítica", description: "Crear una tarea para corregir documentos rechazados." },
          { order: 3, type: "GENERATE_MEMORY", title: "Actualizar memoria", description: "Registrar el patrón en memoria tributaria." },
        ],
        metadata: { rejectedDocuments },
      }));
    }

    if (pendingTasks >= 10) {
      plans.push(await createAgentPlan({
        userId,
        title: "Plan para ordenar tareas pendientes",
        description: "LEDGERA propone un plan para priorizar y reducir la acumulación de tareas.",
        priority: "HIGH",
        expectedImpact: "Reducir atrasos y mejorar seguimiento operativo.",
        sourceType: "Task",
        sourceId: "pending-tasks",
        steps: [
          { order: 1, type: "REQUEST_REVIEW", title: "Ordenar tareas", description: "Revisar tareas pendientes por criticidad." },
          { order: 2, type: "CREATE_RECOMMENDATION", title: "Generar recomendación", description: "Generar recomendación de priorización." },
          { order: 3, type: "RECALCULATE_SCORE", title: "Recalcular score", description: "Actualizar score cuando se avance." },
        ],
        metadata: { pendingTasks },
      }));
    }

    for (const plan of plans) {
      await recordAuditEvent({
        userId,
        actorId: userId,
        category: "AI",
        severity: plan.priority === "CRITICAL" ? "CRITICAL" : plan.priority === "HIGH" ? "ERROR" : "INFO",
        event: "agent_plan_created",
        description: plan.title,
        result: "SUCCESS",
        entityType: "AgentPlan",
        entityId: plan.id,
        metadata: { priority: plan.priority, sourceType: plan.sourceType, sourceId: plan.sourceId },
      });
    }

    return { ok: true, created: plans.length, plans };
  } catch (error) {
    console.error("[agent/buildAgentPlans]", error);
    return { ok: false, message: "No se pudieron crear planes supervisados." };
  }
}
