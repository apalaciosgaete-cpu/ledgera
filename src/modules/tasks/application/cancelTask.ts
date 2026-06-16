import {
  getTaskById,
  updateTaskStatus,
} from "@/modules/tasks/infrastructure/taskRepository";
import { canCancelTask } from "@/modules/tasks/domain/task";
import { recordAuditEvent } from "@/modules/audit/application/recordAuditEvent";
import { recordTimelineEvent } from "@/modules/timeline/application/recordTimelineEvent";

export type CancelTaskResult =
  | { ok: true }
  | { ok: false; message: string };

export async function cancelTask(id: string, userId: string): Promise<CancelTaskResult> {
  try {
    const task = await getTaskById(id);

    if (!task) {
      return { ok: false, message: "Tarea no encontrada." };
    }

    if (task.userId !== userId) {
      return { ok: false, message: "No autorizado." };
    }

    if (!canCancelTask(task.status)) {
      return { ok: false, message: "La tarea no puede cancelarse." };
    }

    const updated = await updateTaskStatus(id, "CANCELLED");

    if (!updated) {
      return { ok: false, message: "Error al cancelar la tarea." };
    }

    await recordAuditEvent({
      userId,
      actorId: userId,
      category: "COMPLIANCE",
      severity: "INFO",
      event: "task_cancelled",
      description: `Tarea cancelada: ${task.title}`,
      result: "SUCCESS",
      entityType: "Task",
      entityId: id,
      metadata: {
        category: task.category,
        priority: task.priority,
      },
    });

    await recordTimelineEvent({
      userId,
      category: "TASK",
      severity: "WARNING",
      title: "Tarea cancelada",
      description: `Se canceló la tarea: ${task.title}`,
      entityType: "Task",
      entityId: id,
      metadata: {
        category: task.category,
        priority: task.priority,
      },
    });

    return { ok: true };
  } catch (error) {
    console.error("[tasks/cancelTask]", error);
    return { ok: false, message: "Error al cancelar la tarea." };
  }
}
