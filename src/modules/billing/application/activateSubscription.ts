import { prisma } from "@/lib/prisma";

import type {
  BillingPaymentStatus,
  BillingPlan,
} from "@/modules/billing/domain/billing";

import {
  getBillingPaymentById,
  updateBillingPayment,
  updateBillingSubscription,
} from "@/modules/billing/infrastructure/billingRepository";

import { resolveSubscriptionStatusFromPayment } from "@/modules/billing/domain/billing";

type ActivateSubscriptionInput = {
  paymentId: string;
  providerPaymentId?: string | null;
  status: BillingPaymentStatus;
  metadata?: Record<string, unknown>;
};

function serializeMetadata(
  metadata?: Record<string, unknown>,
): string | null {
  if (!metadata) return null;

  return JSON.stringify(metadata);
}

function calculateCurrentPeriodEnd(): Date {
  const end = new Date();
  end.setMonth(end.getMonth() + 1);
  return end;
}

function isSuccessfulPayment(
  status: BillingPaymentStatus,
): boolean {
  return (
    status === "APPROVED" ||
    status === "AUTHORIZED"
  );
}

function isFailedPayment(
  status: BillingPaymentStatus,
): boolean {
  return (
    status === "REJECTED" ||
    status === "CANCELED" ||
    status === "FAILED"
  );
}

function resolvePlanFromPaymentDescription(
  description: string,
): BillingPlan {
  const normalizedDescription =
    description.toLowerCase();

  if (
    normalizedDescription.includes("empresa")
  ) {
    return "EMPRESA";
  }

  if (
    normalizedDescription.includes("profesional")
  ) {
    return "PROFESIONAL";
  }

  return "PROFESIONAL";
}

export async function activateSubscriptionFromPayment(
  input: ActivateSubscriptionInput,
) {
  const payment = await getBillingPaymentById(
    input.paymentId,
  );

  if (!payment) {
    throw new Error(
      "Pago no encontrado para activar suscripción.",
    );
  }

  const paymentSucceeded =
    isSuccessfulPayment(input.status);

  const paymentFailed =
    isFailedPayment(input.status);

  const paidAt = paymentSucceeded
    ? new Date()
    : null;

  const failedAt = paymentFailed
    ? new Date()
    : null;

  const updatedPayment =
    await updateBillingPayment({
      id: payment.id,
      providerPaymentId:
        input.providerPaymentId ??
        payment.providerPaymentId,
      status: input.status,
      paidAt,
      failedAt,
      metadata: serializeMetadata({
        previousMetadata: payment.metadata,
        source: "activateSubscriptionFromPayment",
        ...input.metadata,
      }),
    });

  if (payment.subscriptionId) {
    await updateBillingSubscription({
      id: payment.subscriptionId,
      status: resolveSubscriptionStatusFromPayment(
        input.status,
      ),
      currentPeriodStart: paidAt,
      currentPeriodEnd: paidAt
        ? calculateCurrentPeriodEnd()
        : null,
      metadata: serializeMetadata({
        source: "activateSubscriptionFromPayment",
        paymentId: payment.id,
        providerPaymentId:
          input.providerPaymentId ??
          payment.providerPaymentId,
      }),
    });
  }

  if (paymentSucceeded) {
    await prisma.users.update({
      where: {
        id: payment.userId,
      },
      data: {
        subscription_plan:
          resolvePlanFromPaymentDescription(
            payment.description,
          ),
        subscription_expires_at:
          calculateCurrentPeriodEnd(),
        updated_at: new Date(),
      },
    });
  }

  if (paymentFailed) {
    await prisma.users.update({
      where: {
        id: payment.userId,
      },
      data: {
        updated_at: new Date(),
      },
    });
  }

  return updatedPayment;
}