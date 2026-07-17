// src/modules/billing/domain/checkout.ts

export const BILLING_PROVIDERS = ["stripe", "flow", "mercadopago"] as const;
export type BillingProvider = (typeof BILLING_PROVIDERS)[number];

export const CHECKOUT_PLANS = ["PERSONAL", "PROFESIONAL"] as const;
export type BillingCheckoutPlan = (typeof CHECKOUT_PLANS)[number];

export type BillingInterval = "MONTHLY" | "ANNUAL";

export type CheckoutPriceConfig = {
  amount: number;
  netAmount: number;
  taxAmount: number;
  taxIncluded: boolean;
};

export type CheckoutPlanDefinition = {
  plan: BillingCheckoutPlan;
  label: string;
  currency: "CLP";
  targetSubscriptionPlan: "PERSONAL" | "PROFESIONAL";
  prices: Record<BillingInterval, CheckoutPriceConfig>;
};

export type CheckoutPlanConfig = CheckoutPriceConfig & {
  plan: BillingCheckoutPlan;
  label: string;
  currency: "CLP";
  interval: BillingInterval;
  targetSubscriptionPlan: "PERSONAL" | "PROFESIONAL";
};

export const CHECKOUT_PLAN_CONFIG: Record<BillingCheckoutPlan, CheckoutPlanDefinition> = {
  PERSONAL: {
    plan: "PERSONAL",
    label: "Personal",
    currency: "CLP",
    targetSubscriptionPlan: "PERSONAL",
    prices: {
      MONTHLY: {
        amount: 7128,
        netAmount: 5990,
        taxAmount: 1138,
        taxIncluded: false,
      },
      ANNUAL: {
        amount: 71281,
        netAmount: 59900,
        taxAmount: 11381,
        taxIncluded: false,
      },
    },
  },
  PROFESIONAL: {
    plan: "PROFESIONAL",
    label: "Profesional",
    currency: "CLP",
    targetSubscriptionPlan: "PROFESIONAL",
    prices: {
      MONTHLY: {
        amount: 35688,
        netAmount: 29990,
        taxAmount: 5698,
        taxIncluded: false,
      },
      ANNUAL: {
        amount: 356881,
        netAmount: 299900,
        taxAmount: 56981,
        taxIncluded: false,
      },
    },
  },
};

export function normalizeCheckoutPlan(plan: string | null | undefined): BillingCheckoutPlan | null {
  if (!plan) return null;

  const normalized = plan.toUpperCase().trim();

  return CHECKOUT_PLANS.includes(normalized as BillingCheckoutPlan)
    ? (normalized as BillingCheckoutPlan)
    : null;
}

export function normalizeBillingInterval(
  interval: string | null | undefined,
): BillingInterval {
  return interval?.toUpperCase().trim() === "ANNUAL" ? "ANNUAL" : "MONTHLY";
}

export function getCheckoutPlanConfig(
  plan: BillingCheckoutPlan,
  interval: BillingInterval,
): CheckoutPlanConfig {
  const definition = CHECKOUT_PLAN_CONFIG[plan];
  const price = definition.prices[interval];

  return {
    plan: definition.plan,
    label: definition.label,
    currency: definition.currency,
    targetSubscriptionPlan: definition.targetSubscriptionPlan,
    interval,
    ...price,
  };
}

export function resolveBillingProvider(provider: string | null | undefined): BillingProvider {
  const normalized = provider?.toLowerCase().trim();

  return BILLING_PROVIDERS.includes(normalized as BillingProvider)
    ? (normalized as BillingProvider)
    : "flow";
}

export function buildCheckoutReturnUrl(input: {
  origin: string;
  paymentId: string;
  status?: "pending" | "success" | "error";
}) {
  const url = new URL("/configuracion/facturacion", input.origin);
  url.searchParams.set("checkout", input.status ?? "pending");
  url.searchParams.set("paymentId", input.paymentId);

  return url.toString();
}
