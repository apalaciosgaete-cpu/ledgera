// src/modules/billing/application/changePlan.ts
// CAPA 4.3.01 — Cambio de plan desde el portal del usuario.

import { prisma } from "@/lib/prisma";

import { createPendingPayment } from "@/modules/billing/application/createPendingPayment";
import type {
  BillingPayment,
  BillingPlan,
} from "@/modules/billing/domain/billing";
import {
  buildCheckoutReturnUrl,
  resolveBillingProvider,
} from "@/modules/billing/domain/checkout";
import {
  getLatestBillingSubscriptionByUserId,
  updateBillingSubscription,
} from "@/modules/billing/infrastructure/billingRepository";
import { recordTimelineEvent } from "@/modules/timeline/application/recordTimelineEvent";

export type ChangePlanInput = {
  userId: string;
  targetPlan: BillingPlan;
  provider?: string;
};

export type ChangePlanResult =
  | {
      type: "immediate";
      plan: BillingPlan;
      subscriptionId: string | null;
      message: string;
    }
  | {
      type: "payment_required";
      payment: BillingPayment;
      plan: BillingPlan;
      url: string;
      message: string;
    };

const PLAN_RANK: Record<BillingPlan, number> = {
  BASICO: 0,
  PERSONAL: 1,
  PROFESIONAL: 2,
  EMPRESA: 3,
};

export function isUpgrade(
  currentPlan: BillingPlan,
  targetPlan: BillingPlan,
): boolean {
  return PLAN_RANK[targetPlan] > PLAN_RANK[currentPlan];
}

export function isDowngrade(
  currentPlan: BillingPlan,
  targetPlan: BillingPlan,
): boolean {
  return PLAN_RANK[targetPlan] < PLAN_RANK[currentPlan];
}

function resolveCurrentPlan(userPlan: string | null | undefined): BillingPlan {
  const plan = userPlan ?? "BASICO";

  if (
    plan === "BASICO" ||
    plan === "PERSONAL" ||
    plan === "PROFESIONAL" ||
    plan === "EMPRESA"
  ) {
    return plan;
  }

  return "BASICO";
}

/**
 * Inicia un cambio de plan para el usuario autenticado.
 *
 * Reglas:
 * - Si el plan destino es BASICO (Free), se aplica inmediatamente sin pago
 *   y se cancela la suscripción activa si existe.
 * - Si el plan destino es igual al actual, se rechaza.
 * - Si es upgrade o cambio lateral/downgrade pagado, se cancela la suscripción
 *   activa anterior y se crea un pago PENDING. El cambio se efectúa al confirmar
 *   el pago vía webhook o placeholder.
 */
export async function changePlan(
  input: ChangePlanInput,
): Promise<ChangePlanResult> {
  const provider = resolveBillingProvider(input.provider);
  const user = await prisma.users.findUnique({
    where: { id: input.userId },
    select: {
      id: true,
      subscription_plan: true,
    },
  });

  if (!user) {
    throw new Error("Usuario no encontrado.");
  }

  const currentPlan = resolveCurrentPlan(user.subscription_plan);

  if (currentPlan === input.targetPlan) {
    throw new Error("Ya estás suscrito a este plan.");
  }

  const origin =
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const latestSubscription =
    await getLatestBillingSubscriptionByUserId(input.userId);

  // Downgrade a plan gratuito: aplicar inmediatamente.
  if (input.targetPlan === "BASICO") {
    const now = new Date();

    if (
      latestSubscription &&
      (latestSubscription.status === "ACTIVE" ||
        latestSubscription.status === "CANCEL_AT_PERIOD_END")
    ) {
      await updateBillingSubscription({
        id: latestSubscription.id,
        status: "CANCELLED",
        canceledAt: now,
        currentPeriodEnd: now,
        metadata: JSON.stringify({
          previousMetadata: latestSubscription.metadata,
          source: "changePlan",
          reason: "downgrade_to_basic",
        }),
      });
    }

    await prisma.users.update({
      where: { id: input.userId },
      data: {
        subscription_plan: "BASICO",
        subscription_expires_at: now,
        activationSource: "billing:change_plan:downgrade",
        updated_at: now,
      },
      select: { id: true },
    });

    await recordTimelineEvent({
      userId: input.userId,
      category: "BILLING",
      severity: "INFO",
      title: "Plan cambiado",
      description: `Tu plan fue cambiado a Free.`,
      entityType: "BillingSubscription",
      entityId: latestSubscription?.id ?? null,
      metadata: { previousPlan: currentPlan, newPlan: "BASICO" },
    });

    return {
      type: "immediate",
      plan: "BASICO",
      subscriptionId: latestSubscription?.id ?? null,
      message: "Plan cambiado a Free. El acceso se ajustará inmediatamente.",
    };
  }

  // Upgrade o cambio entre planes pagados: requiere pago.
  if (
    latestSubscription &&
    (latestSubscription.status === "ACTIVE" ||
      latestSubscription.status === "CANCEL_AT_PERIOD_END")
  ) {
    await updateBillingSubscription({
      id: latestSubscription.id,
      status: "CANCELLED",
      canceledAt: new Date(),
      metadata: JSON.stringify({
        previousMetadata: latestSubscription.metadata,
        source: "changePlan",
        reason: isUpgrade(currentPlan, input.targetPlan)
          ? "upgrade"
          : "downgrade",
        targetPlan: input.targetPlan,
      }),
    });
  }

  const payment = await createPendingPayment({
    userId: input.userId,
    provider,
    plan: input.targetPlan,
    description: `Cambio de plan ${currentPlan} → ${input.targetPlan}`,
    metadata: {
      source: "changePlan",
      previousPlan: currentPlan,
      targetPlan: input.targetPlan,
      isUpgrade: isUpgrade(currentPlan, input.targetPlan),
      isDowngrade: isDowngrade(currentPlan, input.targetPlan),
      provider,
    },
  });

  return {
    type: "payment_required",
    payment,
    plan: input.targetPlan,
    url: buildCheckoutReturnUrl({
      origin,
      paymentId: payment.id,
      status: "pending",
    }),
    message:
      "Cambio de plan preparado. Completa el pago para activar tu nuevo plan.",
  };
}
