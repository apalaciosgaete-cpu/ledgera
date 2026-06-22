export type MatchFactors = {
  dateScore:   number;
  amountScore: number;
  typeScore:   number;
  sourceBonus: number;
};

export function buildMatchReason(confidence: number, factors: MatchFactors): string {
  const parts: string[] = [];

  if      (factors.amountScore >= 0.95) parts.push("monto exacto");
  else if (factors.amountScore >= 0.80) parts.push("monto aproximado");

  if      (factors.dateScore >= 0.95) parts.push("misma fecha");
  else if (factors.dateScore >= 0.70) parts.push("fecha cercana");

  if (factors.typeScore   > 0) parts.push("tipo compatible");
  if (factors.sourceBonus > 0) parts.push("fuente Binance");

  return parts.length > 0
    ? parts.join(", ")
    : `confianza ${(confidence * 100).toFixed(0)}%`;
}

export function confidenceLabel(confidence: number): string {
  if (confidence >= 0.90) return "Alta";
  if (confidence >= 0.60) return "Media";
  return "Baja";
}
