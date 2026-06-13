export type AlertCategory =
  | "TRIBUTARY"
  | "OPERATIONAL"
  | "COMMERCIAL"
  | "SECURITY"
  | "COMPLIANCE";

export type AlertSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type AlertStatus = "OPEN" | "ACKNOWLEDGED" | "RESOLVED";

export interface Alert {
  id: string;
  userId: string;
  category: AlertCategory;
  severity: AlertSeverity;
  title: string;
  message: string;
  status: AlertStatus;
  metadata: Record<string, unknown> | null;
  source: string | null;
  acknowledgedAt: Date | null;
  resolvedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateAlertInput {
  userId: string;
  category: AlertCategory;
  severity: AlertSeverity;
  title: string;
  message: string;
  metadata?: Record<string, unknown> | null;
  source?: string | null;
}

export const ALERT_CATEGORIES: AlertCategory[] = [
  "TRIBUTARY",
  "OPERATIONAL",
  "COMMERCIAL",
  "SECURITY",
  "COMPLIANCE",
];

export const ALERT_SEVERITIES: AlertSeverity[] = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

export const ALERT_STATUSES: AlertStatus[] = ["OPEN", "ACKNOWLEDGED", "RESOLVED"];

export function isValidAlertCategory(value: string): value is AlertCategory {
  return ALERT_CATEGORIES.includes(value as AlertCategory);
}

export function isValidAlertSeverity(value: string): value is AlertSeverity {
  return ALERT_SEVERITIES.includes(value as AlertSeverity);
}

export function isValidAlertStatus(value: string): value is AlertStatus {
  return ALERT_STATUSES.includes(value as AlertStatus);
}
