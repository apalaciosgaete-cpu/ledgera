import { Feature } from "@/modules/subscription/domain/planFeatures";
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
  | ReturnType<typeof requireFeature>;

/**
 * Enforces the commercial access contract in backend routes.
 * Authentication and resource ownership must be checked separately.
 */
export function requireFeatureAccess(
  user: FeatureAccessUser,
  feature: Feature,
): FeatureAccessResult {
  const subscriptionCheck = requireActiveSubscription(user);
  if (!subscriptionCheck.ok) return subscriptionCheck;

  return requireFeature(user, feature);
}
