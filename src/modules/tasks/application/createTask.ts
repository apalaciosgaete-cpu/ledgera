import { createTask as persistTask } from "@/modules/tasks/infrastructure/taskRepository";
import {
  isValidTaskCategory,
  isValidTaskPriority,
  isValidTaskSource,
  type CreateTaskInput,
  type Task,
} from "@/modules/tasks/domain/task";
import { recordAuditEvent } from "@/modules/audit/application/recordAuditEvent";
import { recordTimelineEvent } from "@/modules/timeline/application/recordTimelineEvent";

export type CreateTaskResult =
  | { ok: true; task: Task }
  | { ok: false; message: string };

export async function createTask(input: CreateTaskInput): Promise<CreateTaskResult> {
  if (!input.userId) {
    return { ok: false, message: "Usuario requerido." };
  }

  if (!input.title || !input.description) {
    return { ok: false, message: "Título y descripción requeridos." };
  }

  if (!isValidTaskPriority(input.priority)) {
    return { ok: false, message: "Prioridad inválida." };
  }

  if (!isValidTaskCategory(input.category)) {
    return { ok: false, message: "Categoría inválida." };
  }

  if (!isValidTaskSource(input.source)) {
    return { ok: false, message: "Origen inválido." };
  }

  try {
    const task = await persistTask({
      ...input,
      status: "PENDING",
    });

    await recordAuditEvent({
      userId: input.userId,
      actorId: input.assignedTo ?? input.userId,
      category: "COMPLIANCE",
      severity: mapPriorityToSeverity(input.priority),
      event: "task_created",
      description: `Tarea creada: ${task.title}`,
      result: "SUCCESS",
      entityType: "Task",
      entityId: task.id,
      metadata: {
        category: task.category,
        priority: task.priority,
        source: task.source,
        sourceId: task.sourceId,
      },
    });

    await recordTimelineEvent({
      userId: input.userId,
      category: "TASK",
      severity: mapPriorityToTimelineSeverity(input.priority),
      title: "Tarea creada",
      description: task.title,
      entityType: "Task",
      entityId: task.id,
      metadata: {
        category: task.category,
        priority: task.priority,
        source: task.source,
        sourceId: task.sourceId,
      },
    });

    return { ok: true, task };
  } catch (error) {
    console.error("[tasks/createTask]", error);
    return { ok: false, message: "Error al crear la tarea." };
  }
}

function mapPriorityToSeverity(
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
): "INFO" | "WARNING" | "ERROR" | "CRITICAL" {
  switch (priority) {
    case "CRITICAL":
      return "CRITICAL";
    case "HIGH":
      return "ERROR";
    case "MEDIUM":
      return "WARNING";
    case "LOW":
    default:
      return "INFO";
  }
}

function mapPriorityToTimelineSeverity(
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
): "INFO" | "WARNING" | "ERROR" | "CRITICAL" {
  switch (priority) {
    case "CRITICAL":
      return "CRITICAL";
    case "HIGH":
      return "WARNING";
    case "MEDIUM":
      return "INFO";
    case "LOW":
    default:
      return "INFO";
  }
}
