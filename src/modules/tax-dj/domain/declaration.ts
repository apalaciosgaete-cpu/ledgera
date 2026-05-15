export type TaxDeclarationType =
  | "DJ_CRYPTO_SUMMARY"
  | "DJ_REALIZED_GAINS"
  | "DJ_FOREIGN_EXCHANGE_ACTIVITY"
  | "DJ_TAX_SUPPORTING_LEDGER";

export type TaxDeclarationStatus =
  | "DRAFT"
  | "REVIEW"
  | "CONFIRMED"
  | "EXPORTED"
  | "VOIDED";

export type TaxDeclarationDraft = {
  id: string;
  userId: string;
  taxYear: number;
  declarationType: TaxDeclarationType;
  status: TaxDeclarationStatus;
  source: "SYSTEM";
  generatedAt: string;
  confirmedAt: string | null;
  contentHash: string;
  payloadJson: TaxDeclarationPayload;
};

export type TaxDeclarationPayload = {
  summary: {
    totalEvents: number;
    totalSymbols: number;
    totalProceedsUsd: number;
    totalProceedsClp: number;
    totalCostBasisUsd: number;
    totalCostBasisClp: number;
    totalFeesUsd: number;
    totalFeesClp: number;
    totalRealizedPnlUsd: number;
    totalRealizedPnlClp: number;
    pendingClassificationEvents: number;
  };
  bySymbol: TaxDeclarationSymbolSummary[];
  events: TaxDeclarationEventLine[];
};

export type TaxDeclarationSymbolSummary = {
  symbol: string;
  events: number;
  quantity: number;
  proceedsUsd: number;
  proceedsClp: number;
  costBasisUsd: number;
  costBasisClp: number;
  feesUsd: number;
  feesClp: number;
  realizedPnlUsd: number;
  realizedPnlClp: number;
};

export type TaxDeclarationEventLine = {
  taxEventId: string;
  movementId: string;
  eventType: string;
  symbol: string;
  executedAt: string;
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