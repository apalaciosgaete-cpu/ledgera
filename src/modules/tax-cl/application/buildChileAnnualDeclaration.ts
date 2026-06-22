import { classifyChileCryptoTaxEvent } from "./classifyChileCryptoTaxEvent";

export type AnnualDeclarationLine = {
  symbol:              string;
  eventType:           string;
  category:            string;
  totalQuantity:       number;
  totalProceedsClp:    number;
  totalCostBasisClp:   number;
  realizedPnlClp:      number;
  occurrenceCount:     number;
};

export type ChileAnnualDeclaration = {
  userId:       string;
  taxYear:      number;
  generatedAt:  Date;
  lines:        AnnualDeclarationLine[];
  totalGainClp: number;
  totalLossClp: number;
  netPnlClp:    number;
  pendingCount: number;
};

type TaxEventRow = {
  symbol:              string;
  normalizedEventType: string;
  quantity:            number;
  proceedsGrossClp:    number;
  costBasisClp:        number;
  realizedPnlClp:      number;
};

export function buildChileAnnualDeclaration(
  userId:  string,
  taxYear: number,
  events:  TaxEventRow[],
): ChileAnnualDeclaration {
  const grouped = new Map<string, AnnualDeclarationLine>();

  for (const e of events) {
    const cl     = classifyChileCryptoTaxEvent(e.normalizedEventType);
    const key    = `${e.symbol}::${e.normalizedEventType}`;
    const existing = grouped.get(key);

    if (existing) {
      existing.totalQuantity    += e.quantity;
      existing.totalProceedsClp += e.proceedsGrossClp;
      existing.totalCostBasisClp += e.costBasisClp;
      existing.realizedPnlClp   += e.realizedPnlClp;
      existing.occurrenceCount  += 1;
    } else {
      grouped.set(key, {
        symbol:            e.symbol,
        eventType:         e.normalizedEventType,
        category:          cl.category,
        totalQuantity:     e.quantity,
        totalProceedsClp:  e.proceedsGrossClp,
        totalCostBasisClp: e.costBasisClp,
        realizedPnlClp:    e.realizedPnlClp,
        occurrenceCount:   1,
      });
    }
  }

  const lines = [...grouped.values()];

  const totalGainClp = lines.reduce((s, l) => s + Math.max(0, l.realizedPnlClp), 0);
  const totalLossClp = lines.reduce((s, l) => s + Math.min(0, l.realizedPnlClp), 0);
  const netPnlClp    = totalGainClp + totalLossClp;
  const pendingCount = lines.filter((l) => l.category === "PENDIENTE").length;

  return {
    userId,
    taxYear,
    generatedAt: new Date(),
    lines,
    totalGainClp,
    totalLossClp,
    netPnlClp,
    pendingCount,
  };
}
