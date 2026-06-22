// src/modules/adaptive-profile/domain/adaptiveProfile.ts

export type ComplianceBehavior =
  | "EXCELLENT"
  | "GOOD"
  | "REGULAR"
  | "POOR";

export type RecommendationBehavior =
  | "ENGAGED"
  | "PARTIAL"
  | "PASSIVE";

export type TaskBehavior =
  | "FAST"
  | "NORMAL"
  | "DELAYED";

export type DocumentBehavior =
  | "ORGANIZED"
  | "INCOMPLETE"
  | "CRITICAL";

export type RiskBehavior =
  | "STABLE"
  | "GROWING"
  | "CRITICAL";

export type AdaptiveProfileType =
  | "OPTIMIZED"
  | "STANDARD"
  | "ATTENTION_REQUIRED"
  | "CRITICAL";

export const ADAPTIVE_PROFILE_TYPES: AdaptiveProfileType[] = [
  "OPTIMIZED",
  "STANDARD",
  "ATTENTION_REQUIRED",
  "CRITICAL",
];

export function resolveAdaptiveProfileType(score: number, criticalAlerts: number, pendingTasks: number, hasOverdueTasks: boolean, openAlerts: number): AdaptiveProfileType {
  // CRITICAL: score bajo, alertas críticas o tareas vencidas
  if (score < 50 || criticalAlerts > 0 || hasOverdueTasks) {
    return "CRITICAL";
  }
  // OPTIMIZED: score alto sin problemas
  if (score > 80 && criticalAlerts === 0 && pendingTasks === 0 && openAlerts === 0) {
    return "OPTIMIZED";
  }
  // STANDARD: rango normal con pocas tareas
  if (score >= 50 && score <= 80 && pendingTasks <= 3) {
    return "STANDARD";
  }
  // ATTENTION_REQUIRED: el resto
  return "ATTENTION_REQUIRED";
}

export function resolveComplianceBehavior(score: number): ComplianceBehavior {
  if (score >= 85) return "EXCELLENT";
  if (score >= 70) return "GOOD";
  if (score >= 50) return "REGULAR";
  return "POOR";
}

export function resolveRecommendationBehavior(
  acceptedCount: number,
  ignoredCount: number,
  totalCount: number,
): RecommendationBehavior {
  if (totalCount === 0) return "PASSIVE";
  const ratio = acceptedCount / totalCount;
  if (ratio >= 0.7) return "ENGAGED";
  if (ratio >= 0.3) return "PARTIAL";
  return "PASSIVE";
}

export function resolveTaskBehavior(
  completedOnTime: number,
  completedLate: number,
  pendingCount: number,
): TaskBehavior {
  const total = completedOnTime + completedLate + pendingCount;
  if (total === 0) return "NORMAL";
  const onTimeRatio = completedOnTime / total;
  if (onTimeRatio >= 0.8) return "FAST";
  if (pendingCount > completedOnTime + completedLate) return "DELAYED";
  return "NORMAL";
}

export function resolveDocumentBehavior(
  organizedCount: number,
  incompleteCount: number,
  criticalCount: number,
): DocumentBehavior {
  const total = organizedCount + incompleteCount + criticalCount;
  if (total === 0) return "ORGANIZED";
  if (criticalCount > 0) return "CRITICAL";
  const organizedRatio = organizedCount / total;
  if (organizedRatio >= 0.8) return "ORGANIZED";
  return "INCOMPLETE";
}

export function resolveRiskBehavior(riskLevel: string | null): RiskBehavior {
  if (riskLevel === "CRITICAL" || riskLevel === "HIGH") return "CRITICAL";
  if (riskLevel === "MEDIUM") return "GROWING";
  return "STABLE";
}

export interface AdaptiveProfile {
  id: string;
  userId: string;

  complianceScore: number;

  complianceBehavior: ComplianceBehavior;
  recommendationBehavior: RecommendationBehavior;
  taskBehavior: TaskBehavior;
  documentBehavior: DocumentBehavior;
  riskBehavior: RiskBehavior;

