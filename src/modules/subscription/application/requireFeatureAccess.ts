import { NextResponse } from "next/server";

import {
  Feature,
  isFeatureAvailable,
} from "@/modules/subscription/domain/planFeatures";
import { requireActiveSubscription } from "./requireActiveSubscription";
import { requireFeature } from "./requireFeature";

type FeatureAccessUser = {
  id: string;
  role?: string | null;
  status?: string | null;
  subscriptionPlan?: string | null;
  subscriptionExpiresAt?: Date | string | null;
};

type FeatureAccessResult =
  | { ok: true }
  | ReturnType<typeof requireActiveSubscription>
  | ReturnType<typeof requireFeature>
  | { ok: false; response: NextResponse };

/**
 * Enforces the commercial access contract in backend routes.
 * Authentication and resource ownership must be checked separately.
 */
export function requireFeatureAccess(
  user: FeatureAccessUser,
  feature: Feature,
): FeatureAccessResult {
  if (!isFeatureAvailable(feature)) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          ok: false,
          message: "Esta función todavía no está disponible en producción.",
          data: {
            code: "FEATURE_NOT_AVAILABLE",
            feature,
            availability: "PLANNED",
          },
        },
        { status: 501 },
      ),
    };
  }

  const subscriptionCheck = requireActiveSubscription(user);
  if (!subscriptionCheck.ok) return subscriptionCheck;

  return requireFeature(user, feature);
}
