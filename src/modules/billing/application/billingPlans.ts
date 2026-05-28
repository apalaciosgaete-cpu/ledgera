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
    description: "Plan inicial para explorar LEDGERA.",
    amount: 0,
    currency: "CLP",
    interval: "MONTHLY",
    features: [
      "Hasta 25 movimientos",
      "Motor FIFO incluido",
      "Panel tributario básico",
    ],
  },
  PERSONAL: {
    plan: "PERSONAL",
    name: "Personal",
    description: "Plan para personas naturales con operación cripto activa.",
    amount: 4990,
    currency: "CLP",
    interval: "MONTHLY",
    features: [
      "Movimientos ilimitados",
      "Motor FIFO automático",
      "Exportación CSV y PDF",
      "Auditoría completa",
      "Soporte por email",
    ],
  },
  PROFESIONAL: {
    plan: "PROFESIONAL",
    name: "Profesional",
    description: "Plan para asesores y equipos con clientes.",
    amount: 14990,
    currency: "CLP",
    interval: "MONTHLY",
    features: [
      "Todo lo de Personal",
      "Hasta 5 clientes incluidos",
      "Cliente adicional +20% del valor del plan",
      "Reportes verificables SII",
      "Soporte prioritario",
    ],
  },
  EMPRESA: {
    plan: "EMPRESA",
    name: "Empresa",
    description: "Plan para empresas, oficinas contables y operación avanzada.",
    amount: 29990,
    currency: "CLP",
    interval: "MONTHLY",
    features: [
      "Todo lo de Profesional",
      "Clientes ilimitados",
      "Régimen primera categoría",
      "Configuración tributaria",
      "Soporte dedicado",
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
