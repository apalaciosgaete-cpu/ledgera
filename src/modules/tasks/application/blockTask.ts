import {
  getTaskById,
  updateTaskStatus,
} from "@/modules/tasks/infrastructure/taskRepository";
import { canBlockTask } from "@/modules/tasks/domain/task";
import { recordAuditEvent } from "@/modules/audit/application/recordAuditEvent";

export type BlockTaskResult =
  | { ok: true }
  | { ok: false; message: string };

export async function blockTask(
  id: string,
  userId: string,
  reason?: string,
): Promise<BlockTaskResult> {
  try {
    const task = await getTaskById(id);

    if (!task) {
      return { ok: false, message: "Tarea no encontrada." };
    }

    if (task.userId !== userId) {
      return { ok: false, message: "No autorizado." };
    }

    if (!canBlockTask(task.status)) {
      return { ok: false, message: "La tarea no puede bloquearse." };
    }

    const updated = await updateTaskStatus(id, "BLOCKED");

    if (!updated) {
      return { ok: false, message: "Error al bloquear la tarea." };
    }

    await recordAuditEvent({
      userId,
      actorId: userId,
      category: "COMPLIANCE",
      severity: "WARNING",
      event: "task_blocked",
      description: `Tarea bloqueada: ${task.title}${reason ? ` - ${reason}` : ""}`,
      result: "SUCCESS",
      entityType: "Task",
      entityId: id,
      metadata: {
        category: task.category,
        priority: task.priority,
        reason: reason ?? null,
      },
    });

    return { ok: true };
  } catch (error) {
    console.error("[tasks/blockTask]", error);
    return { ok: false, message: "Error al bloquear la tarea." };
  }
}
