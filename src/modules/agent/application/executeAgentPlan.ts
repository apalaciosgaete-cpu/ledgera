import { createTask } from "@/modules/tasks/application/createTask";
import { generateTaxMemory } from "@/modules/tax-memory/application/generateTaxMemory";
import { calculateTaxRiskScore } from "@/modules/risk/application/calculateTaxRiskScore";
import { recordAuditEvent } from "@/modules/audit/application/recordAuditEvent";
import { completeAgentPlanSteps, getAgentPlanById, updateAgentPlanStatus } from "@/modules/agent/infrastructure/agentRepository";
import type { AgentStep } from "@/modules/agent/domain/agent";

export async function executeAgentPlan(planId: string, actorId: string) {
  try {
    const plan = await getAgentPlanById(planId);
    if (!plan || plan.userId !== actorId) return { ok: false as const, message: "Plan no encontrado." };
    if (plan.status !== "APPROVED") return { ok: false as const, message: "El plan debe estar aprobado." };

    await updateAgentPlanStatus(plan.id, "EXECUTING");
    const executedSteps: AgentStep[] = [];

    for (const step of plan.steps) {
      try {
        if (step.type === "CREATE_TASK") {
          await createTask({
            userId: plan.userId,
            title: step.title,
            description: step.description,
            category: "COMPLIANCE",
            priority: plan.priority,
            source: "MANUAL",
            sourceId: plan.id,
            metadata: { agentPlanId: plan.id, stepId: step.id },
          });
        }

        if (step.type === "RECALCULATE_RISK") {
          await calculateTaxRiskScore(plan.userId);
        }

        if (step.type === "GENERATE_MEMORY") {
          await generateTaxMemory(plan.userId);
        }

        executedSteps.push({ ...step, status: "DONE" });
      } catch {
        executedSteps.push({ ...step, status: "FAILED" });
      }
    }

    const completed = await completeAgentPlanSteps(plan.id, executedSteps);
    if (!completed) return { ok: false as const, message: "No se pudo completar el plan." };

    await recordAuditEvent({
      userId: plan.userId,
      actorId,
      category: "AI",
      severity: completed.priority === "CRITICAL" ? "CRITICAL" : completed.priority === "HIGH" ? "ERROR" : "INFO",
      event: "agent_execution_completed",
      description: completed.title,
      result: "SUCCESS",
      entityType: "AgentPlan",
      entityId: completed.id,
      metadata: { steps: executedSteps.map((step) => ({ id: step.id, status: step.status, type: step.type })) },
    });

    return { ok: true as const, plan: completed };
  } catch (error) {
    console.error("[agent/executeAgentPlan]", error);
    await updateAgentPlanStatus(planId, "FAILED").catch(() => null);
    return { ok: false as const, message: "Error al ejecutar el plan." };
  }
}
