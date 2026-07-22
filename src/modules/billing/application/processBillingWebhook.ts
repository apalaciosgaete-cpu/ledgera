// src/modules/billing/application/processBillingWebhook.ts

import { prisma } from "@/lib/prisma";
import {
  getCheckoutPlanConfig,
  normalizeBillingInterval,
  normalizeCheckoutPlan,
  type BillingCheckoutPlan,
  type BillingInterval,
} from "@/modules/billing/domain/checkout";
import {
  addBillingMonths,
  type NormalizedBillingWebhook,
} from "@/modules/billing/domain/webhook";
import { recordTimelineEvent } from "@/modules/timeline/application/recordTimelineEvent";

type ProcessBillingWebhookResult = {
  status: "processed" | "ignored" | "duplicate";
  paymentId?: string | null;
  subscriptionId?: string | null;
  message: string;
};

type MetadataCheckout = {
  plan: BillingCheckoutPlan | null;
  interval: BillingInterval;
};

function parseMetadata(metadata: string | null | undefined): Record<string, unknown> | null {
  if (!metadata) return null;

  try {
    return JSON.parse(metadata) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function readMetadataCheckout(
  metadata: string | null | undefined,
): MetadataCheckout {
  let parsed = parseMetadata(metadata);
  let plan: BillingCheckoutPlan | null = null;
  let interval: BillingInterval = "MONTHLY";

  for (let depth = 0; parsed && depth < 6; depth += 1) {
    if (!plan && typeof parsed.plan === "string") {
      plan = normalizeCheckoutPlan(parsed.plan);
    }

    if (typeof parsed.interval === "string") {
      interval = normalizeBillingInterval(parsed.interval);
    }

    parsed =
      typeof parsed.previousMetadata === "string"
        ? parseMetadata(parsed.previousMetadata)
        : null;
  }

  return { plan, interval };
}

async function findPayment(event: NormalizedBillingWebhook) {
  if (event.paymentId) {
    const payment = await prisma.billingPayment.findUnique({
      where: { id: event.paymentId },
    });
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

  const metadataCheckout = readMetadataCheckout(payment.metadata);
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
          webhookVersion: "5.0.0",
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
    if (payment.subscriptionId) {
      await prisma.billingSubscription.updateMany({
        where: {
          id: payment.subscriptionId,
          userId: payment.userId,
        },
        data: {
          status: "CANCELLED",
          canceledAt: new Date(),
        },
      });
    } else {
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
    }

    return {
      status: "processed",
      paymentId: payment.id,
      subscriptionId: payment.subscriptionId,
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

  const plan = event.plan ?? metadataCheckout.plan;

  if (!plan) {
    return {
      status: "ignored",
      paymentId: payment.id,
      message: "No se pudo resolver el plan asociado al pago.",
    };
  }

  const config = getCheckoutPlanConfig(plan, metadataCheckout.interval);
  const periodStart = event.paidAt ?? new Date();
  const periodEnd = addBillingMonths(
    periodStart,
    config.interval === "ANNUAL" ? 12 : 1,
  );

  await prisma.billingSubscription.updateMany({
    where: {
      userId: payment.userId,
      status: "ACTIVE",
    },
    data: {
      status: "CANCELLED",
      canceledAt: periodStart,
      currentPeriodEnd: periodStart,
    },
  });

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
        webhookVersion: "5.0.0",
        sourcePaymentId: payment.id,
        checkoutPlan: plan,
        interval: config.interval,
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
        webhookVersion: "5.0.0",
        eventType: event.eventType,
        providerEventId: event.providerEventId,
        activatedSubscriptionId: subscription.id,
        plan,
        interval: config.interval,
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
    select: { id: true },
  });

  console.info("[commercial]", {
    event: "upgrade_completed",
    userId: payment.userId,
    paymentId: updatedPayment.id,
    subscriptionId: subscription.id,
    plan,
    interval: config.interval,
    targetSubscriptionPlan: config.targetSubscriptionPlan,
    provider: event.provider,
    occurredAt: new Date().toISOString(),
  });

  await recordTimelineEvent({
    userId: payment.userId,
    category: "BILLING",
    severity: "SUCCESS",
    title: "Pago confirmado",
    description: `Tu pago fue confirmado y se activó el plan ${config.label}.`,
    entityType: "BillingSubscription",
    entityId: subscription.id,
    metadata: {
      plan,
      interval: config.interval,
      targetSubscriptionPlan: config.targetSubscriptionPlan,
      paymentId: updatedPayment.id,
    },
  });

  return {
    status: "processed",
    paymentId: updatedPayment.id,
    subscriptionId: subscription.id,
    message: "Pago confirmado y suscripción activada.",
  };
}
