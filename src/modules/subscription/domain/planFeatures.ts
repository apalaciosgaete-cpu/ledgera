// src/modules/subscription/domain/planFeatures.ts

/**
 * CAPA 4.2.07 — Normalización de Planes y Permisos.
 *
 * Única fuente de verdad para permisos comerciales.
 *
 * Reglas:
 * - Planes canónicos: FREE | PERSONAL | PRO.
 * - DB legacy BASICO/BASIC → FREE; PROFESIONAL/EMPRESA → PRO.
 * - ADMIN es rol, no plan.
 * - Ningún componente debe usar `plan === "BASICO"`; usar `canAccessFeature()`.
 */

export type Plan = "FREE" | "PERSONAL" | "PRO";

export const Plan = {
  FREE: "FREE",
  PERSONAL: "PERSONAL",
  PRO: "PRO",
} as const;

export const Feature = {
  SII_STATUS: "SII_STATUS",
  TAX_ESTIMATE: "TAX_ESTIMATE",
  PDF_EXPORT: "PDF_EXPORT",
  CSV_EXPORT: "CSV_EXPORT",
  DECLARATIONS: "DECLARATIONS",
  CALENDAR: "CALENDAR",
  EXPERT_MODE: "EXPERT_MODE",
  AUDIT: "AUDIT",
  VERIFICATIONS: "VERIFICATIONS",
  CUSTODY: "CUSTODY",
  ADVANCED_REPORTS: "ADVANCED_REPORTS",
  BILLING: "BILLING",
  ADMIN: "ADMIN",
} as const;

export type Feature = (typeof Feature)[keyof typeof Feature];

const PLAN_FEATURES: Record<Plan, Feature[]> = {
  FREE: [Feature.SII_STATUS],
  PERSONAL: [
    Feature.SII_STATUS,
    Feature.TAX_ESTIMATE,
    Feature.PDF_EXPORT,
    Feature.CSV_EXPORT,
    Feature.DECLARATIONS,
    Feature.CALENDAR,
    Feature.BILLING,
  ],
  PRO: [
    Feature.SII_STATUS,
    Feature.TAX_ESTIMATE,
    Feature.PDF_EXPORT,
    Feature.CSV_EXPORT,
    Feature.DECLARATIONS,
    Feature.CALENDAR,
    Feature.EXPERT_MODE,
    Feature.AUDIT,
    Feature.VERIFICATIONS,
    Feature.CUSTODY,
    Feature.ADVANCED_REPORTS,
    Feature.BILLING,
  ],
};

/** Mapeo legacy runtime: cualquier valor desconocido cae a FREE. */
const LEGACY_PLAN_MAP: Record<string, Plan> = {
  BASICO: "FREE",
  BASIC: "FREE",
  FREE: "FREE",
  PERSONAL: "PERSONAL",
  PROFESIONAL: "PERSONAL",
  EMPRESA: "PRO",
  PRO: "PRO",
};

/** Valor que aún se escribe/lee en la columna `users.subscription_plan`. */
export const DB_PLAN_VALUE: Record<Plan, string> = {
  FREE: "BASICO",
  PERSONAL: "PROFESIONAL",
  PRO: "EMPRESA",
};

export function normalizePlan(plan: string | null | undefined): Plan {
  if (!plan) return "FREE";
  return LEGACY_PLAN_MAP[plan.toUpperCase().trim()] ?? "FREE";
}

export function canAccessFeature(
  plan: string | null | undefined,
  feature: Feature,
): boolean {
  const normalizedPlan = normalizePlan(plan);
  return PLAN_FEATURES[normalizedPlan].includes(feature);
}

export function requiredPlanForFeature(feature: Feature): Plan {
  if (PLAN_FEATURES.FREE.includes(feature)) return "FREE";
  if (PLAN_FEATURES.PERSONAL.includes(feature)) return "PERSONAL";
  return "PRO";
}

/** Alias legacy; preferir `requiredPlanForFeature`. */
export function getRequiredPlan(feature: Feature): Plan {
  return requiredPlanForFeature(feature);
}

export function getPlanLabel(plan: string | null | undefined): string {
  const normalizedPlan = normalizePlan(plan);
  switch (normalizedPlan) {
    case Plan.PRO:
      return "Pro";
    case Plan.PERSONAL:
      return "Personal";
    default:
      return "Free";
  }
}
