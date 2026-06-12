// src/modules/billing/application/reactivateSubscription.ts
// CAPA 4.3.01 — Reactivación de suscripción desde el portal.

import { prisma } from "@/lib/prisma";

import { createPendingPayment } from "@/modules/billing/application/createPendingPayment";
import type { BillingPlan } from "@/modules/billing/domain/billing";
import {
  getLatestBillingSubscriptionByUserId,
  updateBillingSubscription,
} from "@/modules/billing/infrastructure/billingRepository";
import {
  buildCheckoutReturnUrl,
  resolveBillingProvider,
} from "@/modules/billing/domain/checkout";

export type ReactivateSubscriptionInput = {
  userId: string;
  provider?: string;
};

export type ReactivateSubscriptionResult = {
  status: "reactivated" | "payment_required" | "ignored";
  subscriptionId: string | null;
  paymentId?: string | null;
  url?: string | null;
  message: string;
};

const REACTIVATABLE_STATUSES = [
  "CANCELLED",
  "EXPIRED",
  "FAILED",
  "PAST_DUE",
] as const;

function isReactivatableStatus(status: string): boolean {
  return REACTIVATABLE_STATUSES.includes(
    status as (typeof REACTIVATABLE_STATUSES)[number],
  );
}

function resolveReactivationPlan(
  subscriptionPlan: string | null | undefined,
  userPlan: string | null | undefined,
): BillingPlan {
  const candidate = subscriptionPlan ?? userPlan ?? "BASICO";

  if (
    candidate === "BASICO" ||
    candidate === "PERSONAL" ||
    candidate === "PROFESIONAL" ||
    candidate === "EMPRESA"
  ) {
    return candidate;
  }

  return "PERSONAL";
}

/**
 * Reactiva la suscripción del usuario.
 *
 * Casos:
 * - Si hay una suscripción ACTIVE no vencida, se ignora.
 * - Si hay una suscripción en CANCEL_AT_PERIOD_END, vuelve a ACTIVE inmediatamente.
 * - Si hay una suscripción CANCELLED/EXPIRED/FAILED/PAST_DUE, se crea un pago
 *   pendiente para reactivarla (flujo de pago).
 * - Si no hay suscripción pero el usuario tenía un plan pago vencido, se crea
 *   un pago pendiente para reactivar el plan.
 */
export async function reactivateSubscription(
  input: ReactivateSubscriptionInput,
): Promise<ReactivateSubscriptionResult> {
  const provider = resolveBillingProvider(input.provider);
  const user = await prisma.users.findUnique({
    where: { id: input.userId },
  });

  if (!user) {
    return {
      status: "ignored",
      subscriptionId: null,
      message: "Usuario no encontrado.",
    };
  }

  const activeSubscription = await prisma.billingSubscription.findFirst({
    where: {
      userId: input.userId,
      status: "ACTIVE",
      currentPeriodEnd: { gt: new Date() },
    },
    orderBy: { currentPeriodEnd: "desc" },
  });

  if (activeSubscription) {
    return {
      status: "ignored",
      subscriptionId: activeSubscription.id,
      message: "La suscripción ya está activa.",
    };
  }

  const cancelAtPeriodEnd = await prisma.billingSubscription.findFirst({
    where: {
      userId: input.userId,
      status: "CANCEL_AT_PERIOD_END",
    },
    orderBy: { currentPeriodEnd: "desc" },
  });

  if (cancelAtPeriodEnd) {
    const updated = await updateBillingSubscription({
      id: cancelAtPeriodEnd.id,
      status: "ACTIVE",
      canceledAt: null,
      metadata: JSON.stringify({
        previousMetadata: cancelAtPeriodEnd.metadata,
        portalVersion: "4.3.01",
        action: "reactivate",
      }),
    });

    console.info("[commercial]", {
      event: "subscription_reactivated",
      userId: input.userId,
      subscriptionId: updated.id,
      occurredAt: new Date().toISOString(),
    });

    return {
      status: "reactivated",
      subscriptionId: updated.id,
      message: "Suscripción reactivada. La renovación vuelve a estar activa.",
    };
  }

  const latestSubscription =
    await getLatestBillingSubscriptionByUserId(input.userId);

  if (
    latestSubscription &&
    !isReactivatableStatus(latestSubscription.status)
  ) {
    return {
      status: "ignored",
      subscriptionId: latestSubscription.id,
      message: "No existe una suscripción que se pueda reactivar.",
    };
  }

  const plan = resolveReactivationPlan(
    latestSubscription?.plan,
    user.subscription_plan,
  );

  if (latestSubscription) {
    await updateBillingSubscription({
      id: latestSubscription.id,
      status: "CANCELLED",
      canceledAt: new Date(),
      metadata: JSON.stringify({
        previousMetadata: latestSubscription.metadata,
        portalVersion: "4.3.01",
        action: "reactivate_marked_cancelled",
      }),
    });
  }

  const payment = await createPendingPayment({
    userId: input.userId,
    provider,
    plan,
    description: `Reactivación suscripción ${plan}`,
    metadata: {
      source: "reactivateSubscription",
      previousSubscriptionId: latestSubscription?.id ?? null,
      previousStatus: latestSubscription?.status ?? null,
      plan,
      provider,
    },
  });

  const origin =
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  return {
    status: "payment_required",
    subscriptionId: latestSubscription?.id ?? null,
    paymentId: payment.id,
    url: buildCheckoutReturnUrl({
      origin,
      paymentId: payment.id,
      status: "pending",
    }),
    message:
      "Reactivación preparada. Completa el pago para activar tu plan.",
  };
}
