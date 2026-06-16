import {
  getTaskById,
  updateTaskStatus,
} from "@/modules/tasks/infrastructure/taskRepository";
import { canCompleteTask } from "@/modules/tasks/domain/task";
import { recordAuditEvent } from "@/modules/audit/application/recordAuditEvent";
import { recordTimelineEvent } from "@/modules/timeline/application/recordTimelineEvent";

export type CompleteTaskResult =
  | { ok: true }
  | { ok: false; message: string };

export async function completeTask(id: string, userId: string): Promise<CompleteTaskResult> {
  try {
    const task = await getTaskById(id);

    if (!task) {
      return { ok: false, message: "Tarea no encontrada." };
    }

    if (task.userId !== userId) {
      return { ok: false, message: "No autorizado." };
    }

    if (!canCompleteTask(task.status)) {
      return { ok: false, message: "La tarea no puede completarse." };
    }

    const updated = await updateTaskStatus(id, "COMPLETED", { completedAt: new Date() });

    if (!updated) {
      return { ok: false, message: "Error al completar la tarea." };
    }

    await recordAuditEvent({
      userId,
      actorId: userId,
      category: "COMPLIANCE",
      severity: "INFO",
      event: "task_completed",
      description: `Tarea completada: ${task.title}`,
      result: "SUCCESS",
      entityType: "Task",
      entityId: id,
      metadata: {
        category: task.category,
        priority: task.priority,
        source: task.source,
        sourceId: task.sourceId,
      },
    });

    await recordTimelineEvent({
      userId,
      category: "TASK",
      severity: "SUCCESS",
      title: "Tarea completada",
      description: `Completaste la tarea: ${task.title}`,
      entityType: "Task",
      entityId: id,
      metadata: {
        category: task.category,
        priority: task.priority,
        source: task.source,
        sourceId: task.sourceId,
      },
    });

    return { ok: true };
  } catch (error) {
    console.error("[tasks/completeTask]", error);
    return { ok: false, message: "Error al completar la tarea." };
  }
}
