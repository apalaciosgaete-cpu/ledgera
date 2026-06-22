import { prisma } from "@/lib/prisma";

// ── Tipos ─────────────────────────────────────────────────────────────────────
export interface MatchSuggestion {
  bankMovementId:       string;
  portfolioMovementId:  string;
  confidence:           number;
  reason:               string;
  // context para UI
  bankOccurredAt:       string;
  bankDescription:      string;
  bankAmountClp:        number;
  portfolioOccurredAt:  string;
  portfolioSymbol:      string;
  portfolioType:        string;
  portfolioPriceUsd:    number;
  portfolioQuantity:    number;
  daysDiff:             number;
}

// ── Constantes ────────────────────────────────────────────────────────────────
const KEYWORDS = ["BINANCE", "P2P", "CRYPTO", "BTC", "ETH", "USDT", "USDC", "BNB", "CRIPTOMONEDA", "CRIPTOMONED"];
const BINANCE_SOURCES = ["BINANCE", "BINANCE_TAX"];
const WINDOW_DAYS = 3;

// ── Utilidades ────────────────────────────────────────────────────────────────
function daysBetween(a: Date, b: Date): number {
  return Math.abs(a.getTime() - b.getTime()) / (1000 * 60 * 60 * 24);
}

function descriptionScore(description: string): number {
  const upper = description.toUpperCase();
  return KEYWORDS.some(k => upper.includes(k)) ? 0.40 : 0;
}

function dateScore(days: number): number {
  if (days === 0) return 0.45;
  if (days <= 1)  return 0.35;
  if (days <= 2)  return 0.20;
  if (days <= 3)  return 0.10;
  return 0;
}

function buildReason(descMatch: boolean, days: number): string {
  const parts: string[] = [];
  if (descMatch) parts.push("Descripción contiene palabra clave Binance/crypto");
  if (days === 0) parts.push("Misma fecha");
  else parts.push(`Fecha cercana (${days} día${days === 1 ? "" : "s"} de diferencia)`);
  return parts.join(" + ");
}

// ── Matcher principal ─────────────────────────────────────────────────────────
export async function matchBinanceMovements(
  userId:        string,
  onlyUnmatched: boolean = true,
): Promise<MatchSuggestion[]> {
  // Egresos bancarios del usuario
  const bankMovements = await prisma.bankMovement.findMany({
    where: {
      userId,
      direction: "OUTFLOW",
      ...(onlyUnmatched ? { matchedPortfolioMovementId: null } : {}),
    },
    orderBy: { occurredAt: "desc" },
    take: 500,
  });

  if (bankMovements.length === 0) return [];

  // Rango de fechas para consulta eficiente
  const dates = bankMovements.map(m => m.occurredAt.getTime());
  const minDate = new Date(Math.min(...dates) - WINDOW_DAYS * 86_400_000);
  const maxDate = new Date(Math.max(...dates) + WINDOW_DAYS * 86_400_000);

  // Movimientos de portfolio Binance en ese rango
  const portfolioMovements = await prisma.portfolioMovement.findMany({
    where: {
      userId,
      source:    { in: BINANCE_SOURCES },
      type:      "BUY",
      deletedAt: null,
      executedAt: { gte: minDate, lte: maxDate },
    },
    orderBy: { executedAt: "desc" },
  });

  if (portfolioMovements.length === 0) return [];

  // Para cada egreso bancario, buscar el mejor match
  const suggestions: MatchSuggestion[] = [];

  for (const bank of bankMovements) {
    let bestMatch: MatchSuggestion | null = null;

    for (const portfolio of portfolioMovements) {
      const days = daysBetween(bank.occurredAt, portfolio.executedAt);
      if (days > WINDOW_DAYS) continue;

      const descMatch = descriptionScore(bank.description) > 0;
      const conf      = Math.min(1, descriptionScore(bank.description) + dateScore(days));

      if (conf < 0.10) continue;

      if (!bestMatch || conf > bestMatch.confidence) {
        bestMatch = {
          bankMovementId:      bank.id,
          portfolioMovementId: portfolio.id,
          confidence:          Math.round(conf * 100) / 100,
          reason:              buildReason(descMatch, Math.round(days)),
          bankOccurredAt:      bank.occurredAt.toISOString(),
          bankDescription:     bank.description,
          bankAmountClp:       bank.amountClp,
          portfolioOccurredAt: portfolio.executedAt.toISOString(),
          portfolioSymbol:     portfolio.symbol,
          portfolioType:       portfolio.type,
          portfolioPriceUsd:   portfolio.priceUsd,
          portfolioQuantity:   portfolio.quantity,
          daysDiff:            Math.round(days),
        };
      }
    }

    if (bestMatch) suggestions.push(bestMatch);
  }

  // Ordenar por confianza descendente
  return suggestions.sort((a, b) => b.confidence - a.confidence);
}
