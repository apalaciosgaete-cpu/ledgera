// src/modules/portfolio/application/validateMovement.ts

import type { MovementDto, MovementType } from "@/shared";

// ─── Tipos ─────────────────────────────────────────────────────────────────────

type ValidateSellInventoryInput = {
  movements: MovementDto[];
  movementIdToIgnore?: string;
  type: MovementType;
  symbol: string;
  quantity: number;
  executedAt: Date;
};

type ValidationResult =
  | { ok: true }
  | {
      ok: false;
      code: "INSUFFICIENT_INVENTORY" | "NEGATIVE_INVENTORY_DETECTED";
      message: string;
      data: {
        symbol: string;
        availableQuantity: number;
        requestedQuantity: number;
        executedAt: string;
        corruptedAt?: string; // fecha donde el inventario se vuelve negativo
      };
    };

// ─── Función principal ─────────────────────────────────────────────────────────

export function validateSellInventory(
  input: ValidateSellInventoryInput,
): ValidationResult {
  const normalizedSymbol = input.symbol.trim().toUpperCase();

  // Solo aplica a ventas
  if (input.type !== "SELL") {
    return { ok: true };
  }

  // Ordenar movimientos activos del símbolo por fecha ascendente
  const sortedMovements = [...input.movements]
    .filter((m) => !m.deletedAt)
    .filter((m) => m.symbol.trim().toUpperCase() === normalizedSymbol)
    .filter((m) => m.id !== input.movementIdToIgnore)
    .sort(
      (a, b) =>
        new Date(a.executedAt).getTime() - new Date(b.executedAt).getTime(),
    );

  // ─── PASO 1: Detectar inventario negativo en datos históricos ────────────────
  // Recorre TODOS los movimientos anteriores y verifica que en ningún punto
  // el inventario haya caído por debajo de cero.
  // Si hay datos corruptos, bloqueamos ANTES de validar el movimiento nuevo.

  let runningInventory = 0;

  for (const movement of sortedMovements) {
    const movementDate = new Date(movement.executedAt).getTime();
    const targetDate = new Date(input.executedAt).getTime();

    if (movementDate > targetDate) break;

    if (movement.type === "BUY") {
      runningInventory += Number(movement.quantity) || 0;
    }

    if (movement.type === "SELL") {
      runningInventory -= Number(movement.quantity) || 0;

      // 🔴 ERROR DURO: inventario negativo en datos históricos
      if (runningInventory < -0.0000001) {
        return {
          ok: false,
          code: "NEGATIVE_INVENTORY_DETECTED",
          message: `Inventario corrupto detectado para ${normalizedSymbol}. `
            + `El saldo cayó a ${runningInventory.toFixed(8)} en el movimiento `
            + `del ${new Date(movement.executedAt).toISOString()}. `
            + `Revisa y corrige los movimientos históricos antes de continuar.`,
          data: {
            symbol: normalizedSymbol,
            availableQuantity: runningInventory,
            requestedQuantity: Number(input.quantity) || 0,
            executedAt: input.executedAt.toISOString(),
            corruptedAt: new Date(movement.executedAt).toISOString(),
          },
        };
      }
    }
  }

  // ─── PASO 2: Validar que el nuevo movimiento no excede disponible ─────────────
  // `runningInventory` aquí = saldo real hasta `executedAt`

  const requestedQuantity = Number(input.quantity) || 0;
  const availableQuantity = runningInventory;

  if (requestedQuantity > availableQuantity + 0.0000001) {
    return {
      ok: false,
      code: "INSUFFICIENT_INVENTORY",
      message: `No puedes vender ${normalizedSymbol} en esa fecha. `
        + `Disponible: ${availableQuantity.toFixed(8)}. `
        + `Solicitado: ${requestedQuantity.toFixed(8)}.`,
      data: {
        symbol: normalizedSymbol,
        availableQuantity,
        requestedQuantity,
        executedAt: input.executedAt.toISOString(),
      },
    };
  }

  return { ok: true };
}