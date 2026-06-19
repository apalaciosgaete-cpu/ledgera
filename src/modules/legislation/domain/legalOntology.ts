export const legalOntology = {
  transaction: ["asset", "date", "amount", "value", "cost", "document"],
  disposal: ["result", "costBasis", "proceeds", "period", "evidence"],
  exchange: ["assetOut", "assetIn", "valuation", "spread", "evidence"],
  yield: ["source", "platform", "reward", "period", "classification"],
  custodyTransfer: ["originWallet", "destinationWallet", "ownership", "traceability"],
  sourceOfFunds: ["bank", "income", "savings", "investment", "inheritance", "loan"],
  documentation: ["csv", "bankStatement", "receipt", "walletProof", "declaration"],
} as const;

export type LegalOntology = typeof legalOntology;
