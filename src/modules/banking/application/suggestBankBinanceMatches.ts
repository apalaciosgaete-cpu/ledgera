import { prisma } from "@/lib/prisma";
import type { BankMatchSuggestion } from "../domain/bankMatchingTypes";
import { resolveUsdClpRate } from "@/modules/market/infrastructure/exchangeRate";
import { classifyFinancialEvent } from "./classifyFinancialEvent";

const KEYWORDS = ["BINANCE", "P2P", "CRYPTO", "BIFROST"];

function addDays(date: Date, days: number): Date {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

function daysDiff(a: Date, b: Date): number {
  const ms = Math.abs(a.getTime() - b.getTime());
  return ms / (1000 * 60 * 60 * 24);
}

function keywordScore(description: string): { score: number; reason?: string } {
  const upper = description.toUpperCase();
  const found = KEYWORDS.find((keyword) => upper.includes(keyword));

  if (!found) return { score: 0 };

  return {
    score: 0.4,
    reason: `Descripción bancaria contiene ${found}`,
  };
}

function dateScore(bankDate: Date, cryptoDate: Date): { score: number; reason: string } {
  const diff = daysDiff(bankDate, cryptoDate);

  if (diff <= 1) {
    return { score: 0.3, reason: "Fecha dentro de ±1 día" };
  }

  if (diff <= 3) {
    return { score: 0.2, reason: "Fecha dentro de ±3 días" };
  }

  return { score: 0, reason: "Fecha fuera de rango" };
}

function typeScore(type: string): { score: number; reason?: string } {
  if (type === "BUY" || type === "DEPOSIT") {
    return { score: 0.1, reason: `Movimiento crypto tipo ${type}` };
  }

  return { score: 0 };
}

function amountDiffPct(
  bankAmountClp: number,
  cryptoQuantity: number,
  cryptoPriceUsd: number,
  usdClp: number,
): number | null {
  const estimatedClp = cryptoQuantity * cryptoPriceUsd * usdClp;

  if (!Number.isFinite(estimatedClp) || estimatedClp <= 0 || bankAmountClp <= 0) {
    return null;
  }

  return Math.abs(bankAmountClp - estimatedClp) / bankAmountClp;
}

function amountScore(
  bankAmountClp: number,
  cryptoQuantity: number,
  cryptoPriceUsd: number,
  usdClp: number,
): { score: number; reason?: string } {
  const estimatedClp = cryptoQuantity * cryptoPriceUsd * usdClp;

  if (!Number.isFinite(estimatedClp) || estimatedClp <= 0 || bankAmountClp <= 0) {
    return { score: 0 };
  }

  const diffPct = Math.abs(bankAmountClp - estimatedClp) / bankAmountClp;

  const diffRounded      = Math.round(diffPct * 100);
  const estimatedRounded = Math.round(estimatedClp);
  const usdClpRounded    = Math.round(usdClp);

  if (diffPct <= 0.05) {
    return {
      score: 0.3,
      reason: `Monto compatible dentro de 5% (${diffRounded}%) · estimado CLP ${estimatedRounded} usando USD/CLP ${usdClpRounded}`,
    };
  }

  if (diffPct <= 0.1) {
    return {
      score: 0.2,
      reason: `Monto compatible dentro de 10% (${diffRounded}%) · estimado CLP ${estimatedRounded} usando USD/CLP ${usdClpRounded}`,
    };
  }

  if (diffPct <= 0.2) {
    return {
      score: 0.1,
      reason: `Monto compatible dentro de 20% (${diffRounded}%) · estimado CLP ${estimatedRounded} usando USD/CLP ${usdClpRounded}`,
    };
  }

  return { score: 0 };
}

export type MatchFilters = {
  minConfidence?: number;
  source?:        string;
  type?:          string;
};

export async function suggestBankBinanceMatches(
  userId:  string,
  filters: MatchFilters = {},
): Promise<BankMatchSuggestion[]> {
  const minConfidence = filters.minConfidence ?? 0.6;

  const bankMovements = await prisma.bankMovement.findMany({
    where: {
      userId,
      direction: "OUTFLOW",
      status: { in: ["IMPORTED", "REVIEW"] },
    },
    orderBy: { occurredAt: "desc" },
    take: 50,
  });

  if (bankMovements.length === 0) {
    return [];
  }

  const minBankDate = bankMovements.reduce(
    (min, movement) => movement.occurredAt < min ? movement.occurredAt : min,
    bankMovements[0].occurredAt,
  );

  const maxBankDate = bankMovements.reduce(
    (max, movement) => movement.occurredAt > max ? movement.occurredAt : max,
    bankMovements[0].occurredAt,
  );

  const cryptoFrom = addDays(minBankDate, -3);
  const cryptoTo   = addDays(maxBankDate,  3);

  const cryptoMovements = await prisma.portfolioMovement.findMany({
    where: {
      userId,
      source:     filters.source ? filters.source : { in: ["BINANCE", "BINANCE_TAX"] },
      type:       filters.type   ? filters.type   : { in: ["BUY", "DEPOSIT"] },
      executedAt: { gte: cryptoFrom, lte: cryptoTo },
      deletedAt:  null,
    },
    orderBy: { executedAt: "asc" },
    take: 1000,
  });

  const suggestions: BankMatchSuggestion[] = [];
  const fxCache = new Map<string, number>();

  for (const bank of bankMovements) {
    const dateKey = bank.occurredAt.toISOString().slice(0, 10);
    let usdClp = fxCache.get(dateKey);
    if (usdClp === undefined) {
      usdClp = await resolveUsdClpRate(bank.occurredAt);
      fxCache.set(dateKey, usdClp);
    }

    const from = addDays(bank.occurredAt, -3);
    const to   = addDays(bank.occurredAt,  3);

    const nearbyCryptoMovements = cryptoMovements.filter(
      (crypto) => crypto.executedAt >= from && crypto.executedAt <= to,
    );

    for (const crypto of nearbyCryptoMovements) {
      const reasons: string[] = [];

      const keyword = keywordScore(bank.description);
      if (keyword.reason) reasons.push(keyword.reason);

      const date = dateScore(bank.occurredAt, crypto.executedAt);
      if (date.score > 0) reasons.push(date.reason);

      const type = typeScore(crypto.type);
      if (type.reason) reasons.push(type.reason);

      const amount = amountScore(bank.amountClp, crypto.quantity, crypto.priceUsd, usdClp);
      if (amount.reason) reasons.push(amount.reason);

      const confidence = Math.min(
        1,
        keyword.score + date.score + type.score + amount.score,
      );

      const financialEvent = classifyFinancialEvent({
        bankDescription: bank.description,
        bankDirection:   bank.direction as "INFLOW" | "OUTFLOW",
        bankAmountClp:   bank.amountClp,
        cryptoType:      crypto.type,
        cryptoSource:    crypto.source,
        amountDiffPct:   amountDiffPct(bank.amountClp, crypto.quantity, crypto.priceUsd, usdClp),
        dateDiffDays:    daysDiff(bank.occurredAt, crypto.executedAt),
      });

      if (confidence >= minConfidence) {
        suggestions.push({
          bankMovementId:      bank.id,
          portfolioMovementId: crypto.id,
          confidence,
          reason:     reasons.join(" · "),
          eventType:  financialEvent.eventType,
          eventLabel: financialEvent.label,
          certainty:  financialEvent.certainty,
          evidence:   financialEvent.evidence,
          bank: {
            occurredAt:  bank.occurredAt.toISOString(),
            description: bank.description,
            amountClp:   bank.amountClp,
          },
          crypto: {
            occurredAt: crypto.executedAt.toISOString(),
            type:       crypto.type,
            symbol:     crypto.symbol,
            quantity:   crypto.quantity,
            priceUsd:   crypto.priceUsd,
            source:     crypto.source,
          },
        });
      }
    }
  }

  return suggestions.sort((a, b) => b.confidence - a.confidence);
}
