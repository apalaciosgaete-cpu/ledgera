import type {
  BillingCurrency,
  BillingInterval,
  BillingPlan,
} from "@/modules/billing/domain/billing";

export type BillingPlanConfig = {
  plan: BillingPlan;
  name: string;
  description: string;
  amount: number;
  currency: BillingCurrency;
  interval: BillingInterval;
  features: string[];
};

export const BILLING_PLANS: Record<BillingPlan, BillingPlanConfig> = {
  BASICO: {
    plan: "BASICO",
    name: "Gratuito",
    description: "Plan inicial para conocer cómo LEDGERA ordena tus operaciones.",
    amount: 0,
    currency: "CLP",
    interval: "MONTHLY",
    features: [
      "Hasta 100 movimientos",
      "Una fuente de importación",
      "Vista preliminar del análisis",
      "Detección básica de inconsistencias",
    ],
  },
  PERSONAL: {
    plan: "PERSONAL",
    name: "Personal",
    description: "Plan para traders, inversionistas y personas con actividad cripto.",
    amount: 7128,
    currency: "CLP",
    interval: "MONTHLY",
    features: [
      "Historial cripto continuo",
      "Conciliación y corrección de inconsistencias",
      "Trazabilidad del costo por activo",
      "Exportación PDF y Excel",
      "Soporte por email",
    ],
  },
  PROFESIONAL: {
    plan: "PROFESIONAL",
    name: "Profesional",
    description: "Plan para contadores y asesores que administran varios contribuyentes.",
    amount: 35688,
    currency: "CLP",
    interval: "MONTHLY",
    features: [
      "Todo lo de Personal",
      "Hasta 5 clientes activos",
      "Panel multicliente",
      "Reportes trazables para revisión",
      "Soporte prioritario",
    ],
  },
  EMPRESA: {
    plan: "EMPRESA",
    name: "Empresa (legado)",
    description: "Plan histórico sin nuevas contrataciones; se mantiene para compatibilidad de datos.",
    amount: 35688,
    currency: "CLP",
    interval: "MONTHLY",
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

  if (config.amount <= 0 || plan === "EMPRESA") {
    throw new Error(
      plan === "EMPRESA"
        ? "El plan Empresa no admite nuevas contrataciones."
        : "El plan seleccionado no requiere pago.",
    );
  }

  return config;
}
