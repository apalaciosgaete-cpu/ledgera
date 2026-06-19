export const cryptoFirstOntology = {
  user: ["digitalProfile", "conversation", "documents"],
  digitalProfile: ["assets", "platforms", "custody", "sourceOfFunds", "taxEvents"],
  assets: ["bitcoin", "ethereum", "stablecoins", "tokens", "nfts"],
  platforms: ["binance", "bybit", "kraken", "coinbase", "other"],
  custody: ["hardware", "browser", "mobile", "manualAddress"],
  sourceOfFunds: ["income", "savings", "bankTransfer", "investment", "inheritance", "reward"],
  taxEvents: ["disposal", "exchange", "yield", "airdrop", "transfer"],
  documents: ["platformCsv", "bankStatement", "receipt", "declaration", "custodyProof"],
} as const;

export type CryptoFirstOntology = typeof cryptoFirstOntology;
