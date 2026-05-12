export interface PortfolioMovement {
  id: string;
  portfolioId: string;

  type: string;

  assetInId?: string;
  quantityIn?: string;

  assetOutId?: string;
  quantityOut?: string;

  priceUsd?: string;

  feeAssetId?: string;
  feeQuantity?: string;

  source: string;
  externalId?: string;

  executedAt: Date;
  createdAt: Date;
}