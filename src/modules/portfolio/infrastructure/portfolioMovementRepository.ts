import { db } from "@/infrastructure/db/client";

interface CreateMovementInput {
  portfolioId: string;
  type: "BUY" | "SELL";
  assetInId: string;
  quantityIn: number;
  priceUsd: number;
  executedAt: Date;
}

export async function createMovement(input: CreateMovementInput) {
  const result = await db.query(
    `
      insert into portfolio_movements (
        portfolio_id,
        type,
        asset_in_id,
        quantity_in,
        price_usd,
        executed_at
      )
      values ($1, $2, $3, $4, $5, $6)
      returning *
    `,
    [
      input.portfolioId,
      input.type,
      input.assetInId,
      input.quantityIn.toString(),
      input.priceUsd.toString(),
      input.executedAt,
    ]
  );

  return result.rows[0];
}