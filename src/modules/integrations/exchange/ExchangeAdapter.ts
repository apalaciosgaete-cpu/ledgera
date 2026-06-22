import type { ExchangeProvider } from "./ExchangeProvider";

export type ExchangeCredentials = {
  apiKey:    string;
  apiSecret: string;
};

export type ExchangeRawRecord = {
  externalId:   string;
  externalType: string;
  occurredAt:   Date;
  rawPayload:   Record<string, unknown>;
};

export type ExchangeNormalizedRecord = {
  externalId:          string;
  externalType:        string;
  normalizedEventType: string;
  symbol:              string;
  quantity:            number;
  priceUsd:            number;
  feeUsd:              number;
  occurredAt:          Date;
  taxTreatment:        string;
  inventoryEffect:     string;
  economicEffect:      string;
  normalizedJson:      string;
};

export type SyncPeriodInput = {
  userId:      string;
  credentials: ExchangeCredentials;
  from:        Date;
  to:          Date;
};

export type SyncPeriodResult = {
  provider:  ExchangeProvider;
  synced:    number;
  skipped:   number;
  errors:    string[];
};

export type ConnectionTestResult = {
  ok:       boolean;
  provider: ExchangeProvider;
  message:  string;
};

export interface ExchangeAdapter {
  readonly provider: ExchangeProvider;

  testConnection(credentials: ExchangeCredentials): Promise<ConnectionTestResult>;

  fetchRaw(input: SyncPeriodInput): Promise<ExchangeRawRecord[]>;

  normalize(raw: ExchangeRawRecord): ExchangeNormalizedRecord | null;
}
