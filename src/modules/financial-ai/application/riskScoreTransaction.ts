import type { TransactionContext } from "../domain/FinancialIntent";

export type RiskFactor = {
  code:        string;
  severity:    "LOW" | "MEDIUM" | "HIGH";
  description: string;
  weight:      number;
};

export type RiskScore = {
  score:    number;
  level:    "LOW" | "MEDIUM" | "HIGH";
  factors:  RiskFactor[];
};

const HIGH_AMOUNT_CLP   = 10_000_000;   // 10M CLP
const MEDIUM_AMOUNT_CLP = 2_000_000;    // 2M CLP

export function riskScoreTransaction(ctx: TransactionContext): RiskScore {
  const factors: RiskFactor[] = [];

  // Amount risk
  if (ctx.amountClp >= HIGH_AMOUNT_CLP) {
    factors.push({ code: "HIGH_AMOUNT", severity: "HIGH", description: "Monto superior a $10.000.000", weight: 0.35 });
  } else if (ctx.amountClp >= MEDIUM_AMOUNT_CLP) {
    factors.push({ code: "MEDIUM_AMOUNT", severity: "MEDIUM", description: "Monto superior a $2.000.000", weight: 0.2 });
  }

  // Weekend / off-hours
  const h    = ctx.occurredAt.getHours();
  const dow  = ctx.occurredAt.getDay();
  if (dow === 0 || dow === 6) {
    factors.push({ code: "WEEKEND_TX", severity: "LOW", description: "Transacción en fin de semana", weight: 0.05 });
  }
  if (h < 6 || h > 22) {
    factors.push({ code: "OFF_HOURS", severity: "LOW", description: "Transacción fuera de horario", weight: 0.05 });
  }

  // Round amounts can indicate structuring
  if (ctx.amountClp >= 1_000_000 && ctx.amountClp % 1_000_000 === 0) {
    factors.push({ code: "STRUCTURED_AMOUNT", severity: "MEDIUM", description: "Monto estructurado (múltiplo exacto)", weight: 0.15 });
  }

  // Velocity (single transaction context — can't assess velocity without history)

  const totalWeight = factors.reduce((s, f) => s + f.weight, 0);
  const score       = Math.min(totalWeight, 1);
  const level       = score >= 0.5 ? "HIGH" : score >= 0.2 ? "MEDIUM" : "LOW";

  return { score, level, factors };
}
