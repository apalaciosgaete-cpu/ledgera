import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY no está configurada.");
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-04-30.basil",
});

export type BillingPeriod = "monthly" | "annual";
export type PaidPlan      = "personal" | "contador" | "empresa";

const PRICE_MAP: Record<PaidPlan, Record<BillingPeriod, string | undefined>> = {
  personal:  { monthly: process.env.STRIPE_PRICE_PERSONAL_MONTHLY,     annual: process.env.STRIPE_PRICE_PERSONAL_ANNUAL     },
  contador:  { monthly: process.env.STRIPE_PRICE_PROFESIONAL_MONTHLY,  annual: process.env.STRIPE_PRICE_PROFESIONAL_ANNUAL  },
  empresa:   { monthly: process.env.STRIPE_PRICE_EMPRESA_MONTHLY,      annual: process.env.STRIPE_PRICE_EMPRESA_ANNUAL      },
};

export function getStripePrice(plan: PaidPlan, billing: BillingPeriod): string {
  const priceId = PRICE_MAP[plan]?.[billing];
  if (!priceId) {
    throw new Error(`Price ID no configurado para plan=${plan} billing=${billing}`);
  }
  return priceId;
}

export const PLAN_KEY_TO_SUBSCRIPTION: Record<PaidPlan, "PERSONAL" | "PROFESIONAL" | "EMPRESA"> = {
  personal: "PERSONAL",
  contador: "PROFESIONAL",
  empresa:  "EMPRESA",
};
