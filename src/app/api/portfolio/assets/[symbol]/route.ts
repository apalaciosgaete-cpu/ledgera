import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/shared";
import { rebuildTaxEvents } from "@/modules/tax/application/rebuildTaxEvents";
import { assertPeriodOpen } from "@/modules/tax/domain/periodGuard";
import { enforceCsrfProtection } from "@/modules/security/application/csrfProtection";

type RouteContext = {
  params: Promise<{ symbol: string }>;
};

type DeleteAssetBody = {
  reason?: string;
};

function jsonError(message: string, status: number, data: unknown = null) {
  return NextResponse.json({ ok: false, message, data }, { status });
}

function normalizeSymbol(value: string) {
  return decodeURIComponent(value).trim().toUpperCase();
}

async function readDeleteReason(request: NextRequest) {
  try {
    const body = (await request.json()) as DeleteAssetBody;
    return String(body.reason ?? "").trim();
  } catch {
    return "";
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const csrfResponse = enforceCsrfProtection(request);

  if (csrfResponse) {
    return csrfResponse;
  }

  const auth = await requireAuth(request);
  if (!auth || auth instanceof NextResponse) {
    return jsonError("No autorizado", 401);
  }

  try {
    const { symbol: rawSymbol } = await context.params;
    const symbol = normalizeSymbol(rawSymbol);
    const reason = await readDeleteReason(request);

    if (!symbol) {
      return jsonError("El activo es obligatorio.", 400);
    }

    if (!reason) {
      return jsonError("El motivo de eliminación es obligatorio.", 400);
    }

    const movements = await prisma.portfolioMovement.findMany({
      where: {
        userId: auth.user.id,
        symbol,
        deletedAt: null,
      },
      orderBy: [{ executedAt: "asc" }, { id: "asc" }],
      select: {
        id: true,
        executedAt: true,
      },
    });

    if (movements.length === 0) {
      return jsonError("No existen movimientos activos para este activo.", 404);
    }

    const checkedYears = new Set<number>();

    for (const movement of movements) {
      const year = new Date(movement.executedAt).getUTCFullYear();
      if (checkedYears.has(year)) continue;
      checkedYears.add(year);
      await assertPeriodOpen(new Date(movement.executedAt), auth.user.id);
    }

    const deletedAt = new Date();
    const deletedReason = `Eliminación de activo ${symbol}: ${reason}`;
    const movementIds = movements.map((movement) => movement.id);

    await prisma.portfolioMovement.updateMany({
      where: {
        userId: auth.user.id,
        id: { in: movementIds },
        deletedAt: null,
      },
      data: {
        deletedAt,
        deletedReason,
      },
    });

    const motorResult = await rebuildTaxEvents(auth.user.id);

    if (!motorResult.ok) {
      await prisma.portfolioMovement.updateMany({
        where: {
          userId: auth.user.id,
          id: { in: movementIds },
          deletedAt,
        },
        data: {
          deletedAt: null,
          deletedReason: null,
        },
      });

      return jsonError("Error en el motor tributario. La eliminación fue revertida.", 500);
    }

    return NextResponse.json({
      ok: true,
      message: `Activo ${symbol} eliminado correctamente.`,
      data: {
        symbol,
        deletedMovements: movementIds.length,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes("período tributario")) {
      return jsonError(error.message, 409);
    }

    console.error("[api/portfolio/assets/[symbol]]", error);
    return jsonError("Error interno al eliminar el activo.", 500);
  }
}
