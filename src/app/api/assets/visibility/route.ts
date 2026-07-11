import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/shared";
import { fail, ok, serverError } from "@/shared/apiResponse";
import { enforceCsrfProtection } from "@/modules/security/application/csrfProtection";
import { normalizeSymbol } from "@/shared/utils/math";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type HiddenAssetRow = {
  symbol: string;
};

type VisibilityBody = {
  symbol?: string;
  all?: boolean;
};

async function ensureVisibilityTable(): Promise<void> {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS asset_visibility_preferences (
      id TEXT PRIMARY KEY,
      "userId" TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      symbol TEXT NOT NULL,
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE ("userId", symbol)
    )
  `);

  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS idx_asset_visibility_user
    ON asset_visibility_preferences ("userId")
  `);
}

function readSymbol(value: unknown): string {
  const symbol = normalizeSymbol(String(value ?? ""));
  return /^[A-Z0-9][A-Z0-9._-]{0,31}$/.test(symbol) ? symbol : "";
}

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth || auth instanceof NextResponse) return fail("No autorizado.", 401);

  try {
    await ensureVisibilityTable();

    const rows = await prisma.$queryRaw<HiddenAssetRow[]>`
      SELECT symbol
      FROM asset_visibility_preferences
      WHERE "userId" = ${auth.user.id}
      ORDER BY symbol ASC
    `;

    return ok(
      { symbols: rows.map((row) => row.symbol) },
      "Preferencias de visibilidad obtenidas correctamente.",
    );
  } catch (error) {
    return serverError(error);
  }
}

export async function POST(request: NextRequest) {
  const csrf = enforceCsrfProtection(request);
  if (csrf) return csrf;

  const auth = await requireAuth(request);
  if (!auth || auth instanceof NextResponse) return fail("No autorizado.", 401);

  try {
    const body = (await request.json()) as VisibilityBody;
    const symbol = readSymbol(body.symbol);
    if (!symbol) return fail("El símbolo del activo no es válido.", 400);

    await ensureVisibilityTable();

    await prisma.$executeRaw`
      INSERT INTO asset_visibility_preferences (id, "userId", symbol)
      VALUES (${randomUUID()}, ${auth.user.id}, ${symbol})
      ON CONFLICT ("userId", symbol) DO NOTHING
    `;

    return ok(
      { symbol },
      `${symbol} quedó oculto de forma persistente en el resumen de activos.`,
      201,
    );
  } catch (error) {
    return serverError(error);
  }
}

export async function DELETE(request: NextRequest) {
  const csrf = enforceCsrfProtection(request);
  if (csrf) return csrf;

  const auth = await requireAuth(request);
  if (!auth || auth instanceof NextResponse) return fail("No autorizado.", 401);

  try {
    const body = (await request.json().catch(() => ({}))) as VisibilityBody;
    await ensureVisibilityTable();

    if (body.all === true) {
      const restored = await prisma.$executeRaw`
        DELETE FROM asset_visibility_preferences
        WHERE "userId" = ${auth.user.id}
      `;

      return ok(
        { restored },
        "Todos los activos ocultos fueron restaurados.",
      );
    }

    const symbol = readSymbol(body.symbol);
    if (!symbol) return fail("El símbolo del activo no es válido.", 400);

    const restored = await prisma.$executeRaw`
      DELETE FROM asset_visibility_preferences
      WHERE "userId" = ${auth.user.id}
        AND symbol = ${symbol}
    `;

    return ok(
      { symbol, restored },
      `${symbol} volvió a mostrarse en el resumen de activos.`,
    );
  } catch (error) {
    return serverError(error);
  }
}
