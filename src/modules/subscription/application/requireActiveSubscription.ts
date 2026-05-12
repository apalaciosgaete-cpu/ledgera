import { NextResponse } from "next/server";

type SessionUser = {
  id: string;
  email: string;
  role?: string;
};

type UserWithSubscription = {
  id: string;
  role: string;
  subscriptionPlan: string | null;
  subscriptionExpiresAt: Date | string | null;
};

type SubscriptionCheckResult =
  | {
      ok: true;
    }
  | {
      ok: false;
      response: NextResponse;
    };

function isSubscriptionActive(user: UserWithSubscription): boolean {
  if (user.role === "admin") {
    return true;
  }

  if (!user.subscriptionExpiresAt) {
    return false;
  }

  return new Date(user.subscriptionExpiresAt).getTime() > Date.now();
}

export function requireActiveSubscription(
  user: UserWithSubscription | SessionUser,
): SubscriptionCheckResult {
  if (user.role === "admin") {
    return { ok: true };
  }

  const maybeUser = user as UserWithSubscription;

  if (!isSubscriptionActive(maybeUser)) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          ok: false,
          message:
            "Tu suscripción no está activa. Actualiza tu plan para continuar.",
          data: {
            code: "SUBSCRIPTION_INACTIVE",
          },
        },
        { status: 402 },
      ),
    };
  }

  return { ok: true };
}