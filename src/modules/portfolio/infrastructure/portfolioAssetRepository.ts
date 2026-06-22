import { db } from "@/infrastructure/db/client";
import type { PortfolioAsset } from "@/modules/portfolio/domain/portfolioAsset";

interface AddPortfolioAssetInput {
  portfolioId: string;
  assetId: string;
  quantity?: string;
  averageCost?: string;
}

function mapRow(row: {
  id: string;
  portfolio_id: string;
  asset_id: string;
  quantity: string;
  average_cost: string;
  created_at: Date;
  updated_at: Date;
}): PortfolioAsset {
  return {
    id: row.id,
    portfolioId: row.portfolio_id,
    assetId: row.asset_id,
    quantity: row.quantity,
    averageCost: row.average_cost,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getPortfolioAssets(
  portfolioId: string
): Promise<PortfolioAsset[]> {
  const result = await db.query(
    `
      select
        id,
        portfolio_id,
        asset_id,
        quantity,
        average_cost,
        created_at,
        updated_at
      from portfolio_assets
      where portfolio_id = $1
      order by created_at asc
    `,
    [portfolioId]
  );

  return result.rows.map(mapRow);
}

export async function addPortfolioAsset(
  input: AddPortfolioAssetInput
): Promise<PortfolioAsset> {
  const result = await db.query(
    `
      insert into portfolio_assets (
        portfolio_id,
        asset_id,
        quantity,
        average_cost
      )
      values ($1, $2, $3, $4)
      returning
        id,
        portfolio_id,
        asset_id,
        quantity,
        average_cost,
        created_at,
        updated_at
    `,
    [
      input.portfolioId,
      input.assetId,
      input.quantity ?? "0",
      input.averageCost ?? "0",
    ]
  );

  return mapRow(result.rows[0]);
}