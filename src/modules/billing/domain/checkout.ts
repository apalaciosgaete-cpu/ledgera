// src/modules/billing/domain/checkout.ts

import { COMMERCIAL_PLANS } from "@/modules/billing/domain/commercialPlans";

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

function toCheckoutPrice(
  price: { grossAmount: number; netAmount: number; taxAmount: number },
): CheckoutPriceConfig {
  return {
    amount: price.grossAmount,
    netAmount: price.netAmount,
    taxAmount: price.taxAmount,
    taxIncluded: false,
  };
}

export const CHECKOUT_PLAN_CONFIG: Record<BillingCheckoutPlan, CheckoutPlanDefinition> = {
  PERSONAL: {
    plan: "PERSONAL",
    label: COMMERCIAL_PLANS.PERSONAL.label,
    currency: "CLP",
    targetSubscriptionPlan: "PERSONAL",
    prices: {
      MONTHLY: toCheckoutPrice(COMMERCIAL_PLANS.PERSONAL.monthly),
      ANNUAL: toCheckoutPrice(COMMERCIAL_PLANS.PERSONAL.annual),
    },
  },
  PROFESIONAL: {
    plan: "PROFESIONAL",
    label: COMMERCIAL_PLANS.PROFESIONAL.label,
    currency: "CLP",
    targetSubscriptionPlan: "PROFESIONAL",
    prices: {
      MONTHLY: toCheckoutPrice(COMMERCIAL_PLANS.PROFESIONAL.monthly),
      ANNUAL: toCheckoutPrice(COMMERCIAL_PLANS.PROFESIONAL.annual),
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
