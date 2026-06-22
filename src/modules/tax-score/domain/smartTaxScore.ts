export type SmartTaxScoreLevel = "DEFICIENT" | "DEVELOPING" | "HEALTHY" | "OPTIMAL";

export const SMART_TAX_SCORE_LEVELS: SmartTaxScoreLevel[] = [
  "DEFICIENT",
  "DEVELOPING",
  "HEALTHY",
  "OPTIMAL",
];

export type SmartTaxScoreFactor =
  | "TAX_IDENTITY"
  | "DATA_COMPLETENESS"
  | "CLASSIFICATION_QUALITY"
  | "ALERT_RESOLUTION"
  | "DTE_HEALTH"
  | "SII_READINESS"
  | "AUDIT_HEALTH"
  | "RISK_CONTROL";

export const SMART_TAX_SCORE_FACTORS: SmartTaxScoreFactor[] = [
  "TAX_IDENTITY",
  "DATA_COMPLETENESS",
  "CLASSIFICATION_QUALITY",
  "ALERT_RESOLUTION",
  "DTE_HEALTH",
  "SII_READINESS",
  "AUDIT_HEALTH",
  "RISK_CONTROL",
];

export interface SmartTaxScoreBreakdownItem {
  factor: SmartTaxScoreFactor;
  score: number;
  maxScore: number;
  label: string;
  message: string;
}

export interface SmartTaxScore {
  id: string;
  userId: string;
  score: number;
  level: SmartTaxScoreLevel;
  breakdown: SmartTaxScoreBreakdownItem[];
  evaluatedAt: Date;
}

export function resolveSmartTaxScoreLevel(score: number): SmartTaxScoreLevel {
  if (score <= 40) return "DEFICIENT";
  if (score <= 65) return "DEVELOPING";
  if (score <= 85) return "HEALTHY";
  return "OPTIMAL";
}

export function isValidSmartTaxScoreLevel(value: string): value is SmartTaxScoreLevel {
  return SMART_TAX_SCORE_LEVELS.includes(value as SmartTaxScoreLevel);
}

export function isValidSmartTaxScoreFactor(value: string): value is SmartTaxScoreFactor {
  return SMART_TAX_SCORE_FACTORS.includes(value as SmartTaxScoreFactor);
}

export function capSmartScore(score: number): number {
  if (score < 0) return 0;
  if (score > 100) return 100;
  return score;
}
