import { prisma } from "@/lib/prisma";
import type { BankMatchSuggestion } from "../domain/bankMatchingTypes";

// ── Constantes ────────────────────────────────────────────────────────────────
const KEYWORDS       = ["BINANCE", "CRYPTO", "P2P"];
const BINANCE_SOURCES = ["BINANCE", "BINANCE_TAX"];
const WINDOW_DAYS    = 3;

// ── Scoring según spec ────────────────────────────────────────────────────────
// +0.40 descripción contiene BINANCE / CRYPTO / P2P
// +0.30 fecha dentro de ±1 día
// +0.20 fecha dentro de ±3 días (exclusivo — no acumula con ±1)
// +0.10 movimiento crypto es BUY o DEPOSIT
// Máximo: 1.00

function descScore(description: string): number {
  const upper = description.toUpperCase();
  return KEYWORDS.some(k => upper.includes(k)) ? 0.40 : 0;
}

function dateScore(daysDiff: number): number {
  if (daysDiff <= 1) return 0.30;
  if (daysDiff <= 3) return 0.20;
  return 0;
}

function typeScore(type: string): number {
  return type === "BUY" || type === "DEPOSIT" ? 0.10 : 0;
}

function daysBetween(a: Date, b: Date): number {
  return Math.abs(a.getTime() - b.getTime()) / (1000 * 60 * 60 * 24);
}

function buildReason(desc: boolean, days: number, typeBonus: boolean): string {
  const parts: string[] = [];
  if (desc)      parts.push("descripción contiene BINANCE/CRYPTO/P2P");
  if (days <= 1) parts.push("fecha dentro de ±1 día");
  else           parts.push("fecha dentro de ±3 días");
  if (typeBonus) parts.push("movimiento es BUY/DEPOSIT");
  return parts.join(" + ");
}

// ── Función principal ─────────────────────────────────────────────────────────
export async function suggestBankBinanceMatches(
  userId: string,
): Promise<BankMatchSuggestion[]> {
  // Egresos bancarios sin match
  const bankMovements = await prisma.bankMovement.findMany({
    where: {
      userId,
      direction:                  "OUTFLOW",
      matchedPortfolioMovementId: null,
    },
    orderBy: { occurredAt: "desc" },
    take: 500,
  });

  if (bankMovements.length === 0) return [];

  // Rango de fechas para la query de portfolio
  const dates   = bankMovements.map(m => m.occurredAt.getTime());
  const minDate = new Date(Math.min(...dates) - WINDOW_DAYS * 86_400_000);
  const maxDate = new Date(Math.max(...dates) + WINDOW_DAYS * 86_400_000);

  // Movimientos Binance en el rango
  const portfolioMovements = await prisma.portfolioMovement.findMany({
    where: {
      userId,
      source:     { in: BINANCE_SOURCES },
      type:       { in: ["BUY", "DEPOSIT"] },
      deletedAt:  null,
      executedAt: { gte: minDate, lte: maxDate },
    },
    orderBy: { executedAt: "desc" },
  });

  if (portfolioMovements.length === 0) return [];

  // Calcular sugerencias
  const suggestions: BankMatchSuggestion[] = [];

  for (const bank of bankMovements) {
    let best: BankMatchSuggestion | null = null;
    let bestConf = 0;

    for (const portfolio of portfolioMovements) {
      const days     = daysBetween(bank.occurredAt, portfolio.executedAt);
      if (days > WINDOW_DAYS) continue;

      const dScore   = descScore(bank.description);
      const dtScore  = dateScore(days);
      const tScore   = typeScore(portfolio.type);
      const conf     = Math.min(1.00, dScore + dtScore + tScore);

      if (conf <= 0 || conf <= bestConf) continue;

      bestConf = conf;
      best = {
        bankMovementId:      bank.id,
        portfolioMovementId: portfolio.id,
        confidence:          Math.round(conf * 100) / 100,
        reason:              buildReason(dScore > 0, days, tScore > 0),
      };
    }

    if (best) suggestions.push(best);
  }

  return suggestions.sort((a, b) => b.confidence - a.confidence);
}
