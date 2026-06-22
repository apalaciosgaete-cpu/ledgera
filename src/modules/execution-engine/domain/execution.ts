export type ExecutionType =
  | "CREATE_TASK"
  | "CREATE_ALERT"
  | "CREATE_REMINDER"
  | "CREATE_AUTOMATION"
  | "UPDATE_PROFILE"
  | "OPEN_CASE";

export type ExecutionStatus = "PENDING" | "RUNNING" | "COMPLETED" | "FAILED" | "REJECTED";

export interface ExecutionRequest {
  id: string;
  userId: string;
  type: ExecutionType;
  title: string;
  description: string;
  status: ExecutionStatus;
  sourceType: string | null;
  sourceId: string | null;
  payload: Record<string, unknown> | null;
  result: Record<string, unknown> | null;
  error: string | null;
  createdAt: Date;
  startedAt: Date | null;
  completedAt: Date | null;
}

export interface CreateExecutionRequestInput {
  userId: string;
  type: ExecutionType;
  title: string;
  description: string;
  sourceType?: string | null;
  sourceId?: string | null;
  payload?: Record<string, unknown> | null;
}

export function isValidExecutionType(value: string): value is ExecutionType {
  return ["CREATE_TASK", "CREATE_ALERT", "CREATE_REMINDER", "CREATE_AUTOMATION", "UPDATE_PROFILE", "OPEN_CASE"].includes(value);
}
