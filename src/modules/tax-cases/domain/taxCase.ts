export type TaxCaseStatus =
  | "OPEN"
  | "INVESTIGATING"
  | "ACTION_REQUIRED"
  | "WAITING_USER"
  | "WAITING_SII"
  | "RESOLVED"
  | "CLOSED";

export type TaxCasePriority =
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "CRITICAL";

export interface TaxCase {
  id: string;
  userId: string;

  title: string;
  description: string;

  status: TaxCaseStatus;
  priority: TaxCasePriority;

  sourceType: string;
  sourceId: string | null;

  aiSummary: string;
  aiRecommendation: string;

  createdAt: Date;
  updatedAt: Date;
}

export interface TaxCaseSummary {
  openCount: number;
  criticalCount: number;
  investigatingCount: number;
  resolvedCount: number;
  totalCount: number;
  items: TaxCase[];
}

export const TAX_CASE_STATUSES: TaxCaseStatus[] = [
  "OPEN",
  "INVESTIGATING",
  "ACTION_REQUIRED",
  "WAITING_USER",
  "WAITING_SII",
  "RESOLVED",
  "CLOSED",
];

export const TAX_CASE_PRIORITIES: TaxCasePriority[] = [
  "LOW",
  "MEDIUM",
  "HIGH",
  "CRITICAL",
];

export const STATUS_LABELS: Record<TaxCaseStatus, string> = {
  OPEN: "Abierto",
  INVESTIGATING: "En investigación",
  ACTION_REQUIRED: "Requiere acción",
  WAITING_USER: "Esperando usuario",
  WAITING_SII: "Esperando SII",
  RESOLVED: "Resuelto",
  CLOSED: "Cerrado",
};

export const PRIORITY_LABELS: Record<TaxCasePriority, string> = {
  LOW: "Baja",
  MEDIUM: "Media",
  HIGH: "Alta",
  CRITICAL: "Crítica",
};

export const PRIORITY_ORDER: Record<TaxCasePriority, number> = {
  CRITICAL: 4,
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1,
};

export function comparePriority(a: TaxCasePriority, b: TaxCasePriority): number {
  return PRIORITY_ORDER[b] - PRIORITY_ORDER[a];
}

export function statusColor(status: TaxCaseStatus): string {
  switch (status) {
    case "OPEN": return "#2563EB";
    case "INVESTIGATING": return "#B45309";
    case "ACTION_REQUIRED": return "#B91C1C";
    case "WAITING_USER": return "#6D28D9";
    case "WAITING_SII": return "#0369A1";
    case "RESOLVED": return "#047857";
    case "CLOSED": return "#64748B";
  }
}

export function priorityColor(priority: TaxCasePriority): string {
  switch (priority) {
    case "CRITICAL": return "#B91C1C";
    case "HIGH": return "#B45309";
    case "MEDIUM": return "#0F766E";
    case "LOW": return "#64748B";
  }
}
