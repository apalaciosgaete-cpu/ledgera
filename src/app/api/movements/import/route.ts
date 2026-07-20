// src/app/api/movements/import/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, fail, serverError } from "@/shared/apiResponse";
import { rebuildTaxEvents } from "@/modules/tax/application/rebuildTaxEvents";
import { enforceMovementLimit } from "@/modules/subscription/application/enforceMovementLimit";
import { requireActiveSubscription } from "@/modules/subscription/application/requireActiveSubscription";
import { requireAuth } from "@/shared";

// Force dynamic rendering because routes use request.headers/cookies
export const dynamic = "force-dynamic";

type ImportMovementInput = {
  type:       "BUY" | "SELL";
  symbol:     string;
  quantity:   number;
  priceUsd:   number;
  feeUsd?:    number;
  executedAt?: string;
};

type InventoryLot = {
  quantity:    number;
  unitCostUsd: number;
};

type NegativeInventoryDetail = {
  code:            "NEGATIVE_INVENTORY";
  symbol:          string;
  rowIndex:        number;
  missingQuantity: number;
};

function normalizeMovement(movement: ImportMovementInput): ImportMovementInput {
  return {
    type:       movement.type,
    symbol:     movement.symbol.trim().toUpperCase(),
    quantity:   Number(movement.quantity),
    priceUsd:   Number(movement.priceUsd),
    feeUsd:     Number(movement.feeUsd ?? 0),
    executedAt: movement.executedAt,
  };
}

function validateMovement(movement: ImportMovementInput, rowIndex: number) {
  if (!["BUY", "SELL"].includes(movement.type)) throw new Error(`INVALID_MOVEMENT_TYPE:${rowIndex}`);
  if (!movement.symbol)                          throw new Error(`SYMBOL_REQUIRED:${rowIndex}`);
  if (movement.quantity <= 0)                    throw new Error(`INVALID_QUANTITY:${rowIndex}`);
  if (movement.priceUsd <= 0)                    throw new Error(`INVALID_PRICE:${rowIndex}`);
  if ((movement.feeUsd ?? 0) < 0)                throw new Error(`INVALID_FEE:${rowIndex}`);
}

