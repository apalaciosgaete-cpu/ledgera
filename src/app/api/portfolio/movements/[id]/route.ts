import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rebuildTaxEvents } from "@/modules/tax/application/rebuildTaxEvents";
import { assertPeriodOpen } from "@/modules/tax/domain/periodGuard";
import { requireAuth } from "@/shared";


// Force dynamic rendering because routes use request.headers/cookies
export const dynamic = 'force-dynamic';
type RouteContext = {
  params: Promise<{ id: string }>;
};

type DeleteMovementBody = {
  reason?: string;
};

type InventoryMovement = {
  id: string;
  type: string;
  symbol: string;
  quantity: number;
  executedAt: Date;
  deletedAt?: Date | null;
};

function jsonError(message: string, status: number, data: unknown = null) {
  return NextResponse.json({ ok: false, message, data }, { status });
}

async function readDeletionReason(request: NextRequest) {
  try {
    const body = (await request.json()) as DeleteMovementBody;
    return String(body.reason ?? "").trim();
  } catch {
    return "";
  }
}

function validateInventoryAfterExcludingMovement(movements: InventoryMovement[], movementIdToExclude: string) {
  const balances = new Map<string, number>();
  const sortedMovements = [...movements]
    .filter((movement) => !movement.deletedAt)
    .filter((movement) => movement.id !== movementIdToExclude)
    .sort((a, b) => {
      const dateDiff = new Date(a.executedAt).getTime() - new Date(b.executedAt).getTime();
      if (dateDiff !== 0) return dateDiff;
      return a.id.localeCompare(b.id);
    });

  for (const movement of sortedMovements) {
    const symbol = movement.symbol.trim().toUpperCase();
    const currentBalance = balances.get(symbol) ?? 0;
    const quantity = Number(movement.quantity) || 0;
    const nextBalance = movement.type === "BUY" ? currentBalance + quantity : currentBalance - quantity;

    if (nextBalance < -0.0000001) {
      return {
        ok: false as const,
        message:
          `No se puede anular este movimiento porque rompería el FIFO de ${symbol}. ` +
          `El saldo quedaría negativo en ${nextBalance.toFixed(8)} el ${new Date(movement.executedAt).toISOString()}.`,
        data: {
          symbol,
          corruptedAt: new Date(movement.executedAt).toISOString(),
          resultingQuantity: nextBalance,
          movementId: movement.id,
        },
      };
    }

    balances.set(symbol, nextBalance);
  }

  return { ok: true as const };
}

async function annulMovement(request: NextRequest, context: RouteContext) {
  const auth = await requireAuth(request);
  if (!auth || auth instanceof NextResponse) return jsonError("No autorizado", 401);

  try {
    const { id } = await context.params;
    const reason = await readDeletionReason(request);

    if (!reason) {
      return jsonError("El motivo de anulación es requerido.", 400);
    }

    const movement = await prisma.portfolioMovement.findUnique({
      where: { id },
    });

    if (!movement) {
      return jsonError("Movimiento no encontrado.", 404);
    }

    if (movement.userId !== auth.user.id) {
      return jsonError("Sin permisos sobre este movimiento.", 403);
    }

    if (movement.deletedAt) {
      return jsonError("El movimiento ya está anulado.", 409);
    }

    await assertPeriodOpen(new Date(movement.executedAt), auth.user.id);

    const activeMovements = (await prisma.portfolioMovement.findMany({
      where: {
        userId: auth.user.id,
        deletedAt: null,
      },
      orderBy: [{ executedAt: "asc" }, { id: "asc" }],
    })) as InventoryMovement[];

    const fifoValidation = validateInventoryAfterExcludingMovement(activeMovements, id);
    if (!fifoValidation.ok) {
      return jsonError(fifoValidation.message, 409, fifoValidation.data);
    }

    await prisma.portfolioMovement.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedReason: reason,
      },
    });

    const motorResult = await rebuildTaxEvents(auth.user.id);

    if (!motorResult.ok) {
      await prisma.portfolioMovement.update({
        where: { id },
        data: { deletedAt: null, deletedReason: null },
      });

      return jsonError("Error en el motor tributario. La anulación fue revertida.", 500);
    }

    return NextResponse.json({
      ok: true,
      message: "Movimiento anulado correctamente.",
      data: { id },
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes("período tributario")) {
      return jsonError(error.message, 409);
    }

    console.error("[api/portfolio/movements/[id]]", error);
    return jsonError("Error interno al anular el movimiento.", 500);
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  return annulMovement(request, context);
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  return annulMovement(request, context);
}
