export type DigitalOperatingStatus = "EMPTY" | "PARTIAL" | "IN_REVIEW" | "VALIDATED" | "REQUIRES_ACTION";

export type DigitalModuleKey =
  | "digitalWealth"
  | "cryptoAssets"
  | "sourceOfFunds"
  | "taxObligations"
  | "documentation";

export interface DigitalModuleDefinition {
  key: DigitalModuleKey;
  label: string;
  href: string;
  description: string;
  primaryQuestion: string;
  examples: string[];
  status: DigitalOperatingStatus;
}

export interface DigitalProfile {
  userId: string;
  status: DigitalOperatingStatus;
  modules: DigitalModuleDefinition[];
  updatedAt: string | null;
}

export interface CryptoAsset {
  id: string;
  symbol: string;
  name: string;
  quantity: number | null;
  estimatedValueClp: number | null;
  acquisitionCostClp: number | null;
  status: DigitalOperatingStatus;
}

export interface ExchangeAccount {
  id: string;
  provider: string;
  accountLabel: string;
  status: DigitalOperatingStatus;
  lastSyncAt: string | null;
}

export interface Wallet {
  id: string;
  label: string;
  network: string;
  address: string;
  ownerDeclared: boolean;
  status: DigitalOperatingStatus;
}

export interface SourceOfFunds {
  id: string;
  category: string;
  description: string;
  evidenceStatus: DigitalOperatingStatus;
}

export interface TaxObligation {
  id: string;
  eventType: string;
  period: string;
  status: DigitalOperatingStatus;
  description: string;
}

export interface DigitalDocument {
  id: string;
  name: string;
  category: string;
  status: DigitalOperatingStatus;
  relatedModule: DigitalModuleKey;
}

export interface SystemEvent {
  id: string;
  userId: string;
  type: string;
  description: string;
  createdAt: string;
}
