// src/app/api/billing/reactivate/route.ts
// CAPA 4.3.01 — Reactivación de suscripción desde el portal.

import { NextRequest, NextResponse } from "next/server";

import { getSessionFromRequest } from "@/modules/identity/application/sessionToken";
import { reactivateSubscription } from "@/modules/billing/application/reactivateSubscription";


// Force dynamic rendering because routes use request.headers/cookies
export const dynamic = 'force-dynamic';
type ReactivateRequestBody = {
  provider?: string;
};

export async function POST(request: NextRequest) {
  try {
    const auth = await getSessionFromRequest(request);

    if (!auth) {
      return NextResponse.json(
        { ok: false, message: "No autorizado.", data: null },
        { status: 401 },
      );
    }

    const body = (await request.json()) as ReactivateRequestBody;

    console.info("[commercial]", {
      event: "subscription_reactivate_started",
      userId: auth.user.id,
      provider: body.provider,
      source: "billing_reactivate",
      occurredAt: new Date().toISOString(),
    });

    const result = await reactivateSubscription({
      userId: auth.user.id,
      provider: body.provider,
    });

    return NextResponse.json({
      ok:
        result.status === "reactivated" ||
        result.status === "payment_required",
      message: result.message,
      data: {
        status: result.status,
        subscriptionId: result.subscriptionId,
        paymentId: result.paymentId ?? null,
        url: result.url ?? null,
      },
    });
  } catch (error) {
    console.error("[billing/reactivate POST]", error);

    const message =
      error instanceof Error ? error.message : "Error al reactivar suscripción.";

    return NextResponse.json(
      { ok: false, message, data: null },
      { status: 500 },
    );
  }
}
