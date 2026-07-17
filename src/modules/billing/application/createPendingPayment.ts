import type {
  BillingPayment,
  BillingPlan,
  BillingProvider,
} from "@/modules/billing/domain/billing";

import {
  createBillingPayment,
  createBillingSubscription,
  getBillingCustomerByUserAndProvider,
  getLatestBillingSubscriptionByUserId,
} from "@/modules/billing/infrastructure/billingRepository";

import {
  getCheckoutPlanConfig,
  normalizeBillingInterval,
  normalizeCheckoutPlan,
  type BillingInterval,
} from "@/modules/billing/domain/checkout";
import { recordAuditEvent } from "@/modules/audit/application/recordAuditEvent";

type CreatePendingPaymentInput = {
  userId: string;
  provider: BillingProvider;
  plan: BillingPlan;
  interval?: BillingInterval | string;
  description?: string;
  checkoutId?: string | null;
  providerPaymentId?: string | null;
  paymentUrl?: string | null;
  metadata?: Record<string, unknown>;
};

function serializeMetadata(
  metadata?: Record<string, unknown>,
): string | null {
  if (!metadata) return null;

  return JSON.stringify(metadata);
}

export async function createPendingPayment(
  input: CreatePendingPaymentInput,
): Promise<BillingPayment> {
  const checkoutPlan = normalizeCheckoutPlan(input.plan);

  if (!checkoutPlan) {
    throw new Error("El plan seleccionado no admite nuevas contrataciones.");
  }

  const interval = normalizeBillingInterval(input.interval);
  const planConfig = getCheckoutPlanConfig(checkoutPlan, interval);

  const customer =
    await getBillingCustomerByUserAndProvider({
      userId: input.userId,
      provider: input.provider,
    });

  let subscription =
    await getLatestBillingSubscriptionByUserId(
      input.userId,
    );

  if (
    !subscription ||
    subscription.provider !== input.provider ||
    subscription.plan !== input.plan ||
    subscription.interval !== interval
  ) {
    subscription =
      await createBillingSubscription({
        userId: input.userId,
        customerId: customer?.id ?? null,
        provider: input.provider,
        plan: input.plan,
        status: "PENDING",
        currency: planConfig.currency,
        amount: planConfig.amount,
        interval,
        metadata: serializeMetadata({
          source: "createPendingPayment",
          plan: input.plan,
          interval,
          provider: input.provider,
        }),
      });
  }

  const payment = await createBillingPayment({
    userId: input.userId,
    customerId: customer?.id ?? null,
    subscriptionId: subscription.id,
    provider: input.provider,
    providerPaymentId:
      input.providerPaymentId ?? null,
    checkoutId: input.checkoutId ?? null,
    status: "PENDING",
    amount: planConfig.amount,
    currency: planConfig.currency,
    description:
      input.description ??
      `LEDGERA ${planConfig.label} ${interval === "ANNUAL" ? "anual" : "mensual"}`,
    paymentUrl: input.paymentUrl ?? null,
    metadata: serializeMetadata({
      source: "createPendingPayment",
      plan: input.plan,
      interval,
      provider: input.provider,
      amount: planConfig.amount,
      netAmount: planConfig.netAmount,
      taxAmount: planConfig.taxAmount,
      ...input.metadata,
    }),
  });

  await recordAuditEvent({
    userId: input.userId,
    category: "BILLING",
    severity: "INFO",
    event: "checkout_started",
    description: `Checkout iniciado para plan ${input.plan}`,
    result: "SUCCESS",
    entityType: "BillingPayment",
    entityId: payment.id,
    metadata: {
      plan: input.plan,
      interval,
      provider: input.provider,
      amount: planConfig.amount,
      subscriptionId: subscription.id,
    },
  });

  return payment;
}
