import { randomUUID } from "crypto";

import type {
  TaxDeclarationDraft,
  TaxDeclarationEventLine,
  TaxDeclarationMetadata,
  TaxDeclarationPayload,
  TaxDeclarationSymbolSummary,
  TaxDeclarationType,
} from "@/modules/tax-dj/domain/declaration";
import { computeDeclarationHash } from "@/modules/tax-dj/application/verifyDeclarationHash";
import { TAX_ENGINE_METADATA } from "@/modules/tax/domain/taxEngineVersion";
import { taxPolicy } from "@/modules/tax/domain/taxPolicy";
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

function buildMetadata(input: {
  taxYear: number;
  declarationType: TaxDeclarationType;
}): TaxDeclarationMetadata {
  return {
    protocolVersion: "LEDGERA_DDJJ_V1",
    taxYear: input.taxYear,
    declarationType: input.declarationType,
    taxEngine: TAX_ENGINE_METADATA,
    taxPolicy: {
      regime: taxPolicy.regime,
      declarationCurrency: taxPolicy.sii.declarationCurrency,
      siiDecimalPlaces: taxPolicy.sii.decimalPlaces,
      habituality: taxPolicy.habituality,
      rates: taxPolicy.rates,
      utm: taxPolicy.utm,
    },
    rounding: {
      cryptoDecimals: 8,
      fiatDecimals: 4,
      siiClpDecimals: taxPolicy.sii.decimalPlaces,
    },
    fx: {
      source: TAX_ENGINE_METADATA.fxSource,
      quote: "USDCLP",
    },
  };
}

function buildPayload(input: {
  taxYear: number;
  declarationType: TaxDeclarationType;
  events: TaxEventForDeclaration[];
}): TaxDeclarationPayload {
  const { events } = input;
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
    metadata: buildMetadata({
      taxYear: input.taxYear,
      declarationType: input.declarationType,
    }),
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

export function buildDeclarationDraft(
  input: BuildDeclarationDraftInput,
): TaxDeclarationDraft {
  const payloadJson = buildPayload({
    taxYear: input.taxYear,
    declarationType: input.declarationType,
    events: input.events,
  });
  const contentHash = computeDeclarationHash(payloadJson);

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
