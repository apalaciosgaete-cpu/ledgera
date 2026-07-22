import type {
  BillingCurrency,
  BillingInterval,
  BillingPlan,
} from "@/modules/billing/domain/billing";
import { COMMERCIAL_PLANS } from "@/modules/billing/domain/commercialPlans";

export type BillingPlanConfig = {
  plan: BillingPlan;
  name: string;
  description: string;
  amount: number;
  netAmount: number;
  taxAmount: number;
  currency: BillingCurrency;
  interval: BillingInterval;
  sellable: boolean;
  features: string[];
};

export const BILLING_PLANS: Record<BillingPlan, BillingPlanConfig> = {
  BASICO: {
    plan: "BASICO",
    name: COMMERCIAL_PLANS.FREE.label,
    description: "Plan inicial para conocer cómo LEDGERA ordena tus operaciones.",
    amount: COMMERCIAL_PLANS.FREE.monthly.grossAmount,
    netAmount: COMMERCIAL_PLANS.FREE.monthly.netAmount,
    taxAmount: COMMERCIAL_PLANS.FREE.monthly.taxAmount,
    currency: "CLP",
    interval: "MONTHLY",
    sellable: true,
    features: [
      "Análisis preliminar de hasta 50 movimientos",
      "Una fuente de importación",
      "Vista preliminar del análisis",
      "Detección básica de inconsistencias",
    ],
  },
  PERSONAL: {
    plan: "PERSONAL",
    name: COMMERCIAL_PLANS.PERSONAL.label,
    description: "Plan para traders, inversionistas y personas con actividad cripto.",
    amount: COMMERCIAL_PLANS.PERSONAL.monthly.grossAmount,
    netAmount: COMMERCIAL_PLANS.PERSONAL.monthly.netAmount,
    taxAmount: COMMERCIAL_PLANS.PERSONAL.monthly.taxAmount,
    currency: "CLP",
    interval: "MONTHLY",
    sellable: true,
    features: [
      "Múltiples fuentes de importación",
      "Historial cripto continuo",
      "Conciliación y corrección de inconsistencias",
      "Trazabilidad del costo por activo",
      "Exportación PDF y Excel",
      "Soporte por email",
    ],
  },
  PROFESIONAL: {
    plan: "PROFESIONAL",
    name: COMMERCIAL_PLANS.PROFESIONAL.label,
    description: "Plan para contribuyentes que necesitan revisión técnica avanzada.",
    amount: COMMERCIAL_PLANS.PROFESIONAL.monthly.grossAmount,
    netAmount: COMMERCIAL_PLANS.PROFESIONAL.monthly.netAmount,
    taxAmount: COMMERCIAL_PLANS.PROFESIONAL.monthly.taxAmount,
    currency: "CLP",
    interval: "MONTHLY",
    sellable: true,
    features: [
      "Todo lo de Personal",
      "Vista experta de casos tributarios",
      "Auditoría ampliada de eventos",
      "Reportes trazables para revisión",
      "Soporte prioritario",
    ],
  },
  EMPRESA: {
    plan: "EMPRESA",
    name: "Empresa (legado)",
    description: "Plan histórico sin nuevas contrataciones; se mantiene para compatibilidad de datos.",
    amount: COMMERCIAL_PLANS.PROFESIONAL.monthly.grossAmount,
    netAmount: COMMERCIAL_PLANS.PROFESIONAL.monthly.netAmount,
    taxAmount: COMMERCIAL_PLANS.PROFESIONAL.monthly.taxAmount,
    currency: "CLP",
    interval: "MONTHLY",
    sellable: false,
    features: [
      "Compatibilidad con suscripciones históricas",
      "Acceso equivalente al plan Profesional",
    ],
  },
};

export function getBillingPlanConfig(
  plan: BillingPlan,
): BillingPlanConfig {
  return BILLING_PLANS[plan];
}

export function isValidBillingPlan(
  value: unknown,
): value is BillingPlan {
  return (
    value === "BASICO" ||
    value === "PERSONAL" ||
    value === "PROFESIONAL"
  );
}

export function assertPaidBillingPlan(
  plan: BillingPlan,
): BillingPlanConfig {
  const config = getBillingPlanConfig(plan);

  if (config.amount <= 0 || !config.sellable) {
    throw new Error(
      plan === "EMPRESA"
        ? "El plan Empresa no admite nuevas contrataciones."
        : "El plan seleccionado no requiere pago.",
    );
  }

  return config;
}
