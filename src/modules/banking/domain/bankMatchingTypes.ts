export type BankMatchSuggestion = {
  bankMovementId: string;
  portfolioMovementId: string;
  confidence: number;
  reason: string;
  bank: {
    occurredAt: string;
    description: string;
    amountClp: number;
  };
  crypto: {
    occurredAt: string;
    type: string;
    symbol: string;
    quantity: number;
    priceUsd: number;
    source: string | null;
  };
};
