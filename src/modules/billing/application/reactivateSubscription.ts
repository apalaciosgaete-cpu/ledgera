// src/modules/billing/application/reactivateSubscription.ts

import { prisma } from "@/lib/prisma";

type ReactivateSubscriptionResult = {
  status: "reactivated" | "ignored";
  subscriptionId: string | null;
  message: string;
};

export async function reactivateSubscription(userId: string): Promise<ReactivateSubscriptionResult> {
  const subscription = await prisma.billingSubscription.findFirst({
    where: {
      userId,
      status: "CANCEL_AT_PERIOD_END",
    },
    orderBy: { currentPeriodEnd: "desc" },
  });

  if (!subscription) {
    return {
      status: "ignored",
      subscriptionId: null,
      message: "No existe una cancelación pendiente para reactivar.",
    };
  }

  const updated = await prisma.billingSubscription.update({
    where: { id: subscription.id },
    data: {
      status: "ACTIVE",
      canceledAt: null,
      metadata: JSON.stringify({
        previousMetadata: subscription.metadata,
        portalVersion: "4.3.01",
        action: "reactivate",
      }),
    },
  });

  console.info("[commercial]", {
    event: "subscription_reactivated",
    userId,
    subscriptionId: updated.id,
    occurredAt: new Date().toISOString(),
  });

  return {
    status: "reactivated",
    subscriptionId: updated.id,
    message: "Suscripción reactivada. La renovación vuelve a estar activa.",
  };
}
