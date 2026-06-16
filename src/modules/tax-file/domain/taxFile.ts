export type TaxFileStatus =
  | "HEALTHY"
  | "ATTENTION_REQUIRED"
  | "HIGH_RISK"
  | "CRITICAL";

export interface TaxFileSummary {
  userId: string;
  userEmail: string;
  userName: string;
  status: TaxFileStatus;

  taxProfile: {
    exists: boolean;
    documentType: string | null;
    rut: string | null;
    legalName: string | null;
    isValidated: boolean;
  };

  risk: {
    score: number | null;
    level: string | null;
  };

  smartScore: {
    score: number | null;
    level: string | null;
  };

  alerts: {
    open: number;
    critical: number;
  };

  recommendations: {
    active: number;
    critical: number;
  };

  tasks: {
    pending: number;
    overdue: number;
    critical: number;
  };

  taxDocuments: {
    total: number;
    pending: number;
    rejected: number;
  };

  sii: {
    configured: boolean;
    status: string;
    activeCafs: number;
  };

  billing: {
    plan: string;
    subscriptionStatus: string | null;
  };

  connections: {
    total: number;
    degraded: number;
  };

  audit: {
    recentEvents: number;
    criticalEvents: number;
  };

  generatedAt: Date;
}

export interface TaxFileListItem {
  userId: string;
  userEmail: string;
  userName: string;
  status: TaxFileStatus;
  riskScore: number | null;
  riskLevel: string | null;
  smartScore: number | null;
  smartLevel: string | null;
  openAlerts: number;
  pendingTasks: number;
  plan: string;
  generatedAt: Date;
}

export const TAX_FILE_STATUSES: TaxFileStatus[] = [
  "HEALTHY",
  "ATTENTION_REQUIRED",
  "HIGH_RISK",
  "CRITICAL",
];

export function isValidTaxFileStatus(value: string): value is TaxFileStatus {
  return TAX_FILE_STATUSES.includes(value as TaxFileStatus);
}

export interface TaxFileStatusInput {
  riskLevel: string | null;
  criticalOverdueTasks: number;
  rejectedDocuments: number;
  openCriticalAlerts: number;
  smartScoreLevel: string | null;
  openAlerts: number;
  pendingTasks: number;
  profileValidated: boolean;
}

export function resolveTaxFileStatus(input: TaxFileStatusInput): TaxFileStatus {
  if (
    input.riskLevel === "CRITICAL" ||
    input.criticalOverdueTasks > 0 ||
    input.rejectedDocuments > 0
  ) {
    return "CRITICAL";
  }

  if (
    input.riskLevel === "HIGH" ||
    input.openCriticalAlerts > 0 ||
    input.smartScoreLevel === "DEFICIENT"
  ) {
    return "HIGH_RISK";
  }

  if (
    input.openAlerts > 0 ||
    input.pendingTasks > 0 ||
    !input.profileValidated
  ) {
    return "ATTENTION_REQUIRED";
  }

  return "HEALTHY";
}
