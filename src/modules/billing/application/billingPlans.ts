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
    name: "Básico",
    description: "Plan inicial para explorar LEDGERA.",
    amount: 0,
    currency: "CLP",
    interval: "MONTHLY",
    features: [
      "Acceso básico al sistema",
      "Registro de movimientos",
      "Vista inicial de portafolio",
    ],
  },
  PROFESIONAL: {
    plan: "PROFESIONAL",
    name: "Profesional",
    description: "Plan para personas naturales con operación cripto activa.",
    amount: 19900,
    currency: "CLP",
    interval: "MONTHLY",
    features: [
      "Portafolio completo",
      "Motor FIFO",
      "Resumen tributario",
      "Reportes CSV/PDF",
      "Verificación pública de reportes",
    ],
  },
  EMPRESA: {
    plan: "EMPRESA",
    name: "Empresa",
    description: "Plan para empresas, estudios contables y operación avanzada.",
    amount: 59900,
    currency: "CLP",
    interval: "MONTHLY",
    features: [
      "Todo el plan Profesional",
      "Auditoría avanzada",
      "Gestión multiusuario futura",
      "Soporte prioritario",
      "Preparación B2B",
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
    value === "PROFESIONAL" ||
    value === "EMPRESA"
  );
}

export function assertPaidBillingPlan(
  plan: BillingPlan,
): BillingPlanConfig {
  const config = getBillingPlanConfig(plan);

  if (config.amount <= 0) {
    throw new Error(
      "El plan seleccionado no requiere pago.",
    );
  }

  return config;
}