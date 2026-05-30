import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  calculatePortfolio,
  type PortfolioMovement,
  type PortfolioMovementType,
} from "@/modules/portfolio/application/calculatePortfolio";
import { buildUserScopeWhere } from "@/modules/identity/domain/accessPolicy";
import { ok, fail, serverError } from "@/shared/apiResponse";
import { requireAuth } from "@/shared";

type RawPortfolioMovement = {
  id: string;
  type: string;
  symbol: string;
  quantity: number;
  priceUsd: number;
  feeUsd: number;
  executedAt: Date;
};

type HiddenAssetRow = {
  symbol: string;
};

function normalizeMovementType(value: string): PortfolioMovementType | null {
  if (value === "BUY" || value === "SELL" || value === "DEPOSIT" || value === "WITHDRAW") return value;
  return null;
}

async function ensureAssetVisibilityTable() {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS portfolio_asset_visibility_preferences (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      symbol TEXT NOT NULL,
      hidden BOOLEAN NOT NULL DEFAULT TRUE,
      hidden_reason TEXT,
      hidden_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT portfolio_asset_visibility_preferences_user_symbol_unique UNIQUE (user_id, symbol)
    )
  `);

  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS portfolio_asset_visibility_preferences_user_hidden_idx
    ON portfolio_asset_visibility_preferences (user_id, hidden)
  `);
}

async function getHiddenSymbols(userId: string) {
  await ensureAssetVisibilityTable();

  const rows = await prisma.$queryRawUnsafe<HiddenAssetRow[]>(
    `
      SELECT symbol
      FROM portfolio_asset_visibility_preferences
      WHERE user_id = $1
        AND hidden = TRUE
    `,
    userId,
  );

  return new Set(rows.map((row) => row.symbol.trim().toUpperCase()).filter(Boolean));
}

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth || auth instanceof NextResponse) return fail("No autorizado.", 401);

  try {
    const hiddenSymbols = await getHiddenSymbols(auth.user.id);

    const rawMovements = (await prisma.portfolioMovement.findMany({
      where: {
        deletedAt: null,
        ...buildUserScopeWhere(auth.user),
      },
      orderBy: {
        executedAt: "asc",
      },
      select: {
        id: true,
        type: true,
        symbol: true,
        quantity: true,
        priceUsd: true,
        feeUsd: true,
        executedAt: true,
      },
    })) as RawPortfolioMovement[];

    const movements: PortfolioMovement[] = [];

    for (const movement of rawMovements) {
      const symbol = movement.symbol.trim().toUpperCase();
      if (hiddenSymbols.has(symbol)) continue;

      const type = normalizeMovementType(movement.type);
      if (!type) continue;

      movements.push({
        id: movement.id,
        type,
        symbol,
        quantity: movement.quantity,
        priceUsd: movement.priceUsd,
        feeUsd: movement.feeUsd,
        occurredAt: movement.executedAt,
      });
    }

    const portfolio = await calculatePortfolio(movements);

    return ok(
      {
        ...portfolio,
        hiddenAssets: Array.from(hiddenSymbols),
      },
      "Portfolio calculado correctamente.",
    );
  } catch (error) {
    return serverError(error);
  }
}
