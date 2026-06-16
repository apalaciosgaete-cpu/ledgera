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
import { recordAuditEvent } from "@/modules/audit/application/recordAuditEvent";
import { recordTimelineEvent } from "@/modules/timeline/application/recordTimelineEvent";

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

function parseMetadata(
  metadata: string | null,
): Record<string, unknown> | null {
  if (!metadata) return null;

  try {
    return JSON.parse(metadata) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function resolvePlanFromPayment(
  payment: {
    description: string;
    metadata: string | null;
  },
): BillingPlan {
  const metadata = parseMetadata(payment.metadata);
  const previousMetadata =
    typeof metadata?.previousMetadata === "string"
      ? parseMetadata(metadata.previousMetadata)
      : null;

  const metadataPlan =
    metadata?.plan ??
    metadata?.targetPlan ??
    previousMetadata?.plan ??
    previousMetadata?.targetPlan;

  if (
    metadataPlan === "BASICO" ||
    metadataPlan === "PERSONAL" ||
    metadataPlan === "PROFESIONAL" ||
    metadataPlan === "EMPRESA"
  ) {
    return metadataPlan;
  }

  const normalizedDescription = payment.description.toLowerCase();

  if (normalizedDescription.includes("empresa")) {
    return "EMPRESA";
  }

  if (normalizedDescription.includes("profesional")) {
    return "PROFESIONAL";
  }

  if (normalizedDescription.includes("personal")) {
    return "PERSONAL";
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
        subscription_plan: resolvePlanFromPayment(payment),
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

  await recordAuditEvent({
    userId: payment.userId,
    category: "BILLING",
    severity: paymentSucceeded ? "INFO" : "WARNING",
    event: "subscription_created",
    description: paymentSucceeded
      ? "Suscripción activada desde pago"
      : "Intento de activación de suscripción fallido",
    result: paymentSucceeded ? "SUCCESS" : "FAILED",
    entityType: "BillingPayment",
    entityId: payment.id,
    metadata: {
      paymentId: payment.id,
      providerPaymentId: input.providerPaymentId,
      status: input.status,
    },
  });

  if (paymentSucceeded) {
    const plan = resolvePlanFromPayment(payment);
    await recordTimelineEvent({
      userId: payment.userId,
      category: "BILLING",
      severity: "SUCCESS",
      title: "Suscripción creada",
      description: `Tu suscripción al plan ${plan} fue activada correctamente.`,
      entityType: "BillingSubscription",
      entityId: payment.subscriptionId ?? payment.id,
      metadata: { plan, paymentId: payment.id },
    });
  }

  return updatedPayment;
}