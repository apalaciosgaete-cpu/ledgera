export type NormalizedExchangeMovementType =
  | "BUY"
  | "SELL"
  | "DEPOSIT"
  | "WITHDRAWAL"
  | "FEE"
  | "TRANSFER"
  | "UNKNOWN";

export type NormalizedExchangeMovement = {
  id: string;
  userId: string;
  exchange: "BINANCE";
  rawEventId: string;
  type: NormalizedExchangeMovementType;
  symbol: string | null;
  quantity: number | null;
  priceUsd: number | null;
  feeUsd: number | null;
  occurredAt: Date;
  confidence: number;
  requiresReview: boolean;
  metadata: Record<string, unknown>;
};
