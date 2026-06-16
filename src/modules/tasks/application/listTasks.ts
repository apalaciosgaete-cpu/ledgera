import { listTasks as persistList } from "@/modules/tasks/infrastructure/taskRepository";
import type {
  Task,
  TaskCategory,
  TaskPriority,
  TaskSource,
  TaskStatus,
} from "@/modules/tasks/domain/task";

export type ListTasksResult =
  | { ok: true; tasks: Task[] }
  | { ok: false; message: string };

export async function listTasks(
  filters?: {
    status?: TaskStatus;
    category?: TaskCategory;
    priority?: TaskPriority;
    source?: TaskSource;
    userId?: string;
    limit?: number;
  },
): Promise<ListTasksResult> {
  try {
    const tasks = await persistList(filters);
    return { ok: true, tasks };
  } catch (error) {
    console.error("[tasks/listTasks]", error);
    return { ok: false, message: "Error al listar tareas." };
  }
}
