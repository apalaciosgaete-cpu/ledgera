// src/modules/billing/application/processBillingWebhook.ts

import { prisma } from "@/lib/prisma";
import { recordTimelineEvent } from "@/modules/timeline/application/recordTimelineEvent";
import {
  CHECKOUT_PLAN_CONFIG,
  type BillingCheckoutPlan,
} from "@/modules/billing/domain/checkout";
import {
  addBillingMonths,
  type NormalizedBillingWebhook,
} from "@/modules/billing/domain/webhook";

type ProcessBillingWebhookResult = {
  status: "processed" | "ignored" | "duplicate";
  paymentId?: string | null;
  subscriptionId?: string | null;
  message: string;
};

function readMetadataPlan(metadata: string | null | undefined): BillingCheckoutPlan | null {
  if (!metadata) return null;

  try {
    const parsed = JSON.parse(metadata) as { plan?: string };
    const plan = parsed.plan?.toUpperCase().trim();

    if (plan === "PERSONAL" || plan === "PROFESIONAL" || plan === "EMPRESA") {
      return plan;
    }
  } catch {
    return null;
  }

  return null;
}

async function findPayment(event: NormalizedBillingWebhook) {
  if (event.paymentId) {
    const payment = await prisma.billingPayment.findUnique({ where: { id: event.paymentId } });
    if (payment) return payment;
  }

  if (event.providerPaymentId) {
    const payment = await prisma.billingPayment.findFirst({
      where: {
        provider: event.provider,
        providerPaymentId: event.providerPaymentId,
      },
      orderBy: { createdAt: "desc" },
    });
    if (payment) return payment;
  }

  if (event.checkoutId) {
    const payment = await prisma.billingPayment.findFirst({
      where: {
        provider: event.provider,
        checkoutId: event.checkoutId,
      },
      orderBy: { createdAt: "desc" },
    });
    if (payment) return payment;
  }

  return null;
}

export async function processBillingWebhook(
  event: NormalizedBillingWebhook,
): Promise<ProcessBillingWebhookResult> {
  const payment = await findPayment(event);

  if (!payment) {
    return {
      status: "ignored",
      paymentId: event.paymentId,
      message: "No se encontró un pago asociado al webhook.",
    };
  }

  if (event.eventType === "payment_failed") {
    const updatedPayment = await prisma.billingPayment.update({
      where: { id: payment.id },
      data: {
        status: "FAILED",
        providerPaymentId: event.providerPaymentId ?? payment.providerPaymentId,
        checkoutId: event.checkoutId ?? payment.checkoutId,
        failedAt: new Date(),
        metadata: JSON.stringify({
          previousMetadata: payment.metadata,
          webhookVersion: "4.2.10",
          eventType: event.eventType,
          providerEventId: event.providerEventId,
        }),
      },
    });

    return {
      status: "processed",
      paymentId: updatedPayment.id,
      message: "Pago marcado como fallido.",
    };
  }

  if (event.eventType === "subscription_cancelled") {
    await prisma.billingSubscription.updateMany({
      where: {
        userId: payment.userId,
        provider: event.provider,
        status: "ACTIVE",
      },
      data: {
        status: "CANCELLED",
        canceledAt: new Date(),
      },
    });

    return {
      status: "processed",
      paymentId: payment.id,
      message: "Suscripción cancelada.",
    };
  }

  if (payment.status === "PAID") {
    return {
      status: "duplicate",
      paymentId: payment.id,
      subscriptionId: payment.subscriptionId,
      message: "El pago ya estaba confirmado.",
    };
  }

  const plan = event.plan ?? readMetadataPlan(payment.metadata);

  if (!plan) {
    return {
      status: "ignored",
      paymentId: payment.id,
      message: "No se pudo resolver el plan asociado al pago.",
    };
  }

  const config = CHECKOUT_PLAN_CONFIG[plan];
  const periodStart = event.paidAt ?? new Date();
  const periodEnd = addBillingMonths(periodStart, config.interval === "ANNUAL" ? 12 : 1);

  const subscription = await prisma.billingSubscription.create({
    data: {
      userId: payment.userId,
      customerId: payment.customerId,
      provider: event.provider,
      providerSubscriptionId: event.checkoutId ?? event.providerPaymentId,
      plan: config.targetSubscriptionPlan,
      status: "ACTIVE",
      currency: config.currency,
      amount: config.amount,
      interval: config.interval,
      currentPeriodStart: periodStart,
      currentPeriodEnd: periodEnd,
      metadata: JSON.stringify({
        webhookVersion: "4.2.10",
        sourcePaymentId: payment.id,
        checkoutPlan: plan,
        providerEventId: event.providerEventId,
      }),
    },
  });

  const updatedPayment = await prisma.billingPayment.update({
    where: { id: payment.id },
    data: {
      subscriptionId: subscription.id,
      provider: event.provider,
      providerPaymentId: event.providerPaymentId ?? payment.providerPaymentId,
      checkoutId: event.checkoutId ?? payment.checkoutId,
      status: "PAID",
      paidAt: periodStart,
      metadata: JSON.stringify({
        previousMetadata: payment.metadata,
        webhookVersion: "4.2.10",
        eventType: event.eventType,
        providerEventId: event.providerEventId,
        activatedSubscriptionId: subscription.id,
      }),
    },
  });

  await prisma.users.update({
    where: { id: payment.userId },
    data: {
      subscription_plan: config.targetSubscriptionPlan,
      subscription_expires_at: periodEnd,
      activatedAt: periodStart,
      activationSource: `billing:${event.provider}`,
    },
  });

  console.info("[commercial]", {
    event: "upgrade_completed",
    userId: payment.userId,
    paymentId: updatedPayment.id,
    subscriptionId: subscription.id,
    plan,
    targetSubscriptionPlan: config.targetSubscriptionPlan,
    provider: event.provider,
    occurredAt: new Date().toISOString(),
  });

  await recordTimelineEvent({
    userId: payment.userId,
    category: "BILLING",
    severity: "SUCCESS",
    title: "Pago confirmado",
    description: `Tu pago fue confirmado y se activó el plan ${config.targetSubscriptionPlan}.`,
    entityType: "BillingSubscription",
    entityId: subscription.id,
    metadata: { plan, targetSubscriptionPlan: config.targetSubscriptionPlan, paymentId: updatedPayment.id },
  });

  return {
    status: "processed",
    paymentId: updatedPayment.id,
    subscriptionId: subscription.id,
    message: "Pago confirmado y suscripción activada.",
  };
}
