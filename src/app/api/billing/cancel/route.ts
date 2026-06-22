// src/app/api/billing/cancel/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/modules/identity/application/sessionToken";
import { cancelSubscription } from "@/modules/billing/application/cancelSubscription";

export async function POST(request: NextRequest) {
  try {
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
