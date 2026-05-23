import { prisma } from "@/lib/prisma";
import type { BankMatchSuggestion } from "../domain/bankMatchingTypes";
import { resolveUsdClpRate } from "@/modules/market/infrastructure/exchangeRate";

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

  const rate = Math.round(usdClp);

  if (diffPct <= 0.05) {
    return {
      score: 0.3,
      reason: `Monto compatible dentro de 5% usando USD/CLP ${rate}`,
    };
  }

  if (diffPct <= 0.1) {
    return {
      score: 0.2,
      reason: `Monto compatible dentro de 10% usando USD/CLP ${rate}`,
    };
  }

  if (diffPct <= 0.2) {
    return {
      score: 0.1,
      reason: `Monto compatible dentro de 20% usando USD/CLP ${rate}`,
    };
  }

  return { score: 0 };
}

export async function suggestBankBinanceMatches(userId: string): Promise<BankMatchSuggestion[]> {
  const bankMovements = await prisma.bankMovement.findMany({
    where: {
      userId,
      direction: "OUTFLOW",
      status: {
        in: ["IMPORTED", "REVIEW"],
      },
    },
    orderBy: {
      occurredAt: "desc",
    },
    take: 500,
  });

  const suggestions: BankMatchSuggestion[] = [];

  for (const bank of bankMovements) {
    const usdClp = await resolveUsdClpRate(bank.occurredAt);
    const from = addDays(bank.occurredAt, -3);
    const to = addDays(bank.occurredAt, 3);

    const cryptoMovements = await prisma.portfolioMovement.findMany({
      where: {
        userId,
        source: {
          in: ["BINANCE", "BINANCE_TAX"],
        },
        type: {
          in: ["BUY", "DEPOSIT"],
        },
        executedAt: {
          gte: from,
          lte: to,
        },
        deletedAt: null,
      },
      orderBy: {
        executedAt: "asc",
      },
      take: 20,
    });

    for (const crypto of cryptoMovements) {
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

      if (confidence >= 0.4) {
        suggestions.push({
          bankMovementId: bank.id,
          portfolioMovementId: crypto.id,
          confidence,
          reason: reasons.join(" · "),
          bank: {
            occurredAt: bank.occurredAt.toISOString(),
            description: bank.description,
            amountClp: bank.amountClp,
          },
          crypto: {
            occurredAt: crypto.executedAt.toISOString(),
            type: crypto.type,
            symbol: crypto.symbol,
            quantity: crypto.quantity,
            priceUsd: crypto.priceUsd,
            source: crypto.source,
          },
        });
      }
    }
  }

  return suggestions.sort((a, b) => b.confidence - a.confidence);
}
