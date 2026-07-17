// src/app/api/billing/change-plan/route.ts
// Los cambios pagados se procesan exclusivamente por /api/billing/checkout.

import { NextRequest, NextResponse } from "next/server";

import { isValidBillingPlan } from "@/modules/billing/application/billingPlans";
import { changePlan } from "@/modules/billing/application/changePlan";
import {
  BILLING_UNAVAILABLE_MESSAGE,
  isLiveBillingEnabled,
} from "@/modules/billing/domain/billingAvailability";
import { getSessionFromRequest } from "@/modules/identity/application/sessionToken";

export const dynamic = "force-dynamic";

type ChangePlanRequestBody = {
  plan?: string;
  provider?: string;
};

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

    const body = (await request.json()) as ChangePlanRequestBody;
    const plan = body.plan;

    if (!isValidBillingPlan(plan)) {
      return NextResponse.json(
        { ok: false, message: "Plan inválido.", data: null },
        { status: 400 },
      );
    }

    if (plan !== "BASICO") {
      return NextResponse.json(
        {
          ok: false,
          message:
            "Los cambios a planes pagados deben iniciarse mediante el checkout externo.",
          data: null,
        },
        { status: 409 },
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

    return NextResponse.json({
      ok: true,
      message: result.message,
      data: {
        type: result.type,
        plan: result.plan,
        subscriptionId:
          result.type === "immediate" ? result.subscriptionId : null,
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
