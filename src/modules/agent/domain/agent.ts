export type AgentPlanStatus = "PROPOSED" | "APPROVED" | "REJECTED" | "EXECUTING" | "COMPLETED" | "FAILED";

export type AgentPlanPriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type AgentStepType =
  | "CREATE_TASK"
  | "CREATE_RECOMMENDATION"
  | "REQUEST_REVIEW"
  | "RECALCULATE_RISK"
  | "RECALCULATE_SCORE"
  | "GENERATE_MEMORY";

export interface AgentStep {
  id: string;
  order: number;
  type: AgentStepType;
  title: string;
  description: string;
  status: "PENDING" | "DONE" | "FAILED";
}

export interface AgentPlan {
  id: string;
  userId: string;
  title: string;
  description: string;
  priority: AgentPlanPriority;
  status: AgentPlanStatus;
  expectedImpact: string;
  sourceType: string | null;
  sourceId: string | null;
  steps: AgentStep[];
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  approvedAt: Date | null;
  executedAt: Date | null;
  completedAt: Date | null;
}

export interface CreateAgentPlanInput {
  userId: string;
  title: string;
  description: string;
  priority: AgentPlanPriority;
  expectedImpact: string;
  sourceType?: string | null;
  sourceId?: string | null;
  steps: Omit<AgentStep, "id" | "status">[];
  metadata?: Record<string, unknown> | null;
}

export function isValidAgentPlanStatus(value: string): value is AgentPlanStatus {
  return ["PROPOSED", "APPROVED", "REJECTED", "EXECUTING", "COMPLETED", "FAILED"].includes(value);
}
