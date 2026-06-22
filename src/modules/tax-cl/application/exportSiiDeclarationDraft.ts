import type { ChileAnnualDeclaration } from "./buildChileAnnualDeclaration";

export type SiiDraftLine = {
  codigo:       string;
  descripcion:  string;
  monto:        number;
};

export type SiiDeclarationDraft = {
  formulario:  "F22";
  taxYear:     number;
  generatedAt: string;
  lines:       SiiDraftLine[];
  totalGanancia: number;
  totalPerdida:  number;
  baseImponible: number;
  disclaimer:  string;
};

export function exportSiiDeclarationDraft(declaration: ChileAnnualDeclaration): SiiDeclarationDraft {
  const lines: SiiDraftLine[] = [];

  const capitalGains = declaration.lines
    .filter((l) => l.category === "RENTA_CAPITAL" && l.realizedPnlClp > 0)
    .reduce((s, l) => s + l.realizedPnlClp, 0);

  const capitalLosses = declaration.lines
    .filter((l) => l.category === "RENTA_CAPITAL" && l.realizedPnlClp < 0)
    .reduce((s, l) => s + l.realizedPnlClp, 0);

  const stakingIncome = declaration.lines
    .filter((l) => l.category === "INGRESO_TRIBUTABLE")
    .reduce((s, l) => s + l.realizedPnlClp, 0);

  if (capitalGains > 0) {
    lines.push({
      codigo:      "712",
      descripcion: "Mayor valor obtenido en enajenación de criptomonedas (Art. 17 N°8 LIR)",
      monto:       Math.round(capitalGains),
    });
  }

  if (capitalLosses < 0) {
    lines.push({
      codigo:      "713",
      descripcion: "Pérdida en enajenación de criptomonedas",
      monto:       Math.round(Math.abs(capitalLosses)),
    });
  }

  if (stakingIncome > 0) {
    lines.push({
      codigo:      "154",
      descripcion: "Ingresos por staking y airdrops (Art. 20 N°5 LIR)",
      monto:       Math.round(stakingIncome),
    });
  }

  const baseImponible = Math.max(0, capitalGains + capitalLosses + Math.max(0, stakingIncome));

  return {
    formulario:    "F22",
    taxYear:       declaration.taxYear,
    generatedAt:   new Date().toISOString(),
    lines,
    totalGanancia: Math.round(capitalGains),
    totalPerdida:  Math.round(Math.abs(capitalLosses)),
    baseImponible: Math.round(baseImponible),
    disclaimer:    "Este borrador es orientativo. Consulta con un contador habilitado antes de presentar tu declaración. LEDGERA no es asesor tributario.",
  };
}
