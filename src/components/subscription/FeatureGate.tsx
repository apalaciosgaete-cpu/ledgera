"use client";

import type { ReactNode } from "react";
import { Feature } from "@/modules/subscription/domain/planFeatures";
import { useFeatureAccess } from "@/modules/subscription/client/useFeatureAccess";
import { UpgradeCard } from "./UpgradeCard";

export type FeatureGateProps = {
  feature: Feature;
  source?: string;
  children: ReactNode;
  fallback?: ReactNode;
};

export function FeatureGate({ feature, source, children, fallback }: FeatureGateProps) {
  const { hasAccess } = useFeatureAccess();

  if (hasAccess(feature)) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  return <UpgradeCard feature={feature} source={source} />;
}
