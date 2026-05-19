import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-04-22.dahlia",
});

export const STRIPE_PRICES: Record<string, Record<"mensual" | "anual", string>> = {
  PERSONAL: {
    mensual: process.env.STRIPE_PRICE_PERSONAL_MENSUAL ?? "",
    anual:   process.env.STRIPE_PRICE_PERSONAL_ANUAL   ?? "",
  },
  PROFESIONAL: {
    mensual: process.env.STRIPE_PRICE_CONTADOR_MENSUAL ?? "",
    anual:   process.env.STRIPE_PRICE_CONTADOR_ANUAL   ?? "",
  },
  EMPRESA: {
    mensual: process.env.STRIPE_PRICE_EMPRESA_MENSUAL  ?? "",
    anual:   process.env.STRIPE_PRICE_EMPRESA_ANUAL    ?? "",
  },
};

export const PRICE_TO_PLAN: Record<string, string> = {
  [process.env.STRIPE_PRICE_PERSONAL_MENSUAL ?? ""]: "PERSONAL",
  [process.env.STRIPE_PRICE_PERSONAL_ANUAL   ?? ""]: "PERSONAL",
  [process.env.STRIPE_PRICE_CONTADOR_MENSUAL ?? ""]: "PROFESIONAL",
  [process.env.STRIPE_PRICE_CONTADOR_ANUAL   ?? ""]: "PROFESIONAL",
  [process.env.STRIPE_PRICE_EMPRESA_MENSUAL  ?? ""]: "EMPRESA",
  [process.env.STRIPE_PRICE_EMPRESA_ANUAL    ?? ""]: "EMPRESA",
};
