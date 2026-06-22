export type TaxRiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type TaxRiskFactor =
  | "ALERTS"
  | "TAX_PROFILE"
  | "DTE"
  | "SII"
  | "UNCLASSIFIED_OPERATIONS"
  | "CONNECTIONS"
  | "COMMERCIAL";

export interface TaxRiskBreakdownItem {
  factor: TaxRiskFactor;
  score: number;
  maxScore: number;
  label: string;
  message: string;
}

export interface TaxRiskScore {
  id: string;
  userId: string;
  score: number;
  level: TaxRiskLevel;
  breakdown: TaxRiskBreakdownItem[];
  evaluatedAt: Date;
}

export function resolveTaxRiskLevel(score: number): TaxRiskLevel {
  if (score <= 30) return "LOW";
  if (score <= 60) return "MEDIUM";
  if (score <= 80) return "HIGH";
  return "CRITICAL";
}

export const TAX_RISK_LEVELS: TaxRiskLevel[] = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

export function isValidTaxRiskLevel(value: string): value is TaxRiskLevel {
  return TAX_RISK_LEVELS.includes(value as TaxRiskLevel);
}

export function capScore(score: number, max: number): number {
  return Math.min(score, max);
}
