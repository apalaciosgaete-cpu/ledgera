import { prisma } from "@/lib/prisma";
import type {
  CreateTaskInput,
  Task,
  TaskCategory,
  TaskPriority,
  TaskSource,
  TaskStatus,
  UpdateTaskInput,
} from "@/modules/tasks/domain/task";

export async function createTask(input: CreateTaskInput): Promise<Task> {
  const row = await prisma.task.create({
    data: {
      userId: input.userId,
      title: input.title,
      description: input.description,
      category: input.category,
      priority: input.priority,
      status: input.status ?? "PENDING",
      source: input.source,
      sourceId: input.sourceId ?? null,
      assignedTo: input.assignedTo ?? null,
      dueDate: input.dueDate ?? null,
      metadata: (input.metadata ?? undefined) as unknown as undefined,
    },
  });

  return mapTask(row);
}

export async function getTaskById(id: string): Promise<Task | null> {
  const row = await prisma.task.findUnique({ where: { id } });
  return row ? mapTask(row) : null;
}

export async function updateTask(
  id: string,
  input: UpdateTaskInput,
): Promise<Task | null> {
  try {
    const row = await prisma.task.update({
      where: { id },
      data: {
        ...(input.title !== undefined ? { title: input.title } : {}),
        ...(input.description !== undefined ? { description: input.description } : {}),
        ...(input.category !== undefined ? { category: input.category } : {}),
        ...(input.priority !== undefined ? { priority: input.priority } : {}),
        ...(input.assignedTo !== undefined ? { assignedTo: input.assignedTo } : {}),
        ...(input.dueDate !== undefined ? { dueDate: input.dueDate } : {}),
        ...(input.metadata !== undefined
          ? { metadata: (input.metadata ?? undefined) as unknown as undefined }
          : {}),
      },
    });

    return mapTask(row);
  } catch {
    return null;
  }
}

export async function updateTaskStatus(
  id: string,
  status: TaskStatus,
  dates?: { startedAt?: Date | null; completedAt?: Date | null },
): Promise<Task | null> {
  try {
    const row = await prisma.task.update({
      where: { id },
      data: {
        status,
        ...(dates?.startedAt !== undefined ? { startedAt: dates.startedAt } : {}),
        ...(dates?.completedAt !== undefined ? { completedAt: dates.completedAt } : {}),
      },
    });

    return mapTask(row);
  } catch {
    return null;
  }
}

export async function listUserTasks(
  userId: string,
  filters?: {
    status?: TaskStatus;
    category?: TaskCategory;
    priority?: TaskPriority;
    source?: TaskSource;
  },
): Promise<Task[]> {
  const rows = await prisma.task.findMany({
    where: {
      userId,
      status: filters?.status,
      category: filters?.category,
      priority: filters?.priority,
      source: filters?.source,
    },
    orderBy: [
      { priority: "desc" },
      { dueDate: "asc" },
      { createdAt: "desc" },
    ],
  });

  return rows.map(mapTask);
}

export async function listTasks(filters?: {
  status?: TaskStatus;
  category?: TaskCategory;
  priority?: TaskPriority;
  source?: TaskSource;
  userId?: string;
  limit?: number;
}): Promise<Task[]> {
  const rows = await prisma.task.findMany({
    where: {
      status: filters?.status,
      category: filters?.category,
      priority: filters?.priority,
      source: filters?.source,
      userId: filters?.userId,
    },
    orderBy: [
      { priority: "desc" },
      { dueDate: "asc" },
      { createdAt: "desc" },
    ],
    take: filters?.limit,
  });

  return rows.map(mapTask);
}

export async function findActiveTaskBySource(
  userId: string,
  source: TaskSource,
  sourceId?: string | null,
): Promise<Task | null> {
  const row = await prisma.task.findFirst({
    where: {
      userId,
      source,
      sourceId: sourceId ?? null,
      status: { notIn: ["COMPLETED", "CANCELLED"] },
    },
  });

  return row ? mapTask(row) : null;
}

export async function deleteTask(id: string): Promise<boolean> {
  try {
    await prisma.task.delete({ where: { id } });
    return true;
  } catch {
    return false;
  }
}

export async function countOpenTasks(userId: string): Promise<number> {
  return prisma.task.count({
    where: { userId, status: { notIn: ["COMPLETED", "CANCELLED"] } },
  });
}

export async function countTasks(filters?: {
  status?: TaskStatus;
  userId?: string;
  priority?: TaskPriority;
  dueBefore?: Date;
  notIn?: TaskStatus[];
}): Promise<number> {
  return prisma.task.count({
    where: {
      status: filters?.status,
      userId: filters?.userId,
      priority: filters?.priority,
      dueDate: filters?.dueBefore ? { lt: filters.dueBefore } : undefined,
      ...(filters?.notIn ? { status: { notIn: filters.notIn } } : {}),
    },
  });
}

function mapTask(row: {
  id: string;
  userId: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  source: string;
  sourceId: string | null;
  assignedTo: string | null;
  dueDate: Date | null;
  startedAt: Date | null;
  completedAt: Date | null;
  metadata: unknown;
  createdAt: Date;
  updatedAt: Date;
}): Task {
  return {
    id: row.id,
    userId: row.userId,
    title: row.title,
    description: row.description,
    category: row.category as TaskCategory,
    priority: row.priority as TaskPriority,
    status: row.status as TaskStatus,
    source: row.source as TaskSource,
    sourceId: row.sourceId,
    assignedTo: row.assignedTo,
    dueDate: row.dueDate,
    startedAt: row.startedAt,
    completedAt: row.completedAt,
    metadata: (row.metadata as Record<string, unknown>) ?? null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}
