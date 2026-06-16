export type AuditCategory =
  | "AUTH"
  | "USER"
  | "TAX"
  | "DTE"
  | "SII"
  | "BILLING"
  | "ALERT"
  | "RISK"
  | "CONNECTION"
  | "OPERATION"
  | "SECURITY"
  | "COMPLIANCE"
  | "DOCUMENT"
  | "ADMIN"
  | "AUDIT"
  | "AI";

export type AuditSeverity = "INFO" | "WARNING" | "ERROR" | "CRITICAL";

export type AuditResult = "SUCCESS" | "FAILED" | "PARTIAL";

export interface AuditEvent {
  id: string;
  userId: string | null;
  actorId: string | null;
  category: AuditCategory;
  severity: AuditSeverity;
  event: string;
  description: string;
  result: AuditResult;
  entityType: string | null;
  entityId: string | null;
  metadata: Record<string, unknown> | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
}

export interface CreateAuditEventInput {
  userId?: string | null;
  actorId?: string | null;
  category: AuditCategory;
  severity: AuditSeverity;
  event: string;
  description: string;
  result?: AuditResult;
  entityType?: string | null;
  entityId?: string | null;
  metadata?: Record<string, unknown> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export const AUDIT_CATEGORIES: AuditCategory[] = [
  "AUTH",
  "USER",
  "TAX",
  "DTE",
  "SII",
  "BILLING",
  "ALERT",
  "RISK",
  "CONNECTION",
  "OPERATION",
  "SECURITY",
  "COMPLIANCE",
  "DOCUMENT",
  "ADMIN",
  "AUDIT",
  "AI",
];

export const AUDIT_SEVERITIES: AuditSeverity[] = ["INFO", "WARNING", "ERROR", "CRITICAL"];

export const AUDIT_RESULTS: AuditResult[] = ["SUCCESS", "FAILED", "PARTIAL"];

export function isValidAuditCategory(value: string): value is AuditCategory {
  return AUDIT_CATEGORIES.includes(value as AuditCategory);
}

export function isValidAuditSeverity(value: string): value is AuditSeverity {
  return AUDIT_SEVERITIES.includes(value as AuditSeverity);
}

export function isValidAuditResult(value: string): value is AuditResult {
  return AUDIT_RESULTS.includes(value as AuditResult);
}
