// src/modules/billing/application/cancelSubscription.ts

import { prisma } from "@/lib/prisma";
import { recordAuditEvent } from "@/modules/audit/application/recordAuditEvent";

export type CancelSubscriptionMode = "cancel_at_period_end" | "downgrade_now";

type CancelSubscriptionResult = {
  status: "cancel_at_period_end" | "downgraded";
  subscriptionId: string | null;
  currentPeriodEnd: string | null;
  message: string;
};

function toIso(value: Date | null | undefined) {
  return value ? value.toISOString() : null;
}

export async function cancelSubscription(input: {
  userId: string;
  mode: CancelSubscriptionMode;
}): Promise<CancelSubscriptionResult> {
  const activeSubscription = await prisma.billingSubscription.findFirst({
    where: {
      userId: input.userId,
      status: "ACTIVE",
    },
    orderBy: { currentPeriodEnd: "desc" },
  });

  if (!activeSubscription) {
    return {
      status: "downgraded",
      subscriptionId: null,
      currentPeriodEnd: null,
      message: "No existe una suscripción activa para cancelar.",
    };
  }

  if (input.mode === "cancel_at_period_end") {
    const updated = await prisma.billingSubscription.update({
      where: { id: activeSubscription.id },
      data: {
        status: "CANCEL_AT_PERIOD_END",
        canceledAt: new Date(),
        metadata: JSON.stringify({
          previousMetadata: activeSubscription.metadata,
          cancellationVersion: "4.2.12",
          mode: input.mode,
        }),
      },
    });

    console.info("[commercial]", {
      event: "subscription_cancel_scheduled",
      userId: input.userId,
      subscriptionId: updated.id,
      currentPeriodEnd: updated.currentPeriodEnd?.toISOString() ?? null,
      occurredAt: new Date().toISOString(),
    });

    await recordAuditEvent({
      userId: input.userId,
      category: "BILLING",
      severity: "WARNING",
      event: "subscription_cancelled",
      description: "Cancelación de suscripción programada al final del período",
      result: "SUCCESS",
      entityType: "BillingSubscription",
      entityId: updated.id,
      metadata: { mode: input.mode, currentPeriodEnd: updated.currentPeriodEnd },
    });

    return {
      status: "cancel_at_period_end",
      subscriptionId: updated.id,
      currentPeriodEnd: toIso(updated.currentPeriodEnd),
      message: "La renovación fue cancelada. Mantendrás acceso hasta el vencimiento del período actual.",
    };
  }

  const now = new Date();
  const updated = await prisma.billingSubscription.update({
    where: { id: activeSubscription.id },
    data: {
      status: "CANCELLED",
      canceledAt: now,
      currentPeriodEnd: now,
      metadata: JSON.stringify({
        previousMetadata: activeSubscription.metadata,
        cancellationVersion: "4.2.12",
        mode: input.mode,
      }),
    },
  });

  await prisma.users.update({
    where: { id: input.userId },
    data: {
      subscription_plan: "BASICO",
      subscription_expires_at: now,
      activationSource: "billing:downgrade",
    },
    select: { id: true },
  });

  console.info("[commercial]", {
    event: "subscription_downgraded",
    userId: input.userId,
    subscriptionId: updated.id,
    targetPlan: "BASICO",
    occurredAt: new Date().toISOString(),
  });

  await recordAuditEvent({
    userId: input.userId,
    category: "BILLING",
    severity: "WARNING",
    event: "subscription_cancelled",
    description: "Suscripción cancelada y plan degradado a Free",
    result: "SUCCESS",
    entityType: "BillingSubscription",
    entityId: updated.id,
    metadata: { mode: input.mode, targetPlan: "BASICO" },
  });

  return {
    status: "downgraded",
    subscriptionId: updated.id,
    currentPeriodEnd: toIso(updated.currentPeriodEnd),
    message: "Tu suscripción fue cancelada y tu plan volvió a Free.",
  };
}
