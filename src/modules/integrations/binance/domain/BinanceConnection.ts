export type BinanceConnectionStatus =
  | "DISCONNECTED"
  | "CONNECTED"
  | "INVALID_CREDENTIALS"
  | "READONLY_REQUIRED"
  | "ERROR";

export type BinanceConnection = {
  id: string;
  userId: string;
  exchange: "BINANCE";
  apiKeyEncrypted: string;
  apiSecretEncrypted: string;
  status: BinanceConnectionStatus;
  permissions: string[];
  lastSyncAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};
