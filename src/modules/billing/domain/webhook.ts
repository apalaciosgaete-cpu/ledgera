// src/modules/billing/domain/webhook.ts

import {
  CHECKOUT_PLANS,
  type BillingCheckoutPlan,
  type BillingProvider,
  resolveBillingProvider,
} from "@/modules/billing/domain/checkout";

export const BILLING_WEBHOOK_EVENTS = [
  "payment_succeeded",
  "payment_failed",
  "subscription_cancelled",
] as const;

export type BillingWebhookEventType = (typeof BILLING_WEBHOOK_EVENTS)[number];

export type NormalizedBillingWebhook = {
  provider: BillingProvider;
  providerEventId: string | null;
  eventType: BillingWebhookEventType;
  paymentId: string | null;
  providerPaymentId: string | null;
  checkoutId: string | null;
  plan: BillingCheckoutPlan | null;
  paidAt: Date | null;
  rawPayload: unknown;
};

type WebhookPayload = {
  provider?: string;
  providerEventId?: string;
  id?: string;
  eventType?: string;
  type?: string;
  status?: string;
  paymentId?: string;
  providerPaymentId?: string;
  checkoutId?: string;
  plan?: string;
  paidAt?: string;
  data?: {
    id?: string;
    paymentId?: string;
    providerPaymentId?: string;
    checkoutId?: string;
    plan?: string;
    status?: string;
    paidAt?: string;
  };
};

function normalizeEventType(payload: WebhookPayload): BillingWebhookEventType | null {
  const explicit = (payload.eventType ?? payload.type ?? "").toLowerCase().trim();
  const status = (payload.status ?? payload.data?.status ?? "").toLowerCase().trim();

  if (explicit === "payment_succeeded" || explicit === "checkout.session.completed" || explicit === "payment.completed") {
    return "payment_succeeded";
  }

  if (explicit === "payment_failed" || explicit === "payment.failed" || explicit === "checkout.session.expired") {
    return "payment_failed";
  }

  if (explicit === "subscription_cancelled" || explicit === "customer.subscription.deleted") {
    return "subscription_cancelled";
  }

  if (["paid", "approved", "succeeded", "completed", "success"].includes(status)) {
    return "payment_succeeded";
  }

  if (["failed", "rejected", "cancelled", "canceled", "error"].includes(status)) {
    return "payment_failed";
  }

  return null;
}

function normalizePlan(plan: string | null | undefined): BillingCheckoutPlan | null {
  if (!plan) return null;

  const normalized = plan.toUpperCase().trim();

  return CHECKOUT_PLANS.includes(normalized as BillingCheckoutPlan)
    ? (normalized as BillingCheckoutPlan)
    : null;
}

function parsePaidAt(value: string | null | undefined): Date | null {
  if (!value) return null;

  const parsed = new Date(value);

  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function normalizeBillingWebhookPayload(payload: unknown): NormalizedBillingWebhook | null {
  if (typeof payload !== "object" || payload === null) return null;

  const input = payload as WebhookPayload;
  const eventType = normalizeEventType(input);

  if (!eventType) return null;

  const provider = resolveBillingProvider(input.provider);
  const paymentId = input.paymentId ?? input.data?.paymentId ?? null;
  const providerPaymentId = input.providerPaymentId ?? input.data?.providerPaymentId ?? input.data?.id ?? null;
  const checkoutId = input.checkoutId ?? input.data?.checkoutId ?? null;
  const plan = normalizePlan(input.plan ?? input.data?.plan);
  const paidAt = parsePaidAt(input.paidAt ?? input.data?.paidAt) ?? new Date();

  return {
    provider,
    providerEventId: input.providerEventId ?? input.id ?? null,
    eventType,
    paymentId,
    providerPaymentId,
    checkoutId,
    plan,
    paidAt: eventType === "payment_succeeded" ? paidAt : null,
    rawPayload: payload,
  };
}

export function addBillingMonths(date: Date, months: number) {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next;
}
