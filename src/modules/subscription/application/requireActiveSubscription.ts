import { NextResponse } from "next/server";

import { resolveSubscriptionState } from "./resolveSubscriptionState";

type UserWithSubscription = {
  id: string;
  role?: string | null;
  status?: string | null;
  subscriptionPlan?: string | null;
  subscriptionExpiresAt?: Date | string | null;
};

type SubscriptionCheckResult =
  | {
      ok: true;
    }
  | {
      ok: false;
      response: NextResponse;
    };

/**
 * Guards operations that modify data or generate paid artifacts.
 *
 * Expired subscriptions keep authenticated read access, but writes and paid
 * exports must call this guard and are rejected with READ_ONLY mode.
 */
export function requireActiveSubscription(
  user: UserWithSubscription,
): SubscriptionCheckResult {
  const subscription = resolveSubscriptionState(user);

  if (!subscription.isBlocked) {
    return { ok: true };
  }

  const isExpired = subscription.state === "EXPIRED";
  const isSuspended = subscription.state === "SUSPENDED";

  return {
    ok: false,
    response: NextResponse.json(
      {
        ok: false,
        message: isExpired
          ? "Tu suscripción está vencida. Puedes consultar tu información, pero no modificarla ni generar nuevas exportaciones hasta reactivar el plan."
          : isSuspended
            ? "Tu cuenta está suspendida. Contacta a soporte para revisar el acceso."
            : "Tu suscripción no está activa. Actualiza tu plan para continuar.",
        data: {
          code: isExpired
            ? "SUBSCRIPTION_READ_ONLY"
            : isSuspended
              ? "ACCOUNT_SUSPENDED"
              : "SUBSCRIPTION_INACTIVE",
          accessMode: isExpired ? "READ_ONLY" : "BLOCKED",
          subscription,
        },
      },
      { status: isSuspended ? 403 : 402 },
    ),
  };
}
