// src/modules/billing/domain/checkout.ts

export const BILLING_PROVIDERS = ["stripe", "flow", "mercadopago"] as const;
export type BillingProvider = (typeof BILLING_PROVIDERS)[number];

export const CHECKOUT_PLANS = ["PERSONAL", "PROFESIONAL", "EMPRESA"] as const;
export type BillingCheckoutPlan = (typeof CHECKOUT_PLANS)[number];

export type BillingInterval = "MONTHLY" | "ANNUAL";

export type CheckoutPlanConfig = {
  plan: BillingCheckoutPlan;
  label: string;
  amount: number;
  currency: "CLP";
  interval: BillingInterval;
  targetSubscriptionPlan: "PROFESIONAL" | "EMPRESA";
};

export const CHECKOUT_PLAN_CONFIG: Record<BillingCheckoutPlan, CheckoutPlanConfig> = {
  PERSONAL: {
    plan: "PERSONAL",
    label: "Personal",
    amount: 4990,
    currency: "CLP",
    interval: "MONTHLY",
    targetSubscriptionPlan: "PROFESIONAL",
  },
  PROFESIONAL: {
    plan: "PROFESIONAL",
    label: "Pro",
    amount: 29990,
    currency: "CLP",
    interval: "MONTHLY",
    targetSubscriptionPlan: "EMPRESA",
  },
  EMPRESA: {
    plan: "EMPRESA",
    label: "Empresa",
    amount: 59990,
    currency: "CLP",
    interval: "MONTHLY",
    targetSubscriptionPlan: "EMPRESA",
  },
};

export function normalizeCheckoutPlan(plan: string | null | undefined): BillingCheckoutPlan | null {
  if (!plan) return null;

  const normalized = plan.toUpperCase().trim();

  return CHECKOUT_PLANS.includes(normalized as BillingCheckoutPlan)
    ? (normalized as BillingCheckoutPlan)
    : null;
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
