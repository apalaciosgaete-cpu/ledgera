export type TimelineCategory =
  | "PROFILE"
  | "RISK"
  | "SMART_SCORE"
  | "ALERT"
  | "RECOMMENDATION"
  | "TASK"
  | "DTE"
  | "SII"
  | "DOCUMENT"
  | "BILLING"
  | "CONNECTION"
  | "AUDIT"
  | "SECURITY";

export type TimelineSeverity =
  | "INFO"
  | "SUCCESS"
  | "WARNING"
  | "ERROR"
  | "CRITICAL";

export interface TimelineEvent {
  id: string;
  userId: string;
  category: TimelineCategory;
  severity: TimelineSeverity;
  title: string;
  description: string;
  entityType: string | null;
  entityId: string | null;
  metadata: Record<string, unknown> | null;
  occurredAt: Date;
  createdAt: Date;
}

export interface CreateTimelineEventInput {
  userId: string;
  category: TimelineCategory;
  severity: TimelineSeverity;
  title: string;
  description: string;
  entityType?: string | null;
  entityId?: string | null;
  metadata?: Record<string, unknown> | null;
  occurredAt?: Date;
}

export const DEFAULT_TIMELINE_PAGE_SIZE = 50;

export const TIMELINE_CATEGORIES: TimelineCategory[] = [
  "PROFILE",
  "RISK",
  "SMART_SCORE",
  "ALERT",
  "RECOMMENDATION",
  "TASK",
  "DTE",
  "SII",
  "DOCUMENT",
  "BILLING",
  "CONNECTION",
  "AUDIT",
  "SECURITY",
];

export const TIMELINE_SEVERITIES: TimelineSeverity[] = [
  "INFO",
  "SUCCESS",
  "WARNING",
  "ERROR",
  "CRITICAL",
];

export function isValidTimelineCategory(value: string): value is TimelineCategory {
  return TIMELINE_CATEGORIES.includes(value as TimelineCategory);
}

export function isValidTimelineSeverity(value: string): value is TimelineSeverity {
  return TIMELINE_SEVERITIES.includes(value as TimelineSeverity);
}
