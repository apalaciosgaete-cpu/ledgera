// src/modules/subscription/client/useFeatureAccess.ts

import { useCallback, useState } from "react";
import { useAuth } from "@/modules/identity/client/authContext";
import { canAccessFeature, Feature, normalizePlan } from "@/modules/subscription/domain/planFeatures";

export function useFeatureAccess() {
  const { user } = useAuth();
  const [blockedFeature, setBlockedFeature] = useState<{ feature: Feature; label: string } | null>(null);

  const plan = normalizePlan(user?.subscriptionPlan);

  const hasAccess = useCallback(
    (feature: Feature) => canAccessFeature(plan, feature),
    [plan],
  );

  const requestFeature = useCallback(
    (feature: Feature, label: string): boolean => {
      if (canAccessFeature(plan, feature)) {
        setBlockedFeature(null);
        return true;
      }
      setBlockedFeature({ feature, label });
      return false;
    },
    [plan],
  );

  const closeUpgrade = useCallback(() => {
    setBlockedFeature(null);
  }, []);

  return {
    plan,
    hasAccess,
    requestFeature,
    blockedFeature,
    closeUpgrade,
  };
}
