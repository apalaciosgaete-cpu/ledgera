// src/app/api/billing/change-plan/route.ts
// CAPA 4.3.01 — Cambio de plan desde el portal.

import { NextRequest, NextResponse } from "next/server";

import { getSessionFromRequest } from "@/modules/identity/application/sessionToken";
import { changePlan } from "@/modules/billing/application/changePlan";
import { isValidBillingPlan } from "@/modules/billing/application/billingPlans";

type ChangePlanRequestBody = {
  plan?: string;
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

    const body = (await request.json()) as ChangePlanRequestBody;
    const plan = body.plan;

    if (!isValidBillingPlan(plan)) {
      return NextResponse.json(
        { ok: false, message: "Plan inválido.", data: null },
        { status: 400 },
      );
    }

    console.info("[commercial]", {
      event: "change_plan_started",
      userId: auth.user.id,
      plan,
      provider: body.provider,
      source: "billing_change_plan",
      occurredAt: new Date().toISOString(),
    });

    const result = await changePlan({
      userId: auth.user.id,
      targetPlan: plan,
      provider: body.provider,
    });

    if (result.type === "immediate") {
      return NextResponse.json({
        ok: true,
        message: result.message,
        data: {
          type: result.type,
          plan: result.plan,
          subscriptionId: result.subscriptionId,
        },
      });
    }

    return NextResponse.json({
      ok: true,
      message: result.message,
      data: {
        type: result.type,
        paymentId: result.payment.id,
        checkoutId: result.payment.checkoutId,
        url: result.url,
        plan: result.plan,
      },
    });
  } catch (error) {
    console.error("[billing/change-plan POST]", error);

    const message =
      error instanceof Error ? error.message : "Error al cambiar de plan.";

    return NextResponse.json(
      { ok: false, message, data: null },
      { status: 500 },
    );
  }
}
