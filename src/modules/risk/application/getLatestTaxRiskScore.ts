import type { TaxRiskScore } from "@/modules/risk/domain/risk";
import { calculateTaxRiskScore } from "./calculateTaxRiskScore";
import { getLatestTaxRiskScoreByUserId } from "@/modules/risk/infrastructure/taxRiskScoreRepository";

export async function getLatestTaxRiskScore(
  userId: string,
): Promise<TaxRiskScore | null> {
  const existing = await getLatestTaxRiskScoreByUserId(userId);

  if (existing) {
    return existing;
  }

  const calculated = await calculateTaxRiskScore(userId);

  if (!calculated.ok) {
    return null;
  }

  return {
    id: `live-${Date.now()}`,
    userId,
    score: calculated.score,
    level: calculated.level,
    breakdown: calculated.breakdown,
    evaluatedAt: new Date(),
  };
}
