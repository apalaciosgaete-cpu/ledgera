import { classifyChileCryptoTaxEvent } from "./classifyChileCryptoTaxEvent";

export type TaxRiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type TaxRiskFactor = {
  code:        string;
  level:       TaxRiskLevel;
  description: string;
  weight:      number;
};

export type TaxRiskResult = {
  level:   TaxRiskLevel;
  score:   number;
  factors: TaxRiskFactor[];
};

type TaxEventSummary = {
  normalizedEventType: string;
  amountUsd:           number;
  occurredAt:          Date;
};

export function calculateChileTaxRisk(events: TaxEventSummary[]): TaxRiskResult {
  const factors: TaxRiskFactor[] = [];
  let score = 0;

  const pending = events.filter(
    (e) => classifyChileCryptoTaxEvent(e.normalizedEventType).category === "PENDIENTE",
  );
  if (pending.length > 0) {
    const w = Math.min(0.4, 0.05 * pending.length);
    factors.push({
      code:        "PENDING_EVENTS",
      level:       "HIGH",
      description: `${pending.length} evento(s) sin clasificar — requieren revisión manual`,
      weight:      w,
    });
    score += w;
  }

  const highValueSells = events.filter(
    (e) => e.normalizedEventType === "SPOT_SELL" && e.amountUsd >= 10_000,
  );
  if (highValueSells.length > 0) {
    const w = Math.min(0.3, 0.1 * highValueSells.length);
    factors.push({
      code:        "HIGH_VALUE_SELLS",
      level:       "MEDIUM",
      description: `${highValueSells.length} venta(s) de alto valor (≥ USD 10.000)`,
      weight:      w,
    });
    score += w;
  }

  const yearMap = new Map<number, number>();
  for (const e of events) {
    const y = e.occurredAt.getFullYear();
    yearMap.set(y, (yearMap.get(y) ?? 0) + 1);
  }
  if (yearMap.size > 1) {
    factors.push({
      code:        "MULTI_YEAR",
      level:       "LOW",
      description: `Operaciones en ${yearMap.size} años tributarios distintos`,
      weight:      0.05,
    });
    score += 0.05;
  }

  const stakingRewards = events.filter((e) => e.normalizedEventType === "STAKING_REWARD");
  if (stakingRewards.length > 0) {
    const total = stakingRewards.reduce((s, e) => s + e.amountUsd, 0);
    const w     = total >= 5_000 ? 0.2 : 0.1;
    factors.push({
      code:        "STAKING_INCOME",
      level:       total >= 5_000 ? "HIGH" : "MEDIUM",
      description: `Ingresos por staking: USD ${total.toFixed(2)} — declaración obligatoria`,
      weight:      w,
    });
    score += w;
  }

  const finalScore = Math.min(score, 1);
  const level: TaxRiskLevel =
    finalScore >= 0.7 ? "CRITICAL" :
    finalScore >= 0.45 ? "HIGH" :
    finalScore >= 0.2  ? "MEDIUM" : "LOW";

  return { level, score: finalScore, factors };
}
