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
  assertPaidBillingPlan,
} from "@/modules/billing/application/billingPlans";
import { recordAuditEvent } from "@/modules/audit/application/recordAuditEvent";

type CreatePendingPaymentInput = {
  userId: string;
  provider: BillingProvider;
  plan: BillingPlan;
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
  const planConfig = assertPaidBillingPlan(input.plan);

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
    subscription.plan !== input.plan
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
        interval: planConfig.interval,
        metadata: serializeMetadata({
          source: "createPendingPayment",
          plan: input.plan,
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
      `LEDGERA ${planConfig.name}`,
    paymentUrl: input.paymentUrl ?? null,
    metadata: serializeMetadata({
      source: "createPendingPayment",
      plan: input.plan,
      provider: input.provider,
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
      provider: input.provider,
      amount: planConfig.amount,
      subscriptionId: subscription.id,
    },
  });

  return payment;
}