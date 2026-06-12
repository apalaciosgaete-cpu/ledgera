// src/modules/subscription/application/requireFeature.ts

import { NextResponse } from "next/server";
import {
  canAccessFeature,
  Feature,
  getPlanLabel,
  requiredPlanForFeature,
} from "@/modules/subscription/domain/planFeatures";

type RequireFeatureResult =
  | { ok: true }
  | { ok: false; response: NextResponse };

export function requireFeature(
  user: { subscriptionPlan?: string | null },
  feature: Feature,
): RequireFeatureResult {
  if (canAccessFeature(user.subscriptionPlan, feature)) {
    return { ok: true };
  }

  const requiredPlan = requiredPlanForFeature(feature);

  return {
    ok: false,
    response: NextResponse.json(
      {
        ok: false,
        message: `Esta función requiere el plan ${getPlanLabel(requiredPlan)}.`,
        data: {
          code: "FEATURE_NOT_AVAILABLE",
          feature,
          requiredPlan,
        },
      },
      { status: 402 },
    ),
  };
}
