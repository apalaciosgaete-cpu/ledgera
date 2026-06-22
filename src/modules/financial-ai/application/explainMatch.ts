type MatchExplanationInput = {
  bankAmountClp:   number;
  bankDirection:   "INFLOW" | "OUTFLOW";
  bankOccurredAt:  Date;
  pmType:          string;
  pmSymbol:        string;
  pmQuantity:      number;
  pmPriceUsd:      number;
  pmExecutedAt:    Date;
  confidence:      number;
  usdClpRate?:     number;
};

export type MatchExplanation = {
  summary:     string;
  details:     string[];
  confidence:  number;
  confidenceLabel: "Alta" | "Media" | "Baja";
};

const PM_TYPE_LABELS: Record<string, string> = {
  BUY:      "compra",
  SELL:     "venta",
  DEPOSIT:  "depósito",
  WITHDRAW: "retiro",
};

const DIRECTION_LABELS = { INFLOW: "ingreso", OUTFLOW: "egreso" };

export function explainMatch(input: MatchExplanationInput): MatchExplanation {
  const details: string[] = [];

  const dayDiff = Math.abs(
    (input.bankOccurredAt.getTime() - input.pmExecutedAt.getTime()) / (1000 * 60 * 60 * 24),
  );
  if (dayDiff < 0.1) details.push("Misma fecha y hora");
  else if (dayDiff < 1)  details.push(`${(dayDiff * 24).toFixed(1)} horas de diferencia`);
  else                   details.push(`${dayDiff.toFixed(1)} días de diferencia`);

  if (input.usdClpRate && input.usdClpRate > 0) {
    const pmClp = input.pmQuantity * input.pmPriceUsd * input.usdClpRate;
    const diff  = Math.abs(input.bankAmountClp - pmClp) / Math.max(input.bankAmountClp, pmClp);
    if (diff < 0.01) details.push("Monto exacto");
    else if (diff < 0.05) details.push(`Monto ${(diff * 100).toFixed(1)}% de diferencia`);
  }

  const dir = DIRECTION_LABELS[input.bankDirection];
  const pmType = PM_TYPE_LABELS[input.pmType] ?? input.pmType.toLowerCase();
  details.push(`${dir === "ingreso" ? "Ingreso bancario" : "Egreso bancario"} coincide con ${pmType} de ${input.pmQuantity % 1 === 0 ? input.pmQuantity : input.pmQuantity.toFixed(6)} ${input.pmSymbol}`);

  const confidenceLabel = input.confidence >= 0.90 ? "Alta" : input.confidence >= 0.60 ? "Media" : "Baja" as const;

  return {
    summary:         `${confidenceLabel} coincidencia — ${pmType} ${input.pmSymbol}`,
    details,
    confidence:      input.confidence,
    confidenceLabel,
  };
}
