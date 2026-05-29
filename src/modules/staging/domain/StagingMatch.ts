// Re-exports from the banking module — the match scoring lives there.
// Staging imports from banking; banking does not depend on staging.

export type {
  PmCandidate as MatchCandidate,
  ConfidenceTier,
} from "@/modules/banking/application/scoreBankToPmCandidates";

export {
  HIGH_CONFIDENCE,
  REVIEW_THRESHOLD,
  getConfidenceTier,
  scoreBankToPmCandidates,
} from "@/modules/banking/application/scoreBankToPmCandidates";

export const BINANCE_SOURCES = ["BINANCE", "BINANCE_TAX"] as const;
export const MATCH_WINDOW_DAYS = 3;

export function addDays(date: Date, days: number): Date {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}
