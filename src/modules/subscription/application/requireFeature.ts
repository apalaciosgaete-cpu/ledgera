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

type FeatureUser = {
  role?: string | null;
  subscriptionPlan?: string | null;
};

export function requireFeature(
  user: FeatureUser,
  feature: Feature,
): RequireFeatureResult {
  if (user.role === "admin") {
    return { ok: true };
  }

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
