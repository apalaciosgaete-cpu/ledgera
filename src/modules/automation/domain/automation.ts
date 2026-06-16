export type AutomationStatus = "PROPOSED" | "APPROVED" | "REJECTED" | "EXECUTED" | "FAILED";

export type AutomationType = "CREATE_TASK" | "CREATE_RECOMMENDATION" | "CREATE_FOLLOW_UP" | "CREATE_REMINDER";

export type AutomationPriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface AutomationProposal {
  id: string;
  userId: string;
  type: AutomationType;
  priority: AutomationPriority;
  title: string;
  description: string;
  sourceEntity: string | null;
  sourceEntityId: string | null;
  status: AutomationStatus;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  approvedAt: Date | null;
  approvedBy: string | null;
  rejectedAt: Date | null;
  rejectedBy: string | null;
  executedAt: Date | null;
  failureReason: string | null;
}

export interface CreateAutomationProposalInput {
  userId: string;
  type: AutomationType;
  priority?: AutomationPriority;
  title: string;
  description: string;
  sourceEntity?: string | null;
  sourceEntityId?: string | null;
  metadata?: Record<string, unknown> | null;
}

export interface AutomationProposalFilters {
  userId?: string;
  status?: AutomationStatus;
  type?: AutomationType;
  priority?: AutomationPriority;
  limit?: number;
}

export function isValidAutomationStatus(value: string): value is AutomationStatus {
  return ["PROPOSED", "APPROVED", "REJECTED", "EXECUTED", "FAILED"].includes(value);
}

export function isValidAutomationType(value: string): value is AutomationType {
  return ["CREATE_TASK", "CREATE_RECOMMENDATION", "CREATE_FOLLOW_UP", "CREATE_REMINDER"].includes(value);
}

export function isValidAutomationPriority(value: string): value is AutomationPriority {
  return ["LOW", "MEDIUM", "HIGH", "CRITICAL"].includes(value);
}
