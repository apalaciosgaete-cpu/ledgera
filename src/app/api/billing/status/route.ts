import { NextRequest, NextResponse } from "next/server";

import { getSessionFromRequest } from "@/modules/identity/application/sessionToken";
import {
  getLatestBillingSubscriptionByUserId,
  listBillingPaymentsByUserId,
} from "@/modules/billing/infrastructure/billingRepository";

function isActiveSubscription(input: {
  status: string;
  currentPeriodEnd: Date | null;
}): boolean {
  if (input.status !== "ACTIVE") {
    return false;
  }

  if (!input.currentPeriodEnd) {
    return true;
  }

  return input.currentPeriodEnd > new Date();
}

export async function GET(request: NextRequest) {
  try {
    const auth = await getSessionFromRequest(request);

    if (!auth) {
      return NextResponse.json(
        {
          ok: false,
          message: "No autorizado.",
          data: null,
        },
        { status: 401 },
      );
    }

    const subscription =
      await getLatestBillingSubscriptionByUserId(auth.user.id);

    const payments =
      await listBillingPaymentsByUserId(auth.user.id);

    const latestPayment = payments[0] ?? null;

    return NextResponse.json({
      ok: true,
      message: "Estado billing obtenido correctamente.",
      data: {
        user: {
          id: auth.user.id,
          email: auth.user.email,
          role: auth.user.role,
          status: auth.user.status,
          subscriptionPlan: auth.user.subscriptionPlan,
          subscriptionExpiresAt: auth.user.subscriptionExpiresAt,
        },
        subscription,
        latestPayment,
        isActive:
          subscription !== null
            ? isActiveSubscription({
                status: subscription.status,
                currentPeriodEnd: subscription.currentPeriodEnd,
              })
            : false,
      },
    });
  } catch (error) {
    console.error("[billing/status]", error);

    return NextResponse.json(
      {
        ok: false,
        message: "No fue posible obtener el estado de billing.",
        data: null,
      },
      { status: 500 },
    );
  }
}
