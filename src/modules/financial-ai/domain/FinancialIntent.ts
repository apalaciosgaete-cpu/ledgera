export const FINANCIAL_INTENT = {
  CRYPTO_BUY:        "CRYPTO_BUY",
  CRYPTO_SELL:       "CRYPTO_SELL",
  P2P:               "P2P",
  INTERNAL_TRANSFER: "INTERNAL_TRANSFER",
  EXCHANGE_DEPOSIT:  "EXCHANGE_DEPOSIT",
  EXCHANGE_WITHDRAW: "EXCHANGE_WITHDRAW",
  STABLECOIN_ROUTE:  "STABLECOIN_ROUTE",
  NORMAL_BANKING:    "NORMAL_BANKING",
  UNKNOWN:           "UNKNOWN",
} as const;

export type FinancialIntent = typeof FINANCIAL_INTENT[keyof typeof FINANCIAL_INTENT];

export type IntentSignal = {
  code:       string;
  weight:     number;
  description: string;
};

export type IntentClassification = {
  intent:     FinancialIntent;
  confidence: number;
  signals:    IntentSignal[];
  risk:       "LOW" | "MEDIUM" | "HIGH";
};

export type TransactionContext = {
  description:   string;
  amountClp:     number;
  direction:     "INFLOW" | "OUTFLOW";
  occurredAt:    Date;
  bankName?:     string | null;
  bankCategory?: string | null;
};
