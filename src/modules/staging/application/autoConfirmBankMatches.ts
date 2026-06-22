import { resolveUsdClpRate } from "@/modules/market/infrastructure/exchangeRate";
import {
  findBankMovementsForMatching,
  findAlreadyMatchedPortfolioMovementIds,
  findPortfolioMovementsInWindow,
  updateBankMovementMatch,
} from "../infrastructure/stagingRepository";
import { writeBankMatchConfirmAudit } from "../infrastructure/stagingAuditRepository";
import { syncBankStagingEvent } from "./upsertStagingEvent";
import {
  scoreBankToPmCandidates,
  BINANCE_SOURCES,
  MATCH_WINDOW_DAYS,
  addDays,
} from "../domain/StagingMatch";
import { prisma } from "@/lib/prisma";

const AUTO_CONFIRM_MIN_CONFIDENCE = 0.95;
const AUTO_CONFIRM_MAX_DATE_DIFF  = 1;    // days
const AUTO_CONFIRM_MAX_AMOUNT_PCT = 0.05; // 5%

export type AutoConfirmResult = {
  scanned:   number;
  confirmed: number;
  skipped:   number;
  entries:   AutoConfirmEntry[];
};

type AutoConfirmEntry = {
  bankMovementId:      string;
  portfolioMovementId: string;
  confidence:          number;
  reason:              string;
  skippedReason?:      string;
  confirmed:           boolean;
};

function daysDiff(a: Date, b: Date): number {
  return Math.abs(a.getTime() - b.getTime()) / (1000 * 60 * 60 * 24);
}

async function isTaxPeriodClosed(date: Date, userId: string): Promise<boolean> {
  const year = date.getUTCFullYear();
  const closure = await prisma.taxPeriodClose.findUnique({
    where: { userId_periodYear: { userId, periodYear: year } },
  });
  return !!closure && !closure.reopenedAt;
}

