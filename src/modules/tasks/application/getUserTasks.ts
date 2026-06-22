import { listUserTasks } from "@/modules/tasks/infrastructure/taskRepository";
import type {
  Task,
  TaskCategory,
  TaskPriority,
  TaskSource,
  TaskStatus,
} from "@/modules/tasks/domain/task";

export type GetUserTasksResult =
  | { ok: true; tasks: Task[] }
  | { ok: false; message: string };

export async function getUserTasks(
  userId: string,
  filters?: {
    status?: TaskStatus;
    category?: TaskCategory;
    priority?: TaskPriority;
    source?: TaskSource;
  },
): Promise<GetUserTasksResult> {
  try {
    const tasks = await listUserTasks(userId, filters);
    return { ok: true, tasks };
  } catch (error) {
    console.error("[tasks/getUserTasks]", error);
    return { ok: false, message: "Error al obtener tareas." };
  }
}
