import { calculateSmartTaxScore } from "./calculateSmartTaxScore";
import { getLatestSmartTaxScoreByUserId } from "@/modules/tax-score/infrastructure/smartTaxScoreRepository";

export async function getLatestSmartTaxScore(userId: string) {
  const existing = await getLatestSmartTaxScoreByUserId(userId);
  if (existing) return existing;

  const calculated = await calculateSmartTaxScore(userId);
  if (!calculated.ok) return null;

  const fresh = await getLatestSmartTaxScoreByUserId(userId);
  return fresh;
}
