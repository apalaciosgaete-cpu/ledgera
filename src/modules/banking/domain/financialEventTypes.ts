export type FinancialEventType =
  | "CRYPTO_BUY"
  | "CRYPTO_SELL"
  | "EXCHANGE_DEPOSIT"
  | "EXCHANGE_WITHDRAWAL"
  | "P2P"
  | "INTERNAL_TRANSFER"
  | "UNKNOWN";

export type FinancialEventCertainty =
  | "HIGH"
  | "MEDIUM"
  | "LOW";

export type FinancialEventClassification = {
  eventType: FinancialEventType;
  certainty: FinancialEventCertainty;
  label: string;
  reason: string;
  evidence: string[];
};
