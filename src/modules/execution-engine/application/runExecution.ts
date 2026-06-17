import { createTask } from "@/modules/tasks/application/createTask";
import { recordAuditEvent } from "@/modules/audit/application/recordAuditEvent";
import { getExecutionRequestById, updateExecutionStatus } from "@/modules/execution-engine/infrastructure/executionRepository";

export async function runExecution(executionId: string, actorId: string) {
  const execution = await getExecutionRequestById(executionId);
  if (!execution || execution.userId !== actorId) {
    return { ok: false as const, message: "Ejecución no encontrada." };
  }

  if (execution.status !== "PENDING") {
    return { ok: false as const, message: "La ejecución ya fue procesada." };
  }

  try {
    await updateExecutionStatus(execution.id, "RUNNING");

    let result: Record<string, unknown> = { type: execution.type };

    if (execution.type === "CREATE_TASK") {
      const task = await createTask({
        userId: execution.userId,
        title: execution.title,
        description: execution.description,
        category: "COMPLIANCE",
        priority: "MEDIUM",
        source: "MANUAL",
        sourceId: execution.id,
        metadata: { executionId: execution.id, payload: execution.payload },
      });
      result = { type: execution.type, taskId: task.id };
    }

    if (["CREATE_ALERT", "CREATE_REMINDER", "CREATE_AUTOMATION", "UPDATE_PROFILE", "OPEN_CASE"].includes(execution.type)) {
      result = {
        type: execution.type,
        supervised: true,
        note: "Ejecución registrada. Esta acción queda preparada para implementación específica posterior.",
      };
    }

    const completed = await updateExecutionStatus(execution.id, "COMPLETED", result);

    await recordAuditEvent({
      userId: execution.userId,
      actorId,
      category: "AI",
      severity: "INFO",
      event: "execution_completed",
      description: execution.title,
      result: "SUCCESS",
      entityType: "ExecutionRequest",
      entityId: execution.id,
      metadata: result,
    });

    return { ok: true as const, execution: completed };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido.";
    await updateExecutionStatus(execution.id, "FAILED", null, message).catch(() => null);
    await recordAuditEvent({
      userId: execution.userId,
      actorId,
      category: "AI",
      severity: "ERROR",
      event: "execution_failed",
      description: execution.title,
      result: "FAILURE",
      entityType: "ExecutionRequest",
      entityId: execution.id,
      metadata: { error: message },
    }).catch(() => null);
    return { ok: false as const, message: "No se pudo ejecutar la solicitud." };
  }
}
