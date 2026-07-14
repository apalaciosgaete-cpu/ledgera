// src/app/api/billing/cancel/route.ts

import { NextRequest, NextResponse } from "next/server";

import { cancelSubscription } from "@/modules/billing/application/cancelSubscription";
import {
  BILLING_UNAVAILABLE_MESSAGE,
  isLiveBillingEnabled,
} from "@/modules/billing/domain/billingAvailability";
import { getSessionFromRequest } from "@/modules/identity/application/sessionToken";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    if (!isLiveBillingEnabled()) {
      return NextResponse.json(
        { ok: false, message: BILLING_UNAVAILABLE_MESSAGE, data: null },
        { status: 503 },
      );
    }

    const auth = await getSessionFromRequest(request);

    if (!auth) {
      return NextResponse.json(
        { ok: false, message: "No autorizado.", data: null },
        { status: 401 },
      );
    }

    const result = await cancelSubscription({
      userId: auth.user.id,
      mode: "cancel_at_period_end",
    });

    return NextResponse.json({
      ok: true,
      message: result.message,
      data: result,
    });
  } catch (error) {
    console.error("[billing/cancel POST]", error);

    return NextResponse.json(
      { ok: false, message: "No fue posible cancelar la renovación.", data: null },
      { status: 500 },
    );
  }
}
