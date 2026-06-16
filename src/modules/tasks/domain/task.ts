export type TaskStatus =
  | "PENDING"
  | "IN_PROGRESS"
  | "BLOCKED"
  | "COMPLETED"
  | "CANCELLED";

export type TaskPriority =
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "CRITICAL";

export type TaskSource =
  | "ALERT"
  | "RECOMMENDATION"
  | "RISK"
  | "DTE"
  | "SII"
  | "BILLING"
  | "MANUAL";

export type TaskCategory =
  | "TRIBUTARY"
  | "COMPLIANCE"
  | "OPERATIONS"
  | "CONNECTIONS"
  | "BILLING"
  | "SECURITY";

export interface Task {
  id: string;
  userId: string;
  title: string;
  description: string;
  category: TaskCategory;
  priority: TaskPriority;
  status: TaskStatus;
  source: TaskSource;
  sourceId: string | null;
  assignedTo: string | null;
  dueDate: Date | null;
  startedAt: Date | null;
  completedAt: Date | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTaskInput {
  userId: string;
  title: string;
  description: string;
  category: TaskCategory;
  priority: TaskPriority;
  status?: TaskStatus;
  source: TaskSource;
  sourceId?: string | null;
  assignedTo?: string | null;
  dueDate?: Date | null;
  metadata?: Record<string, unknown> | null;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  category?: TaskCategory;
  priority?: TaskPriority;
  assignedTo?: string | null;
  dueDate?: Date | null;
  metadata?: Record<string, unknown> | null;
}

export const TASK_STATUSES: TaskStatus[] = [
  "PENDING",
  "IN_PROGRESS",
  "BLOCKED",
  "COMPLETED",
  "CANCELLED",
];

export const TASK_PRIORITIES: TaskPriority[] = [
  "LOW",
  "MEDIUM",
  "HIGH",
  "CRITICAL",
];

export const TASK_SOURCES: TaskSource[] = [
  "ALERT",
  "RECOMMENDATION",
  "RISK",
  "DTE",
  "SII",
  "BILLING",
  "MANUAL",
];

export const TASK_CATEGORIES: TaskCategory[] = [
  "TRIBUTARY",
  "COMPLIANCE",
  "OPERATIONS",
  "CONNECTIONS",
  "BILLING",
  "SECURITY",
];

export function isValidTaskStatus(value: string): value is TaskStatus {
  return TASK_STATUSES.includes(value as TaskStatus);
}

export function isValidTaskPriority(value: string): value is TaskPriority {
  return TASK_PRIORITIES.includes(value as TaskPriority);
}

export function isValidTaskSource(value: string): value is TaskSource {
  return TASK_SOURCES.includes(value as TaskSource);
}

export function isValidTaskCategory(value: string): value is TaskCategory {
  return TASK_CATEGORIES.includes(value as TaskCategory);
}

export function canStartTask(status: TaskStatus): boolean {
  return status === "PENDING";
}

export function canBlockTask(status: TaskStatus): boolean {
  return status === "IN_PROGRESS";
}

export function canCompleteTask(status: TaskStatus): boolean {
  return status === "PENDING" || status === "IN_PROGRESS" || status === "BLOCKED";
}

export function canCancelTask(status: TaskStatus): boolean {
  return status === "PENDING" || status === "IN_PROGRESS";
}

export function taskKey(input: {
  userId: string;
  source: TaskSource;
  sourceId?: string | null;
}): string {
  const suffix = input.sourceId ? `:${input.sourceId}` : "";
  return `${input.userId}:${input.source}${suffix}`;
}
