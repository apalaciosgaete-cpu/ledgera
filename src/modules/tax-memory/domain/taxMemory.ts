export type TaxMemoryCategory = "RISK" | "TASK" | "RECOMMENDATION" | "DOCUMENT" | "SII" | "AUTOMATION";

export type TaxMemoryStrength = "LOW" | "MEDIUM" | "HIGH";

export interface TaxMemoryPattern {
  id: string;
  userId: string;
  category: TaxMemoryCategory;
  title: string;
  description: string;
  strength: TaxMemoryStrength;
  occurrenceCount: number;
  lastSeenAt: Date;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface UpsertTaxMemoryPatternInput {
  userId: string;
  category: TaxMemoryCategory;
  title: string;
  description: string;
  strength: TaxMemoryStrength;
  occurrenceCount?: number;
  metadata?: Record<string, unknown> | null;
}

export function resolveMemoryStrength(count: number): TaxMemoryStrength {
  if (count >= 5) return "HIGH";
  if (count >= 2) return "MEDIUM";
  return "LOW";
}

export type TaxMemoryStatus =
  | "HEALTHY"
  | "ATTENTION_REQUIRED"
  | "HIGH_RISK"
  | "CRITICAL";

export interface TaxMemoryYearSummary {
  taxYear: number;
  status: "OPEN" | "CLOSED" | "REOPENED";
  closedAt: string | null;
  movementCount: number;
  taxEventCount: number;
  grossProceedsClp: number;
  costBasisClp: number;
  realizedGainClp: number;
  realizedLossClp: number;
  netTaxableGainClp: number;
  preliminaryTaxBaseClp: number;
  declarationCount: number;
  confirmedDeclarationCount: number;
}

export interface TaxMemoryScoreEntry {
  id: string;
  score: number;
  level: string;
  evaluatedAt: string;
}

export interface TaxMemoryAlert {
  id: string;
  title: string;
  severity: string;
  status: string;
  createdAt: string;
  category: string | null;
}

export interface TaxMemoryRecommendation {
  id: string;
  title: string;
  priority: string;
  status: string;
  createdAt: string;
}

export interface TaxMemoryTask {
  id: string;
  title: string;
  priority: string;
  status: string;
  dueDate: string | null;
  createdAt: string;
}

export interface TaxMemoryDeclaration {
  id: string;
  taxYear: number;
  declarationType: string;
  status: string;
  contentHash: string;
  generatedAt: string;
  confirmedAt: string | null;
  voidedAt: string | null;
}

export interface TaxMemoryDocument {
  id: string;
  fileName: string;
  category: string;
  status: string;
  createdAt: string;
}

export interface TaxMemoryTimelineEvent {
  id: string;
  date: string;
  type: "DECLARATION" | "SCORE" | "ALERT" | "TASK" | "DOCUMENT" | "CLOSE" | "REOPEN" | "SYSTEM";
  title: string;
  description: string | null;
  metadata: Record<string, unknown> | null;
}

export interface TaxMemoryInsight {
  type: "POSITIVE" | "INFO" | "WARNING" | "CRITICAL";
  title: string;
  description: string;
  actionLabel: string | null;
  actionHref: string | null;
}

export interface TaxMemory {
  userId: string;
  userEmail: string;
  userName: string;
  subscriptionPlan: string;
  status: TaxMemoryStatus;

  taxProfile: {
    exists: boolean;
    rut: string | null;
    legalName: string | null;
    documentType: string | null;
    isValidated: boolean;
  };

  currentScore: {
    score: number | null;
    level: string | null;
    evaluatedAt: string | null;
  };

  scoreHistory: TaxMemoryScoreEntry[];
  yearSummaries: TaxMemoryYearSummary[];
  alerts: TaxMemoryAlert[];
  recommendations: TaxMemoryRecommendation[];
  tasks: TaxMemoryTask[];
  declarations: TaxMemoryDeclaration[];
  documents: TaxMemoryDocument[];
  timeline: TaxMemoryTimelineEvent[];
  insights: TaxMemoryInsight[];

  siiStatus: {
    configured: boolean;
    status: string;
    activeCafs: number;
  };

  generatedAt: string;
}

export function resolveTaxMemoryStatus(input: {
  currentScoreLevel: string | null;
  criticalAlerts: number;
  openAlerts: number;
  pendingTasks: number;
  hasOverdueTasks: boolean;
  profileValidated: boolean;
}): TaxMemoryStatus {
  if (input.criticalAlerts > 0 || input.currentScoreLevel === "DEFICIENT") {
    return "CRITICAL";
  }
  if (input.currentScoreLevel === "DEVELOPING" || input.hasOverdueTasks) {
    return "HIGH_RISK";
  }
  if (input.openAlerts > 0 || input.pendingTasks > 0 || !input.profileValidated) {
    return "ATTENTION_REQUIRED";
  }
  return "HEALTHY";
}
