export type MovementDto = {
  id: string;
  type: "BUY" | "SELL";
  symbol: string;
  quantity: number;
  priceUsd: number;
  feeUsd: number;
  executedAt: Date;
  deletedAt: Date | null;
  deletedReason: string | null;
};