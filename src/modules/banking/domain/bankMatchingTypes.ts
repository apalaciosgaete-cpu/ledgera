import type {
  FinancialEventCertainty,
  FinancialEventType,
} from "./financialEventTypes";

export type BankMatchSuggestion = {
  bankMovementId: string;

  /**
   * Puede ser null si el evento exchange aún no generó PortfolioMovement.
   */
  portfolioMovementId: string | null;

  exchangeExternalId: string;
  exchangeProvider: string;

  confidence: number;
  reason: string;

  eventType: FinancialEventType;
  eventLabel: string;
  certainty: FinancialEventCertainty;
  evidence: string[];

  bank: {
    occurredAt: string;
    description: string;
    amountClp: number;
    direction: "INFLOW" | "OUTFLOW";
  };

  exchange: {
    occurredAt: string;
    provider: string;
    externalId: string;
    eventType: string;
    asset: string;
    quantity: number;
    priceUsd: number;
    estimatedUsd: number;
    taxTreatment: string | null;
    inventoryEffect: string | null;
    economicEffect: string | null;
  };
};
