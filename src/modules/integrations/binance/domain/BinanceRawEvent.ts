export type BinanceRawEventType =
  | "TRADE"
  | "DEPOSIT"
  | "WITHDRAWAL"
  | "FEE"
  | "TRANSFER"
  | "UNKNOWN";

export type BinanceRawEvent = {
  id: string;
  userId: string;
  exchange: "BINANCE";
  externalId: string;
  eventType: BinanceRawEventType;
  asset: string | null;
  amount: number | null;
  rawPayload: unknown;
  occurredAt: Date;
  importedAt: Date;
};
