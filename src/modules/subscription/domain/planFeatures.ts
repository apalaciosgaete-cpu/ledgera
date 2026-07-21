// src/modules/subscription/domain/planFeatures.ts

/**
 * Fuente de verdad para permisos comerciales.
 *
 * Planes canónicos: FREE | PERSONAL | PROFESIONAL.
 * Los valores históricos PRO y EMPRESA se normalizan a PROFESIONAL para
 * conservar acceso sin ofrecer nuevas contrataciones corporativas.
 */

export type Plan = "FREE" | "PERSONAL" | "PROFESIONAL";

export const Plan = {
  FREE: "FREE",
  PERSONAL: "PERSONAL",
  PROFESIONAL: "PROFESIONAL",
} as const;

export const Feature = {
  SII_STATUS: "SII_STATUS",
  TAX_ESTIMATE: "TAX_ESTIMATE",
  PDF_EXPORT: "PDF_EXPORT",
  XLSX_EXPORT: "XLSX_EXPORT",
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
export type FeatureAvailability = "ACTIVE" | "PLANNED";

/**
 * A capability may exist in the domain before it is ready for sale. Planned
 * capabilities are deliberately excluded from every plan and fail closed in
 * backend authorization.
 */
export const FEATURE_AVAILABILITY: Record<Feature, FeatureAvailability> = {
  [Feature.SII_STATUS]: "ACTIVE",
  [Feature.TAX_ESTIMATE]: "ACTIVE",
  [Feature.PDF_EXPORT]: "ACTIVE",
  [Feature.XLSX_EXPORT]: "ACTIVE",
  [Feature.CSV_EXPORT]: "ACTIVE",
  [Feature.DECLARATIONS]: "ACTIVE",
  [Feature.CALENDAR]: "ACTIVE",
  [Feature.EXPERT_MODE]: "ACTIVE",
  [Feature.AUDIT]: "ACTIVE",
  [Feature.VERIFICATIONS]: "PLANNED",
  [Feature.CUSTODY]: "PLANNED",
  [Feature.ADVANCED_REPORTS]: "PLANNED",
  [Feature.BILLING]: "ACTIVE",
  [Feature.ADMIN]: "ACTIVE",
};

const PLAN_FEATURES: Record<Plan, Feature[]> = {
  FREE: [Feature.SII_STATUS],
  PERSONAL: [
    Feature.SII_STATUS,
    Feature.TAX_ESTIMATE,
    Feature.PDF_EXPORT,
    Feature.XLSX_EXPORT,
    Feature.CSV_EXPORT,
    Feature.DECLARATIONS,
    Feature.CALENDAR,
    Feature.BILLING,
  ],
  PROFESIONAL: [
    Feature.SII_STATUS,
    Feature.TAX_ESTIMATE,
    Feature.PDF_EXPORT,
    Feature.XLSX_EXPORT,
    Feature.CSV_EXPORT,
    Feature.DECLARATIONS,
    Feature.CALENDAR,
    Feature.EXPERT_MODE,
    Feature.AUDIT,
    Feature.BILLING,
  ],
};

const LEGACY_PLAN_MAP: Record<string, Plan> = {
  BASICO: "FREE",
  BASIC: "FREE",
  FREE: "FREE",
  PERSONAL: "PERSONAL",
  PROFESIONAL: "PROFESIONAL",
  PRO: "PROFESIONAL",
  EMPRESA: "PROFESIONAL",
};

export const DB_PLAN_VALUE: Record<Plan, string> = {
  FREE: "BASICO",
  PERSONAL: "PERSONAL",
  PROFESIONAL: "PROFESIONAL",
};

export function normalizePlan(plan: string | null | undefined): Plan {
  if (!plan) return "FREE";
  return LEGACY_PLAN_MAP[plan.toUpperCase().trim()] ?? "FREE";
}

export function isFeatureAvailable(feature: Feature): boolean {
  return FEATURE_AVAILABILITY[feature] === "ACTIVE";
}

export function canAccessFeature(
  plan: string | null | undefined,
  feature: Feature,
): boolean {
  if (!isFeatureAvailable(feature)) return false;

  const normalizedPlan = normalizePlan(plan);
  return PLAN_FEATURES[normalizedPlan].includes(feature);
}

export function requiredPlanForFeature(feature: Feature): Plan {
  if (PLAN_FEATURES.FREE.includes(feature)) return "FREE";
  if (PLAN_FEATURES.PERSONAL.includes(feature)) return "PERSONAL";
  return "PROFESIONAL";
}

export function getRequiredPlan(feature: Feature): Plan {
  return requiredPlanForFeature(feature);
}

export function getPlanLabel(plan: string | null | undefined): string {
  const normalizedPlan = normalizePlan(plan);

  switch (normalizedPlan) {
    case Plan.PROFESIONAL:
      return "Profesional";
    case Plan.PERSONAL:
      return "Personal";
    default:
      return "Gratuito";
  }
}
