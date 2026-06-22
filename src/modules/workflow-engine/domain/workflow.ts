export type WorkflowStatus =
  | "PENDING"
  | "RUNNING"
  | "WAITING_USER"
  | "COMPLETED"
  | "FAILED";

export type WorkflowStepStatus =
  | "PENDING"
  | "RUNNING"
  | "SUCCESS"
  | "FAILED"
  | "SKIPPED";

export type WorkflowActionType =
  | "CREATE_TASK"
  | "CREATE_ALERT"
  | "CREATE_REMINDER"
  | "CREATE_AUTOMATION"
  | "UPDATE_PROFILE"
  | "OPEN_CASE"
  | "REQUEST_DOCUMENT"
  | "NOTIFY_USER";

export interface Workflow {
  id: string;
  userId: string;
  caseId: string | null;
  title: string;
  description: string;
  status: WorkflowStatus;
  sourceType: string;
  createdAt: Date;
  updatedAt: Date;
  steps: WorkflowStep[];
}

export interface WorkflowStep {
  id: string;
  workflowId: string;
  stepOrder: number;
  actionType: WorkflowActionType;
  status: WorkflowStepStatus;
  title: string;
  description: string | null;
  metadata: Record<string, unknown> | null;
  result: string | null;
  executedAt: Date | null;
  createdAt: Date;
}

export interface WorkflowSummary {
  total: number;
  pendingCount: number;
  runningCount: number;
  waitingCount: number;
  completedCount: number;
  failedCount: number;
  items: Workflow[];
}

const SENSITIVE_ACTIONS: WorkflowActionType[] = [
  "UPDATE_PROFILE",
  "OPEN_CASE",
  "CREATE_AUTOMATION",
];

export function isSensitiveAction(action: WorkflowActionType): boolean {
  return SENSITIVE_ACTIONS.includes(action);
}

export const WORKFLOW_STATUSES: WorkflowStatus[] = [
  "PENDING",
  "RUNNING",
  "WAITING_USER",
  "COMPLETED",
  "FAILED",
];

export const WORKFLOW_ACTION_TYPES: WorkflowActionType[] = [
  "CREATE_TASK",
  "CREATE_ALERT",
  "CREATE_REMINDER",
  "CREATE_AUTOMATION",
  "UPDATE_PROFILE",
  "OPEN_CASE",
  "REQUEST_DOCUMENT",
  "NOTIFY_USER",
];

export const STATUS_LABELS: Record<WorkflowStatus, string> = {
  PENDING: "Pendiente",
  RUNNING: "En ejecución",
  WAITING_USER: "Esperando usuario",
  COMPLETED: "Completado",
  FAILED: "Fallido",
};

export const STEP_STATUS_LABELS: Record<WorkflowStepStatus, string> = {
  PENDING: "Pendiente",
  RUNNING: "Ejecutando",
  SUCCESS: "Exitoso",
  FAILED: "Fallido",
  SKIPPED: "Saltado",
};

export const ACTION_TYPE_LABELS: Record<WorkflowActionType, string> = {
  CREATE_TASK: "Crear tarea",
  CREATE_ALERT: "Crear alerta",
  CREATE_REMINDER: "Crear recordatorio",
  CREATE_AUTOMATION: "Crear automatización",
  UPDATE_PROFILE: "Actualizar perfil",
  OPEN_CASE: "Abrir expediente",
  REQUEST_DOCUMENT: "Solicitar documento",
  NOTIFY_USER: "Notificar usuario",
};

export function statusColor(status: WorkflowStatus): string {
  switch (status) {
    case "PENDING": return "#64748B";
    case "RUNNING": return "#2563EB";
    case "WAITING_USER": return "#B45309";
    case "COMPLETED": return "#047857";
    case "FAILED": return "#B91C1C";
  }
}

export function stepStatusColor(status: WorkflowStepStatus): string {
  switch (status) {
    case "PENDING": return "#64748B";
    case "RUNNING": return "#2563EB";
    case "SUCCESS": return "#047857";
    case "FAILED": return "#B91C1C";
    case "SKIPPED": return "#94A3B8";
  }
}
