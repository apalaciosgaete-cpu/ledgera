import { resolveUsdClpRate } from "@/modules/market/infrastructure/exchangeRate";
import {
  findBankMovementsForMatching,
  findAlreadyMatchedPortfolioMovementIds,
  findPortfolioMovementsInWindow,
  bulkUpdateBankMovementCandidates,
} from "../infrastructure/stagingRepository";
import {
  scoreBankToPmCandidates,
  REVIEW_THRESHOLD,
  HIGH_CONFIDENCE,
  BINANCE_SOURCES,
  MATCH_WINDOW_DAYS,
  addDays,
  type MatchCandidate,
} from "../domain/StagingMatch";

// ── Types ─────────────────────────────────────────────────────────────────────

export type BulkEntry = {
  bankMovementId:  string;
  bankDescription: string;
  bankAmountClp:   number;
  bankOccurredAt:  string;
  currentStatus:   string;
  topConfidence:   number;
  top:             MatchCandidate[];
};

export type BulkMatchResult = {
  scanned:           number;
  withCandidates:    number;
  withoutCandidates: number;
  promoted:          number;
  promotedHigh:      number;
  promotedMedium:    number;
  candidates:        BulkEntry[];
};

// ── Service ───────────────────────────────────────────────────────────────────

export async function findAndPromoteBulkMatchCandidates(
  userId:   string,
  statuses: string[] = ["IMPORTED", "REVIEW"],
): Promise<BulkMatchResult> {
  const bankMovements = await findBankMovementsForMatching(userId, statuses);

  if (bankMovements.length === 0) {
    return {
      scanned: 0, withCandidates: 0, withoutCandidates: 0,
      promoted: 0, promotedHigh: 0, promotedMedium: 0, candidates: [],
    };
  }

  const timestamps = bankMovements.map((m) => m.occurredAt.getTime());
  const globalFrom = addDays(new Date(Math.min(...timestamps)), -MATCH_WINDOW_DAYS);
  const globalTo   = addDays(new Date(Math.max(...timestamps)),  MATCH_WINDOW_DAYS);
  const excludeIds = await findAlreadyMatchedPortfolioMovementIds(userId);

  const portfolioMovements = await findPortfolioMovementsInWindow(
    userId, globalFrom, globalTo, [...BINANCE_SOURCES], excludeIds,
  );

  const uniqueDates = [...new Set(
    bankMovements.map((m) => m.occurredAt.toISOString().slice(0, 10)),
  )];
  const rateMap = new Map<string, number>(
    await Promise.all(
      uniqueDates.map(async (d) => {
        const rate = await resolveUsdClpRate(new Date(d));
        return [d, rate] as const;
      }),
    ),
  );

  const withCandidates: BulkEntry[] = [];
  const withoutIds:     string[]    = [];

  for (const bank of bankMovements) {
    const dateKey    = bank.occurredAt.toISOString().slice(0, 10);
    const usdClp     = rateMap.get(dateKey) ?? 950;
    const candidates = scoreBankToPmCandidates(bank, portfolioMovements, usdClp, 3);

    if (candidates.length > 0) {
      withCandidates.push({
        bankMovementId:  bank.id,
        bankDescription: bank.description,
        bankAmountClp:   bank.amountClp,
        bankOccurredAt:  bank.occurredAt.toISOString(),
        currentStatus:   bank.status,
        topConfidence:   candidates[0].confidence,
        top:             candidates,
      });
    } else {
      withoutIds.push(bank.id);
    }
  }

  const toUpdate = withCandidates.filter((e) => e.topConfidence >= REVIEW_THRESHOLD);

  let promotedHigh   = 0;
  let promotedMedium = 0;

  const updateEntries = toUpdate.map((e) => {
    const promote = e.currentStatus === "IMPORTED";
    if (promote) {
      if (e.topConfidence >= HIGH_CONFIDENCE) promotedHigh++;
      else promotedMedium++;
    }
    return { id: e.bankMovementId, confidence: e.topConfidence, promote };
  });

  await bulkUpdateBankMovementCandidates(updateEntries);

  return {
    scanned:           bankMovements.length,
    withCandidates:    withCandidates.length,
    withoutCandidates: withoutIds.length,
    promoted:          promotedHigh + promotedMedium,
    promotedHigh,
    promotedMedium,
    candidates:        withCandidates,
  };
}
