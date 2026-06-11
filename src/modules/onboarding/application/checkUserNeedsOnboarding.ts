// src/modules/onboarding/application/checkUserNeedsOnboarding.ts

import { getOnboardingStatus } from "./getOnboardingStatus";

export async function checkUserNeedsOnboarding(userId: string): Promise<boolean> {
  const status = await getOnboardingStatus(userId);
  return status.needsOnboarding;
}