export async function autoConfirmBankMatches(userId: string): Promise<AutoConfirmResult> {
  const bankMovements = await findBankMovementsForMatching(userId, ["REVIEW"]);

  if (bankMovements.length === 0) {
    return { scanned: 0, confirmed: 0, skipped: 0, entries: [] };
  }

  const timestamps  = bankMovements.map((m) => m.occurredAt.getTime());
  const globalFrom  = addDays(new Date(Math.min(...timestamps)), -MATCH_WINDOW_DAYS);
  const globalTo    = addDays(new Date(Math.max(...timestamps)),  MATCH_WINDOW_DAYS);
  const excludeIds  = await findAlreadyMatchedPortfolioMovementIds(userId);

  const portfolioMovements = await findPortfolioMovementsInWindow(
    userId, globalFrom, globalTo, [...BINANCE_SOURCES], excludeIds,
  );

  const uniqueDates = [...new Set(bankMovements.map((m) => m.occurredAt.toISOString().slice(0, 10)))];
  const rateMap = new Map<string, number>(
    await Promise.all(
      uniqueDates.map(async (d) => {
        const rate = await resolveUsdClpRate(new Date(d));
        return [d, rate] as const;
      }),
    ),
  );

  const entries: AutoConfirmEntry[] = [];
  let confirmed = 0;

  for (const bank of bankMovements) {
    const dateKey = bank.occurredAt.toISOString().slice(0, 10);
    const usdClp  = rateMap.get(dateKey) ?? 950;

    // Score all candidates; request more than needed to detect competing candidates
    const candidates = scoreBankToPmCandidates(bank, portfolioMovements, usdClp, 10);

    if (candidates.length === 0) {
      entries.push({
        bankMovementId:      bank.id,
        portfolioMovementId: "",
        confidence:          0,
        reason:              "",
        skippedReason:       "SIN_CANDIDATOS",
        confirmed:           false,
      });
      continue;
    }

    const top = candidates[0];

    // Rule 1: confidence >= 0.95
    if (top.confidence < AUTO_CONFIRM_MIN_CONFIDENCE) {
      entries.push({
        bankMovementId:      bank.id,
        portfolioMovementId: top.portfolioMovementId,
        confidence:          top.confidence,
        reason:              top.reason,
        skippedReason:       "CONFIANZA_INSUFICIENTE",
        confirmed:           false,
      });
      continue;
    }

    // Rule 2: date diff <= 1 day
    const pm        = portfolioMovements.find((p) => p.id === top.portfolioMovementId);
    const dateDiff  = pm ? daysDiff(bank.occurredAt, pm.executedAt) : Infinity;
    if (dateDiff > AUTO_CONFIRM_MAX_DATE_DIFF) {
      entries.push({
        bankMovementId:      bank.id,
        portfolioMovementId: top.portfolioMovementId,
        confidence:          top.confidence,
        reason:              top.reason,
        skippedReason:       "DIFERENCIA_FECHA_ALTA",
        confirmed:           false,
      });
      continue;
    }

    // Rule 3: amount diff <= 5%
    if (pm) {
      const estimatedClp = pm.quantity * pm.priceUsd * usdClp;
      if (estimatedClp > 0 && bank.amountClp > 0) {
        const amtDiff = Math.abs(bank.amountClp - estimatedClp) / bank.amountClp;
        if (amtDiff > AUTO_CONFIRM_MAX_AMOUNT_PCT) {
          entries.push({
            bankMovementId:      bank.id,
            portfolioMovementId: top.portfolioMovementId,
            confidence:          top.confidence,
            reason:              top.reason,
            skippedReason:       "DIFERENCIA_MONTO_ALTA",
            confirmed:           false,
          });
          continue;
        }
      }
    }

    // Rule 4: no competing candidates with confidence >= REVIEW_THRESHOLD (0.6)
    const competitors = candidates.slice(1).filter((c) => c.confidence >= 0.6);
    if (competitors.length > 0) {
      entries.push({
        bankMovementId:      bank.id,
        portfolioMovementId: top.portfolioMovementId,
        confidence:          top.confidence,
        reason:              top.reason,
        skippedReason:       "CANDIDATOS_COMPETIDORES",
        confirmed:           false,
      });
      continue;
    }

    // Rule 5: tax period must be open
    const periodClosed = await isTaxPeriodClosed(bank.occurredAt, userId);
    if (periodClosed) {
      entries.push({
        bankMovementId:      bank.id,
        portfolioMovementId: top.portfolioMovementId,
        confidence:          top.confidence,
        reason:              top.reason,
        skippedReason:       "PERIODO_TRIBUTARIO_CERRADO",
        confirmed:           false,
      });
      continue;
    }

    // All rules passed — confirm
    const reason = `${top.reason} · Auto-confirmado por regla (confianza ${(top.confidence * 100).toFixed(0)}%)`;

    await updateBankMovementMatch(bank.id, top.portfolioMovementId, top.confidence, reason);

    await writeBankMatchConfirmAudit(userId, {
      userId,
      bankMovementId:      bank.id,
      portfolioMovementId: top.portfolioMovementId,
      confidence:          top.confidence,
      reason,
      beforeStatus: bank.status,
      afterStatus:  "MATCHED",
    });

    // Override audit action to AUTO_CONFIRMED_BY_RULE via BankReconciliationAuditLog directly
    await prisma.bankReconciliationAuditLog.create({
      data: {
        userId,
        action:              "AUTO_CONFIRMED_BY_RULE",
        bankMovementId:      bank.id,
        portfolioMovementId: top.portfolioMovementId,
        confidence:          top.confidence,
        reason,
        metadata: JSON.stringify({
          source:       "AUTO_CONFIRM",
          beforeStatus: bank.status,
          afterStatus:  "MATCHED",
          rules: {
            confidence:    top.confidence,
            dateDiff,
            competitors:   0,
            periodOpen:    true,
          },
        }),
      },
    });

    await syncBankStagingEvent(bank.id, "CONFIRMED", top.portfolioMovementId);

    // Remove from excludeIds pool so it can't be matched again in this run
    excludeIds.push(top.portfolioMovementId);

    entries.push({
      bankMovementId:      bank.id,
      portfolioMovementId: top.portfolioMovementId,
      confidence:          top.confidence,
      reason,
      confirmed:           true,
    });
    confirmed++;
  }

  return {
    scanned:   bankMovements.length,
    confirmed,
    skipped:   bankMovements.length - confirmed,
    entries,
  };
}
