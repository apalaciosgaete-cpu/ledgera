import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/shared";
import { enforceCsrfProtection } from "@/modules/security/application/csrfProtection";


// Force dynamic rendering because routes use request.headers/cookies
export const dynamic = 'force-dynamic';
type RouteContext = {
  params: Promise<{ symbol: string }>;
};

type HideAssetBody = {
  reason?: string;
};

function jsonError(message: string, status: number, data: unknown = null) {
  return NextResponse.json({ ok: false, message, data }, { status });
}

function normalizeSymbol(value: string) {
  return decodeURIComponent(value).trim().toUpperCase();
}

async function readReason(request: NextRequest) {
  try {
    const body = (await request.json()) as HideAssetBody;
    return String(body.reason ?? "").trim();
  } catch {
    return "";
  }
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

async function resolveAuth(request: NextRequest) {
  const csrfResponse = enforceCsrfProtection(request);
  if (csrfResponse) return { csrfResponse, auth: null };

  const auth = await requireAuth(request);
  if (!auth || auth instanceof NextResponse) return { csrfResponse: jsonError("No autorizado", 401), auth: null };

  return { csrfResponse: null, auth };
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const { csrfResponse, auth } = await resolveAuth(request);
  if (csrfResponse) return csrfResponse;
  if (!auth) return jsonError("No autorizado", 401);

  try {
    const { symbol: rawSymbol } = await context.params;
    const symbol = normalizeSymbol(rawSymbol);
    const reason = await readReason(request);

    if (!symbol) return jsonError("El activo es obligatorio.", 400);
    if (!reason) return jsonError("El motivo para ocultar el activo es obligatorio.", 400);

    const movementCount = await prisma.portfolioMovement.count({
      where: {
        userId: auth.user.id,
        symbol,
        deletedAt: null,
      },
    });

    if (movementCount === 0) {
      return jsonError("No existen movimientos activos para este activo.", 404);
    }

    await ensureAssetVisibilityTable();

    const preferenceId = `asset_visibility_${auth.user.id}_${symbol}`;

    await prisma.$executeRawUnsafe(
      `
        INSERT INTO portfolio_asset_visibility_preferences (
          id,
          user_id,
          symbol,
          hidden,
          hidden_reason,
          hidden_at,
          created_at,
          updated_at
        )
        VALUES ($1, $2, $3, TRUE, $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ON CONFLICT (user_id, symbol)
        DO UPDATE SET
          hidden = TRUE,
          hidden_reason = EXCLUDED.hidden_reason,
          hidden_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
      `,
      preferenceId,
      auth.user.id,
      symbol,
      reason,
    );

    return NextResponse.json({
      ok: true,
      message: `Activo ${symbol} ocultado del consolidado. El libro financiero no fue modificado.`,
      data: {
        symbol,
        hidden: true,
        affectedMovements: 0,
      },
    });
  } catch (error) {
    console.error("[api/portfolio/assets/[symbol]/DELETE]", error);
    return jsonError("Error interno al ocultar el activo.", 500);
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { csrfResponse, auth } = await resolveAuth(request);
  if (csrfResponse) return csrfResponse;
  if (!auth) return jsonError("No autorizado", 401);

  try {
    const { symbol: rawSymbol } = await context.params;
    const symbol = normalizeSymbol(rawSymbol);

    if (!symbol) return jsonError("El activo es obligatorio.", 400);

    await ensureAssetVisibilityTable();

    await prisma.$executeRawUnsafe(
      `
        UPDATE portfolio_asset_visibility_preferences
        SET hidden = FALSE,
            updated_at = CURRENT_TIMESTAMP
        WHERE user_id = $1
          AND symbol = $2
      `,
      auth.user.id,
      symbol,
    );

    return NextResponse.json({
      ok: true,
      message: `Activo ${symbol} restaurado en el consolidado.`,
      data: {
        symbol,
        hidden: false,
      },
    });
  } catch (error) {
    console.error("[api/portfolio/assets/[symbol]/PATCH]", error);
    return jsonError("Error interno al restaurar el activo.", 500);
  }
}
