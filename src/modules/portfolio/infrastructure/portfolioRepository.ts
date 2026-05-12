import { db } from "@/infrastructure/db/client";
import type { Portfolio } from "@/modules/portfolio/domain/portfolio";

function mapRow(row: {
  id: string;
  user_id: string;
  name: string;
  created_at: Date;
  updated_at: Date;
}): Portfolio {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getPortfolioByUserId(
  userId: string
): Promise<Portfolio | null> {
  const result = await db.query(
    `
      select
        id,
        user_id,
        name,
        created_at,
        updated_at
      from portfolios
      where user_id = $1
      limit 1
    `,
    [userId]
  );

  if (result.rows.length === 0) {
    return null;
  }

  return mapRow(result.rows[0]);
}

export async function createPortfolio(userId: string): Promise<Portfolio> {
  const result = await db.query(
    `
      insert into portfolios (
        user_id,
        name
      )
      values ($1, $2)
      returning
        id,
        user_id,
        name,
        created_at,
        updated_at
    `,
    [userId, "Main Portfolio"]
  );

  return mapRow(result.rows[0]);
}