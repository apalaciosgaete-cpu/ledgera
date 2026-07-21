import { getDb } from "@/infrastructure/db/client";
import type { Asset } from "@/modules/portfolio/domain/asset";

interface CreateAssetInput {
  symbol: string;
  name: string;
  decimals?: number;
}

function mapRow(row: {
  id: string;
  symbol: string;
  name: string;
  decimals: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}): Asset {
  return {
    id: row.id,
    symbol: row.symbol,
    name: row.name,
    decimals: row.decimals,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getAssets(): Promise<Asset[]> {
  const result = await getDb().query(
    `
      select
        id,
        symbol,
        name,
        decimals,
        is_active,
        created_at,
        updated_at
      from assets
      order by symbol asc
    `
  );

  return result.rows.map(mapRow);
}

export async function getAssetBySymbol(symbol: string): Promise<Asset | null> {
  const result = await getDb().query(
    `
      select
        id,
        symbol,
        name,
        decimals,
        is_active,
        created_at,
        updated_at
      from assets
      where symbol = $1
      limit 1
    `,
    [symbol.trim().toUpperCase()]
  );

  if (result.rows.length === 0) {
    return null;
  }

  return mapRow(result.rows[0]);
}

export async function createAsset(input: CreateAssetInput): Promise<Asset> {
  const result = await getDb().query(
    `
      insert into assets (
        symbol,
        name,
        decimals
      )
      values ($1, $2, $3)
      returning
        id,
        symbol,
        name,
        decimals,
        is_active,
        created_at,
        updated_at
    `,
    [
      input.symbol.trim().toUpperCase(),
      input.name.trim(),
      input.decimals ?? 8,
    ]
  );

  return mapRow(result.rows[0]);
}
