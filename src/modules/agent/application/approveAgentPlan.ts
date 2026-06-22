import { recordAuditEvent } from "@/modules/audit/application/recordAuditEvent";
import { getAgentPlanById, updateAgentPlanStatus } from "@/modules/agent/infrastructure/agentRepository";

export async function approveAgentPlan(planId: string, actorId: string) {
  try {
    const plan = await getAgentPlanById(planId);
    if (!plan || plan.userId !== actorId) {
      return { ok: false as const, message: "Plan no encontrado." };
    }
    if (plan.status !== "PROPOSED") {
      return { ok: false as const, message: "El plan ya fue procesado." };
    }

    const approved = await updateAgentPlanStatus(planId, "APPROVED");
    if (!approved) return { ok: false as const, message: "No se pudo aprobar el plan." };

    await recordAuditEvent({
      userId: approved.userId,
      actorId,
      category: "AI",
      severity: approved.priority === "CRITICAL" ? "CRITICAL" : approved.priority === "HIGH" ? "ERROR" : "INFO",
      event: "agent_plan_approved",
      description: approved.title,
      result: "SUCCESS",
      entityType: "AgentPlan",
      entityId: approved.id,
      metadata: { priority: approved.priority },
    });

    return { ok: true as const, plan: approved };
  } catch (error) {
    console.error("[agent/approveAgentPlan]", error);
    return { ok: false as const, message: "Error al aprobar el plan." };
  }
}
