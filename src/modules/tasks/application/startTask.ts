import {
  getTaskById,
  updateTaskStatus,
} from "@/modules/tasks/infrastructure/taskRepository";
import { canStartTask } from "@/modules/tasks/domain/task";
import { recordAuditEvent } from "@/modules/audit/application/recordAuditEvent";
import { recordTimelineEvent } from "@/modules/timeline/application/recordTimelineEvent";

export type StartTaskResult =
  | { ok: true }
  | { ok: false; message: string };

export async function startTask(id: string, userId: string): Promise<StartTaskResult> {
  try {
    const task = await getTaskById(id);

    if (!task) {
      return { ok: false, message: "Tarea no encontrada." };
    }

    if (task.userId !== userId) {
      return { ok: false, message: "No autorizado." };
    }

    if (!canStartTask(task.status)) {
      return { ok: false, message: "La tarea no puede iniciarse." };
    }

    const updated = await updateTaskStatus(id, "IN_PROGRESS", { startedAt: new Date() });

    if (!updated) {
      return { ok: false, message: "Error al iniciar la tarea." };
    }

    await recordAuditEvent({
      userId,
      actorId: userId,
      category: "COMPLIANCE",
      severity: "INFO",
      event: "task_started",
      description: `Tarea iniciada: ${task.title}`,
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
      severity: "INFO",
      title: "Tarea iniciada",
      description: `Iniciaste la tarea: ${task.title}`,
      entityType: "Task",
      entityId: id,
      metadata: {
        category: task.category,
        priority: task.priority,
      },
    });

    return { ok: true };
  } catch (error) {
    console.error("[tasks/startTask]", error);
    return { ok: false, message: "Error al iniciar la tarea." };
  }
}
