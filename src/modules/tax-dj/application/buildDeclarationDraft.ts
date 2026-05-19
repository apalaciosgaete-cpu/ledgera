import { createHash, randomUUID } from "crypto";

import type {
  TaxDeclarationDraft,
  TaxDeclarationEventLine,
  TaxDeclarationPayload,
  TaxDeclarationSymbolSummary,
  TaxDeclarationType,
} from "@/modules/tax-dj/domain/declaration";
import { round, normalizeSymbol } from "@/shared/utils/math";

export type TaxEventForDeclaration = {
  id: string;
  movementId: string;
  eventType: string;
  symbol: string;
  executedAt: Date;
  quantity: number;
  effectiveTaxCategory: string;
  proceedsNetUsd: number;
  proceedsNetClp: number;
  costBasisUsd: number;
  costBasisClp: number;
  feeUsd: number;
  feeClp: number;
  realizedPnlUsd: number;
  realizedPnlClp: number;
  usdClp: number;
};

type BuildDeclarationDraftInput = {
  userId: string;
  taxYear: number;
  declarationType: TaxDeclarationType;
  events: TaxEventForDeclaration[];
};

function serializeEvent(event: TaxEventForDeclaration): TaxDeclarationEventLine {
  return {
    taxEventId: event.id,
    movementId: event.movementId,
    eventType: event.eventType,
    symbol: normalizeSymbol(event.symbol),
    executedAt: event.executedAt.toISOString(),
    quantity: round(event.quantity, 8),
    effectiveTaxCategory: event.effectiveTaxCategory,
    proceedsNetUsd: round(event.proceedsNetUsd, 8),
    proceedsNetClp: round(event.proceedsNetClp, 4),
    costBasisUsd: round(event.costBasisUsd, 8),
    costBasisClp: round(event.costBasisClp, 4),
    feeUsd: round(event.feeUsd, 8),
    feeClp: round(event.feeClp, 4),
    realizedPnlUsd: round(event.realizedPnlUsd, 8),
    realizedPnlClp: round(event.realizedPnlClp, 4),
    usdClp: round(event.usdClp, 4),
  };
}

function buildPayload(events: TaxEventForDeclaration[]): TaxDeclarationPayload {
  const lines = events.map(serializeEvent);
  const bySymbolMap = new Map<string, TaxDeclarationSymbolSummary>();

  for (const line of lines) {
    const current =
      bySymbolMap.get(line.symbol) ??
      {
        symbol: line.symbol,
        events: 0,
        quantity: 0,
        proceedsUsd: 0,
        proceedsClp: 0,
        costBasisUsd: 0,
        costBasisClp: 0,
        feesUsd: 0,
        feesClp: 0,
        realizedPnlUsd: 0,
        realizedPnlClp: 0,
      };

    current.events += 1;
    current.quantity += line.quantity;
    current.proceedsUsd += line.proceedsNetUsd;
    current.proceedsClp += line.proceedsNetClp;
    current.costBasisUsd += line.costBasisUsd;
    current.costBasisClp += line.costBasisClp;
    current.feesUsd += line.feeUsd;
    current.feesClp += line.feeClp;
    current.realizedPnlUsd += line.realizedPnlUsd;
    current.realizedPnlClp += line.realizedPnlClp;

    bySymbolMap.set(line.symbol, current);
  }

  const bySymbol = Array.from(bySymbolMap.values()).map((item) => ({
    ...item,
    quantity: round(item.quantity, 8),
    proceedsUsd: round(item.proceedsUsd, 8),
    proceedsClp: round(item.proceedsClp, 4),
    costBasisUsd: round(item.costBasisUsd, 8),
    costBasisClp: round(item.costBasisClp, 4),
    feesUsd: round(item.feesUsd, 8),
    feesClp: round(item.feesClp, 4),
    realizedPnlUsd: round(item.realizedPnlUsd, 8),
    realizedPnlClp: round(item.realizedPnlClp, 4),
  }));

  return {
    summary: {
      totalEvents: lines.length,
      totalSymbols: bySymbol.length,
      totalProceedsUsd: round(lines.reduce((sum, line) => sum + line.proceedsNetUsd, 0), 8),
      totalProceedsClp: round(lines.reduce((sum, line) => sum + line.proceedsNetClp, 0), 4),
      totalCostBasisUsd: round(lines.reduce((sum, line) => sum + line.costBasisUsd, 0), 8),
      totalCostBasisClp: round(lines.reduce((sum, line) => sum + line.costBasisClp, 0), 4),
      totalFeesUsd: round(lines.reduce((sum, line) => sum + line.feeUsd, 0), 8),
      totalFeesClp: round(lines.reduce((sum, line) => sum + line.feeClp, 0), 4),
      totalRealizedPnlUsd: round(lines.reduce((sum, line) => sum + line.realizedPnlUsd, 0), 8),
      totalRealizedPnlClp: round(lines.reduce((sum, line) => sum + line.realizedPnlClp, 0), 4),
      pendingClassificationEvents: lines.filter(
        (line) =>
          !line.effectiveTaxCategory ||
          line.effectiveTaxCategory === "UNCLASSIFIED",
      ).length,
    },
    bySymbol,
    events: lines,
  };
}

function buildContentHash(payload: unknown): string {
  return createHash("sha256").update(JSON.stringify(payload)).digest("hex");
}

export function buildDeclarationDraft(
  input: BuildDeclarationDraftInput,
): TaxDeclarationDraft {
  const payloadJson = buildPayload(input.events);

  const contentHash = buildContentHash({
    userId: input.userId,
    taxYear: input.taxYear,
    declarationType: input.declarationType,
    payloadJson,
  });

  return {
    id: randomUUID(),
    userId: input.userId,
    taxYear: input.taxYear,
    declarationType: input.declarationType,
    status: "DRAFT",
    source: "SYSTEM",
    generatedAt: new Date().toISOString(),
    confirmedAt: null,
    contentHash,
    payloadJson,
  };
}