function validateInventory(
  existingMovements: Array<{ type: string; symbol: string; quantity: number; priceUsd: number }>,
  importedMovements: ImportMovementInput[],
) {
  const inventory = new Map<string, InventoryLot[]>();

  for (const movement of existingMovements) {
    const symbol = movement.symbol.toUpperCase();
    if (!inventory.has(symbol)) inventory.set(symbol, []);
    const lots = inventory.get(symbol)!;

    if (movement.type === "BUY") {
      lots.push({ quantity: movement.quantity, unitCostUsd: movement.priceUsd });
      continue;
    }

    if (movement.type === "SELL") {
      let remainingSell = movement.quantity;
      while (remainingSell > 0 && lots.length > 0) {
        const lot = lots[0];
        if (lot.quantity <= remainingSell) { remainingSell -= lot.quantity; lots.shift(); }
        else { lot.quantity -= remainingSell; remainingSell = 0; }
      }
    }
  }

  for (let i = 0; i < importedMovements.length; i++) {
    const movement = importedMovements[i];
    const symbol   = movement.symbol.toUpperCase();

    if (!inventory.has(symbol)) inventory.set(symbol, []);
    const lots = inventory.get(symbol)!;

    if (movement.type === "BUY") {
      lots.push({ quantity: movement.quantity, unitCostUsd: movement.priceUsd });
      continue;
    }

    if (movement.type === "SELL") {
      let remainingSell = movement.quantity;
      while (remainingSell > 0 && lots.length > 0) {
        const lot = lots[0];
        if (lot.quantity <= remainingSell) { remainingSell -= lot.quantity; lots.shift(); }
        else { lot.quantity -= remainingSell; remainingSell = 0; }
      }

      if (remainingSell > 0.00000001) {
        const err = new Error("NEGATIVE_INVENTORY");
        (err as unknown as { detail: NegativeInventoryDetail }).detail = {
          code:            "NEGATIVE_INVENTORY",
          symbol,
          rowIndex:        i + 1,
          missingQuantity: remainingSell,
        };
        throw err;
      }
    }
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth || auth instanceof NextResponse) return fail("No autorizado", 401);

  const subscriptionCheck = requireActiveSubscription(auth.user);
  if (!subscriptionCheck.ok) return subscriptionCheck.response;

  try {
    const body = await request.json();

    if (!Array.isArray(body.movements)) {
      return fail("Debe enviar un arreglo de movimientos.", 400);
    }

    const importedMovements: ImportMovementInput[] = body.movements.map(normalizeMovement);

    for (let i = 0; i < importedMovements.length; i++) {
      validateMovement(importedMovements[i], i + 1);
    }

    const years = [
      ...new Set(
        importedMovements.map((m) =>
          new Date(m.executedAt ?? new Date()).getUTCFullYear(),
        ),
      ),
    ];

    const closedPeriods = await prisma.taxPeriodClose.findMany({
      where: { userId: auth.user.id, periodYear: { in: years }, reopenedAt: null },
    });

    if (closedPeriods.length > 0) {
      return fail("No se pueden importar movimientos en períodos tributarios cerrados.", 409);
    }

    const existingMovements = await prisma.portfolioMovement.findMany({
      where:   { deletedAt: null, userId: auth.user.id },
      orderBy: { executedAt: "asc" },
      select:  { type: true, symbol: true, quantity: true, priceUsd: true },
    });

    validateInventory(existingMovements, importedMovements);

    if (importedMovements.length > 0) {
      await enforceMovementLimit({
        userId: auth.user.id,
        requestedCount: importedMovements.length,
      });
    }

    await prisma.$transaction(async (tx) => {
      for (const movement of importedMovements) {
        await tx.portfolioMovement.create({
          data: {
            userId:    auth.user.id,
            type:      movement.type,
            symbol:    movement.symbol,
            quantity:  movement.quantity,
            priceUsd:  movement.priceUsd,
            feeUsd:    movement.feeUsd ?? 0,
            executedAt: movement.executedAt ? new Date(movement.executedAt) : new Date(),
          },
        });
      }
    });

    const result = await rebuildTaxEvents(auth.user.id);

    if (!result.ok) {
      return fail("Movimientos importados pero error al reconstruir eventos tributarios.", 500);
    }

    return ok(
      {
        imported:         importedMovements.length,
        rebuiltEvents:    result.data?.totalEvents ?? 0,
        warnings:         result.data?.warnings ?? [],
        taxEngineVersion: result.data?.taxEngineVersion,
      },
      "Movimientos importados correctamente.",
    );
  } catch (error) {
    console.error("[import/route]", error);

    if (error instanceof Error && error.message === "NEGATIVE_INVENTORY") {
      const detail = (error as unknown as { detail: NegativeInventoryDetail }).detail;
      return fail(
        `Inventario negativo para ${detail.symbol} en fila ${detail.rowIndex}. Faltan ${detail.missingQuantity.toFixed(8)} unidades.`,
        400,
        detail,
      );
    }

    if (error instanceof Error) {
      const [code, row] = error.message.split(":");
      const rowIndex    = Number(row);
      const validationMessages: Record<string, string> = {
        INVALID_MOVEMENT_TYPE: `Tipo de movimiento inválido en fila ${rowIndex}. Use BUY o SELL.`,
        SYMBOL_REQUIRED:       `Símbolo requerido en fila ${rowIndex}.`,
        INVALID_QUANTITY:      `Cantidad inválida en fila ${rowIndex}. Debe ser mayor a 0.`,
        INVALID_PRICE:         `Precio inválido en fila ${rowIndex}. Debe ser mayor a 0.`,
        INVALID_FEE:           `Fee inválido en fila ${rowIndex}. No puede ser negativo.`,
      };
      if (validationMessages[code]) {
        return fail(validationMessages[code], 400, { code, data: { rowIndex } });
      }
    }

    return serverError(error);
  }
}