  profileType: AdaptiveProfileType;

  confidence: number;

  metadata: Record<string, unknown> | null;

  createdAt: Date;
  updatedAt: Date;
}

export interface AdaptiveProfileSnapshot {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;

  complianceScore: number;

  complianceBehavior: ComplianceBehavior;
  recommendationBehavior: RecommendationBehavior;
  taskBehavior: TaskBehavior;
  documentBehavior: DocumentBehavior;
  riskBehavior: RiskBehavior;

  profileType: AdaptiveProfileType;

  confidence: number;

  metadata: Record<string, unknown> | null;

  createdAt: string;
  updatedAt: string;
}

export function profileTypeLabel(pt: AdaptiveProfileType): string {
  switch (pt) {
    case "OPTIMIZED": return "Optimizado";
    case "STANDARD": return "Estándar";
    case "ATTENTION_REQUIRED": return "Atención Requerida";
    case "CRITICAL": return "Crítico";
  }
}

export function profileTypeDescription(pt: AdaptiveProfileType): string {
  switch (pt) {
    case "OPTIMIZED": return "Tu comportamiento tributario es ejemplar. Sigue así.";
    case "STANDARD": return "Tu perfil está dentro de lo esperado. Hay oportunidades de mejora.";
    case "ATTENTION_REQUIRED": return "Hay aspectos importantes que requieren tu atención.";
    case "CRITICAL": return "Se necesita acción inmediata para evitar problemas tributarios.";
  }
}

export function profileTypeColor(pt: AdaptiveProfileType): string {
  switch (pt) {
    case "OPTIMIZED": return "#15803D";
    case "STANDARD": return "#0F766E";
    case "ATTENTION_REQUIRED": return "#B45309";
    case "CRITICAL": return "#991B1B";
  }
}

export function profileTypeBg(pt: AdaptiveProfileType): string {
  switch (pt) {
    case "OPTIMIZED": return "#F0FDF4";
    case "STANDARD": return "#F0FDFA";
    case "ATTENTION_REQUIRED": return "#FFFBEB";
    case "CRITICAL": return "#FEF2F2";
  }
}

export function profileTypeIcon(pt: AdaptiveProfileType): string {
  switch (pt) {
    case "OPTIMIZED": return "🏆";
    case "STANDARD": return "✓";
    case "ATTENTION_REQUIRED": return "⚠";
    case "CRITICAL": return "🚨";
  }
}

export function behaviorLabel<T extends string>(value: T, map: Record<T, string>): string {
  return map[value] ?? String(value);
}

export const COMPLIANCE_LABELS: Record<ComplianceBehavior, string> = {
  EXCELLENT: "Cumplimiento excelente",
  GOOD: "Cumplimiento bueno",
  REGULAR: "Cumplimiento irregular",
  POOR: "Alto incumplimiento",
};

export const RECOMMENDATION_LABELS: Record<RecommendationBehavior, string> = {
  ENGAGED: "Acepta recomendaciones",
  PARTIAL: "Acepta parcialmente",
  PASSIVE: "Ignora recomendaciones",
};

export const TASK_LABELS: Record<TaskBehavior, string> = {
  FAST: "Resuelve rápido",
  NORMAL: "Resuelve en tiempo normal",
  DELAYED: "Acumula tareas",
};

export const DOCUMENT_LABELS: Record<DocumentBehavior, string> = {
  ORGANIZED: "Documentación ordenada",
  INCOMPLETE: "Documentación incompleta",
  CRITICAL: "Documentación crítica",
};

export const RISK_LABELS: Record<RiskBehavior, string> = {
  STABLE: "Riesgo estable",
  GROWING: "Riesgo creciente",
  CRITICAL: "Riesgo crítico recurrente",
};

export function confidenceLabel(confidence: number): string {
  if (confidence >= 80) return "Alta";
  if (confidence >= 50) return "Media";
  return "Baja";
}
