import type { GlobalComplementaryTaxBracket } from "@/modules/tax/domain/globalComplementaryTax";

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
  metadata: TaxDeclarationMetadata;
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

export type TaxDeclarationMetadata = {
  protocolVersion: "LEDGERA_DDJJ_V1";
  taxYear: number;
  declarationType: TaxDeclarationType;
  taxEngine: {
    version: string;
    algorithm: string;
    roundingMode: string;
    decimalPlaces: number;
    fxSource: string;
    normativa: string;
    regime: string;
  };
  taxPolicy: {
    regime: string;
    declarationCurrency: "CLP";
    siiDecimalPlaces: number;
    habituality: {
      yearlySellThreshold: number;
      symbolSellThreshold: number;
    };
    rates: {
      igcMaxRatePct: number;
      capitalGainFlatRatePct: number;
      firstCategoryRatePct: number;
    };
    globalComplementaryTax?: {
      currentTaxYear: number;
      legalReference: "LIR_ART_52";
      source: "SII";
      sourceUrl: string;
      brackets: GlobalComplementaryTaxBracket[];
    };
    utm: {
      valueClp: number;
      asOf: string;
    };
  };
  rounding: {
    cryptoDecimals: number;
    fiatDecimals: number;
    siiClpDecimals: number;
  };
  fx: {
    source: string;
    quote: "USDCLP";
  };
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
