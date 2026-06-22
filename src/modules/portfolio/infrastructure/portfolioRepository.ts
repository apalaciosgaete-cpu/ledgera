import { prisma } from "@/lib/prisma";
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

export async function getPortfolioByUserId(userId: string): Promise<Portfolio | null> {
  const portfolio = await prisma.portfolios.findFirst({ where: { user_id: userId } });
  if (!portfolio) return null;
  return mapRow(portfolio);
}

export async function createPortfolio(userId: string): Promise<Portfolio> {
  const portfolio = await prisma.portfolios.create({
    data: { user_id: userId, name: "Main Portfolio" },
  });
  return mapRow(portfolio);
}
