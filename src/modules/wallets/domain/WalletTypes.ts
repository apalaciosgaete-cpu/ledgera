export const WALLET_NETWORK = {
  ETHEREUM:  "ETHEREUM",
  POLYGON:   "POLYGON",
  BSC:       "BSC",
  ARBITRUM:  "ARBITRUM",
  OPTIMISM:  "OPTIMISM",
  BASE:      "BASE",
  SOLANA:    "SOLANA",
  BITCOIN:   "BITCOIN",
} as const;

export type WalletNetwork = typeof WALLET_NETWORK[keyof typeof WALLET_NETWORK];

export const WALLET_STATUS = {
  ACTIVE:   "ACTIVE",
  INACTIVE: "INACTIVE",
  ERROR:    "ERROR",
} as const;

export type WalletStatus = typeof WALLET_STATUS[keyof typeof WALLET_STATUS];

export type WalletConnection = {
  id:         string;
  userId:     string;
  network:    WalletNetwork;
  address:    string;
  label:      string | null;
  status:     WalletStatus;
  lastSyncAt: Date | null;
  createdAt:  Date;
};

export type OnchainDecodedEvent = {
  id:           string;
  txId:         string;
  userId:       string;
  eventType:    string;
  contractAddr: string | null;
  tokenSymbol:  string | null;
  tokenAmount:  string | null;
  fromAddr:     string | null;
  toAddr:       string | null;
  usdValue:     number | null;
  taxTreatment: string | null;
};
