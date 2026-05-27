import { prisma } from "@/lib/prisma";
import type { BankMatchSuggestion } from "../domain/bankMatchingTypes";
import { resolveUsdClpRate } from "@/modules/market/infrastructure/exchangeRate";
import { classifyFinancialEvent } from "./classifyFinancialEvent";
import { getExchangeFinancialEvents } from "@/modules/integrations/binance/application/getExchangeFinancialEvents";

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

function exchangeEventToCryptoType(eventType: string): string {
  if (eventType === "SPOT_BUY")          return "BUY";
  if (eventType === "SPOT_SELL")         return "SELL";
  if (eventType === "EXTERNAL_DEPOSIT")  return "DEPOSIT";
  if (eventType === "EXTERNAL_WITHDRAW") return "WITHDRAWAL";
  if (eventType === "P2P")               return "P2P";
  if (eventType === "INTERNAL_TRANSFER") return "TRANSFER";
  return "UNKNOWN";
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

function dateScore(bankDate: Date, eventDate: Date): { score: number; reason: string } {
  const diff = daysDiff(bankDate, eventDate);

  if (diff <= 1) return { score: 0.3, reason: "Fecha dentro de ±1 día" };
  if (diff <= 3) return { score: 0.2, reason: "Fecha dentro de ±3 días" };

  return { score: 0, reason: "Fecha fuera de rango" };
}

function typeScore(type: string): { score: number; reason?: string } {
  if (type === "BUY" || type === "DEPOSIT" || type === "P2P") {
    return { score: 0.1, reason: `Movimiento crypto tipo ${type}` };
  }
  if (type === "SELL" || type === "WITHDRAWAL" || type === "TRANSFER") {
    return { score: 0.1, reason: `Movimiento crypto tipo ${type}` };
  }

  return { score: 0 };
}

function amountDiffPct(
  bankAmountClp: number,
  quantity: number,
  priceUsd: number,
  usdClp: number,
): number | null {
  const estimatedClp = quantity * priceUsd * usdClp;

  if (!Number.isFinite(estimatedClp) || estimatedClp <= 0 || bankAmountClp <= 0) {
    return null;
  }

  return Math.abs(bankAmountClp - estimatedClp) / bankAmountClp;
}

function amountScore(
  bankAmountClp: number,
  quantity: number,
  priceUsd: number,
  usdClp: number,
): { score: number; reason?: string } {
  const estimatedClp = quantity * priceUsd * usdClp;

  if (!Number.isFinite(estimatedClp) || estimatedClp <= 0 || bankAmountClp <= 0) {
    return { score: 0 };
  }

  const diffPct          = Math.abs(bankAmountClp - estimatedClp) / bankAmountClp;
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
  from?:          Date;
  to?:            Date;
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
      occurredAt: filters.from && filters.to
        ? { gte: filters.from, lt: filters.to }
        : undefined,
    },
    orderBy: { occurredAt: "desc" },
    take: 50,
  });

  if (bankMovements.length === 0) {
    return [];
  }

  const minBankDate = bankMovements.reduce(
    (min, m) => m.occurredAt < min ? m.occurredAt : min,
    bankMovements[0].occurredAt,
  );

  const maxBankDate = bankMovements.reduce(
    (max, m) => m.occurredAt > max ? m.occurredAt : max,
    bankMovements[0].occurredAt,
  );

  const cryptoFrom = addDays(minBankDate, -3);
  const cryptoTo   = addDays(maxBankDate,  3);

  const exchangeEvents = await getExchangeFinancialEvents({
    userId,
    from:      cryptoFrom,
    to:        cryptoTo,
    providers: filters.source && filters.source !== "ALL"
      ? [filters.source]
      : ["BINANCE", "BINANCE_TAX"],
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

    const nearbyEvents = exchangeEvents.filter(
      (event) => event.occurredAt >= from && event.occurredAt <= to,
    );

    for (const event of nearbyEvents) {
      const cryptoType = exchangeEventToCryptoType(event.eventType);

      const reasons: string[] = [];

      const keyword = keywordScore(bank.description);
      if (keyword.reason) reasons.push(keyword.reason);

      const date = dateScore(bank.occurredAt, event.occurredAt);
      if (date.score > 0) reasons.push(date.reason);

      const type = typeScore(cryptoType);
      if (type.reason) reasons.push(type.reason);

      const amount = amountScore(bank.amountClp, event.quantity, event.priceUsd, usdClp);
      if (amount.reason) reasons.push(amount.reason);

      const confidence = Math.min(
        1,
        keyword.score + date.score + type.score + amount.score,
      );

      const financialEvent = classifyFinancialEvent({
        bankDescription: bank.description,
        bankDirection:   bank.direction as "INFLOW" | "OUTFLOW",
        bankAmountClp:   bank.amountClp,
        cryptoType,
        cryptoSource:    event.provider,
        amountDiffPct:   amountDiffPct(bank.amountClp, event.quantity, event.priceUsd, usdClp),
        dateDiffDays:    daysDiff(bank.occurredAt, event.occurredAt),
      });

      if (confidence >= minConfidence) {
        suggestions.push({
          bankMovementId:      bank.id,
          portfolioMovementId: event.portfolioMovementId,
          exchangeExternalId:  event.externalId,
          exchangeProvider:    event.provider,
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
            direction:   bank.direction as "INFLOW" | "OUTFLOW",
          },
          exchange: {
            occurredAt:      event.occurredAt.toISOString(),
            provider:        event.provider,
            externalId:      event.externalId,
            eventType:       event.eventType,
            asset:           event.asset,
            quantity:        event.quantity,
            priceUsd:        event.priceUsd,
            estimatedUsd:    event.estimatedUsd,
            taxTreatment:    event.taxTreatment,
            inventoryEffect: event.inventoryEffect,
            economicEffect:  event.economicEffect,
          },
        });
      }
    }
  }

  return suggestions.sort((a, b) => b.confidence - a.confidence);
}
