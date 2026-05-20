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

import {
  resolveSubscriptionStatusFromPayment,
} from "@/modules/billing/domain/billing";

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

function resolveUserSubscriptionStatus(
  status: BillingPaymentStatus,
): string {
  if (
    status === "APPROVED" ||
    status === "AUTHORIZED"
  ) {
    return "active";
  }

  if (
    status === "REJECTED" ||
    status === "CANCELED" ||
    status === "FAILED"
  ) {
    return "payment_failed";
  }

  return "pending";
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

  const paidAt =
    input.status === "APPROVED" ||
    input.status === "AUTHORIZED"
      ? new Date()
      : null;

  const failedAt =
    input.status === "REJECTED" ||
    input.status === "CANCELED" ||
    input.status === "FAILED"
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

  if (paidAt) {
    await prisma.users.update({
      where: {
        id: payment.userId,
      },
      data: {
        subscription_plan:
          payment.description.includes("Empresa")
            ? ("EMPRESA" satisfies BillingPlan)
            : ("PROFESIONAL" satisfies BillingPlan),
        subscription_status:
          resolveUserSubscriptionStatus(input.status),
        subscription_expires_at:
          calculateCurrentPeriodEnd(),
        updated_at: new Date(),
      },
    });
  }

  if (failedAt) {
    await prisma.users.update({
      where: {
        id: payment.userId,
      },
      data: {
        subscription_status:
          resolveUserSubscriptionStatus(input.status),
        updated_at: new Date(),
      },
    });
  }

  return updatedPayment;
}