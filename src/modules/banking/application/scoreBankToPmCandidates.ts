// Shared scoring logic for matching a BankMovement to PortfolioMovement candidates.
// Used by both the single-movement GET and the bulk POST endpoints.

const WINDOW_DAYS = 3;

// confidence >= HIGH_CONFIDENCE  → "Alta certeza"  (revisión prioritaria)
// confidence >= REVIEW_THRESHOLD → "Media certeza" (revisión normal)
// confidence <  REVIEW_THRESHOLD → sin candidato útil (stays PENDING)
export const HIGH_CONFIDENCE   = 0.90;
export const REVIEW_THRESHOLD  = 0.60;

export type ConfidenceTier = "high" | "medium" | "low";

export function getConfidenceTier(confidence: number): ConfidenceTier {
  if (confidence >= HIGH_CONFIDENCE)  return "high";
  if (confidence >= REVIEW_THRESHOLD) return "medium";
  return "low";
}

const DIRECTION_TYPES: Record<string, string[]> = {
  INFLOW:  ["SELL", "WITHDRAW"],
  OUTFLOW: ["BUY",  "DEPOSIT"],
};

function daysDiff(a: Date, b: Date): number {
  return Math.abs(a.getTime() - b.getTime()) / (1000 * 60 * 60 * 24);
}

function buildReason(diff: number, diffPct: number | null, dirMatch: boolean): string {
  const parts: string[] = [];

  if (diff <= 1)      parts.push("Fecha: mismo día / ±1 día");
  else if (diff <= 2) parts.push("Fecha: ±2 días");
  else                parts.push("Fecha: ±3 días");

  if (diffPct !== null) parts.push(`Monto compatible ${Math.round(diffPct * 100)}%`);
  if (dirMatch)         parts.push("Dirección coincide");

  return parts.join(" · ");
}

export type PmRow = {
  id:         string;
  type:       string;
  symbol:     string;
  quantity:   number;
  priceUsd:   number;
  executedAt: Date;
  source:     string;
  deletedAt:  Date | null;
};

export type PmCandidate = {
  portfolioMovementId: string;
  confidence:          number;
  reason:              string;
  movement: {
    type:       string;
    symbol:     string;
    quantity:   number;
    priceUsd:   number;
    executedAt: string;
    source:     string;
  };
};

export function scoreBankToPmCandidates(
  bank: {
    direction:  string;
    amountClp:  number;
    occurredAt: Date;
  },
  portfolioMovements: PmRow[],
  usdClp:        number,
  maxCandidates: number = 3,
): PmCandidate[] {
  const preferredTypes = DIRECTION_TYPES[bank.direction] ?? [];
  const results: PmCandidate[] = [];

  for (const pm of portfolioMovements) {
    if (pm.deletedAt) continue;

    const diff = daysDiff(bank.occurredAt, pm.executedAt);
    if (diff > WINDOW_DAYS) continue;

    // Amount filter ±20%
    let diffPct: number | null = null;
    const estimatedClp = pm.quantity * pm.priceUsd * usdClp;
    if (Number.isFinite(estimatedClp) && estimatedClp > 0 && bank.amountClp > 0) {
      diffPct = Math.abs(bank.amountClp - estimatedClp) / bank.amountClp;
      if (diffPct > 0.2) continue;
    }

    const dirMatch = preferredTypes.includes(pm.type);

    const dateScore =
      diff <= 1 ? 0.4 :
      diff <= 2 ? 0.3 :
                  0.2;

    const amountScore =
      diffPct === null ? 0    :
      diffPct <= 0.05  ? 0.3  :
      diffPct <= 0.10  ? 0.2  :
                         0.1;

    const dirScore  = dirMatch ? 0.3 : 0;
    const confidence = Math.min(1, Math.round((dateScore + amountScore + dirScore) * 100) / 100);

    results.push({
      portfolioMovementId: pm.id,
      confidence,
      reason: buildReason(diff, diffPct, dirMatch),
      movement: {
        type:       pm.type,
        symbol:     pm.symbol,
        quantity:   pm.quantity,
        priceUsd:   pm.priceUsd,
        executedAt: pm.executedAt.toISOString(),
        source:     pm.source,
      },
    });
  }

  results.sort((a, b) => b.confidence - a.confidence);
  return results.slice(0, maxCandidates);
}
