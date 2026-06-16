export type LearningEventType =
  | "RECOMMENDATION_CREATED"
  | "RECOMMENDATION_COMPLETED"
  | "RECOMMENDATION_DISMISSED"
  | "AUTOMATION_APPROVED"
  | "AUTOMATION_REJECTED"
  | "AUTOMATION_EXECUTED"
  | "COPILOT_MESSAGE_SENT"
  | "TASK_CREATED"
  | "TASK_COMPLETED"
  | "TASK_OVERDUE";

export type LearningOutcome = "POSITIVE" | "NEUTRAL" | "NEGATIVE";

export type LearningTrend = "UP" | "STABLE" | "DOWN";

export interface LearningEvent {
  id: string;
  userId: string;
  eventType: LearningEventType;
  sourceModule: string;
  outcome: LearningOutcome;
  scoreImpact: number | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
}

export interface LearningProfile {
  userId: string;
  recommendationAcceptanceRate: number;
  automationAcceptanceRate: number;
  taskCompletionRate: number;
  scoreTrend: LearningTrend;
  riskTrend: LearningTrend;
  totalEvents: number;
  generatedAt: Date;
}

export interface CreateLearningEventInput {
  userId: string;
  eventType: LearningEventType;
  sourceModule: string;
  outcome: LearningOutcome;
  scoreImpact?: number | null;
  metadata?: Record<string, unknown> | null;
}

export function percentage(part: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((part / total) * 100);
}

export function resolveTrend(delta: number): LearningTrend {
  if (delta > 3) return "UP";
  if (delta < -3) return "DOWN";
  return "STABLE";
}
