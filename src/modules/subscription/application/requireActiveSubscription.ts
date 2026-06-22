import { NextResponse } from "next/server";

import { resolveSubscriptionState } from "./resolveSubscriptionState";

type UserWithSubscription = {
  id: string;
  role?: string | null;
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

export function requireActiveSubscription(
  user: UserWithSubscription,
): SubscriptionCheckResult {
  const subscription = resolveSubscriptionState(user);

  if (!subscription.isBlocked) {
    return { ok: true };
  }

  return {
    ok: false,
    response: NextResponse.json(
      {
        ok: false,
        message:
          subscription.state === "EXPIRED"
            ? "Tu suscripción está vencida. Actualiza tu plan para continuar."
            : "Tu suscripción no está activa. Actualiza tu plan para continuar.",
        data: {
          code:
            subscription.state === "EXPIRED"
              ? "SUBSCRIPTION_EXPIRED"
              : "SUBSCRIPTION_INACTIVE",
          subscription,
        },
      },
      { status: 402 },
    ),
  };
}