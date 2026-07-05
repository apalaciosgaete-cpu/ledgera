// src/app/api/billing/downgrade/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/modules/identity/application/sessionToken";
import { cancelSubscription } from "@/modules/billing/application/cancelSubscription";


// Force dynamic rendering because routes use request.headers/cookies
export const dynamic = 'force-dynamic';
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
      mode: "downgrade_now",
    });

    return NextResponse.json({
      ok: true,
      message: result.message,
      data: result,
    });
  } catch (error) {
    console.error("[billing/downgrade POST]", error);

    return NextResponse.json(
      { ok: false, message: "No fue posible volver al plan Free.", data: null },
      { status: 500 },
    );
  }
}
