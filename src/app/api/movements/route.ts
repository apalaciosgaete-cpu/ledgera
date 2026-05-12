// src/app/api/movements/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rebuildTaxEvents } from "@/modules/tax/application/rebuildTaxEvents";
import { assertPeriodOpen } from "@/modules/tax/domain/periodGuard";
import { requireAuth } from "@/shared";

interface MovementDto {
  id:         string;
  type:       string;
  symbol:     string;
  quantity:   number;
  priceUsd:   number;
  feeUsd:     number;
  executedAt: Date;
  deletedAt:  Date | null;
}

interface InventoryLot {
  quantity:    number;
  unitCostUsd: number;
}

interface ValidationResult {
  ok:      boolean;
  message: string;
  code:    string | null;
  data:    unknown;
}

function validateSellInventory(params: {
  movements:  MovementDto[];
  type:       string;
  symbol:     string;
  quantity:   number;
  executedAt: Date;
}): ValidationResult {
  const { movements, symbol, quantity, executedAt } = params;
  const inventory: Record<string, InventoryLot[]> = {};

  const sorted = [...movements]
    .filter((m) => !m.deletedAt && new Date(m.executedAt) <= executedAt)
    .sort((a, b) => new Date(a.executedAt).getTime() - new Date(b.executedAt).getTime());

  for (const m of sorted) {
    const sym   = String(m.symbol).trim().toUpperCase();
    const qty   = Number(m.quantity) || 0;
    const price = Number(m.priceUsd) || 0;
    const fee   = Number(m.feeUsd)   || 0;

    if (m.type === "BUY") {
      const totalCost = qty * price + fee;
      const unitCost  = qty > 0 ? totalCost / qty : 0;
      inventory[sym]  = inventory[sym] ?? [];
      inventory[sym].push({ quantity: qty, unitCostUsd: unitCost });
    }

    if (m.type === "SELL") {
      const lots = inventory[sym] ?? [];
      let remaining = qty;
      while (remaining > 0 && lots.length > 0) {
        const lot      = lots[0];
        const consumed = Math.min(remaining, lot.quantity);
        lot.quantity  -= consumed;
        remaining     -= consumed;
        if (lot.quantity <= 0.00000001) lots.shift();
      }
    }
  }

  const available = (inventory[symbol] ?? []).reduce((sum, lot) => sum + lot.quantity, 0);

  if (quantity > available + 0.00000001) {
    const missing = quantity - available;
    return {
      ok:      false,
      message: `Inventario insuficiente para ${symbol}. Disponible: ${available.toFixed(8)}, requerido: ${quantity.toFixed(8)}. Faltan ${missing.toFixed(8)} unidades.`,
      code:    "NEGATIVE_INVENTORY",
      data:    { symbol, available, required: quantity, missing },
    };
  }

  return { ok: true, message: "OK", code: null, data: null };
}

export async function GET(request: Request) {
  const auth = await requireAuth(request as Parameters<typeof requireAuth>[0]);
  if (!auth || auth instanceof NextResponse) {
    return NextResponse.json({ ok: false, message: "No autorizado" }, { status: 401 });
  }

  try {
    const movements = await prisma.portfolioMovement.findMany({
      where:   { deletedAt: null, userId: auth.user.id },
      orderBy: [{ executedAt: "desc" }, { id: "desc" }],
    });
    return NextResponse.json({ ok: true, data: movements });
  } catch (error) {
    console.error("[movements/GET]", error);
    return NextResponse.json({ ok: false, message: "Error al obtener movimientos" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await requireAuth(request as Parameters<typeof requireAuth>[0]);
  if (!auth || auth instanceof NextResponse) {
    return NextResponse.json({ ok: false, message: "No autorizado" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { type, symbol, quantity, priceUsd, feeUsd, executedAt } = body;

    if (!type || !symbol || !quantity || !priceUsd || !executedAt) {
      return NextResponse.json(
        { ok: false, message: "Faltan campos requeridos: tipo, símbolo, cantidad, precio y fecha", code: null, data: null },
        { status: 400 }
      );
    }

    const normalizedType = String(type).trim().toUpperCase();
    if (normalizedType !== "BUY" && normalizedType !== "SELL") {
      return NextResponse.json(
        { ok: false, message: "El tipo debe ser BUY o SELL", code: null, data: null },
        { status: 400 }
      );
    }

    const parsedQuantity = Number(quantity);
    const parsedPrice    = Number(priceUsd);
    const parsedFee      = Number(feeUsd ?? 0);

    if (!Number.isFinite(parsedQuantity) || parsedQuantity <= 0) {
      return NextResponse.json({ ok: false, message: "La cantidad debe ser un número mayor a 0", code: null, data: null }, { status: 400 });
    }
    if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
      return NextResponse.json({ ok: false, message: "El precio USD debe ser un número válido mayor o igual a 0", code: null, data: null }, { status: 400 });
    }
    if (!Number.isFinite(parsedFee) || parsedFee < 0) {
      return NextResponse.json({ ok: false, message: "El fee USD debe ser un número válido mayor o igual a 0", code: null, data: null }, { status: 400 });
    }

    const executedAtDate = new Date(executedAt);
    if (isNaN(executedAtDate.getTime())) {
      return NextResponse.json({ ok: false, message: "La fecha de operación no es válida", code: null, data: null }, { status: 400 });
    }

    await assertPeriodOpen(executedAtDate);

    if (normalizedType === "SELL") {
      const allMovements = (await prisma.portfolioMovement.findMany({
        where:   { deletedAt: null, userId: auth.user.id },
        orderBy: { executedAt: "asc" },
      })) as MovementDto[];

      const validation = validateSellInventory({
        movements:  allMovements,
        type:       "SELL",
        symbol:     String(symbol).trim().toUpperCase(),
        quantity:   parsedQuantity,
        executedAt: executedAtDate,
      });

      if (!validation.ok) {
        return NextResponse.json(
          { ok: false, message: validation.message, code: validation.code, data: validation.data },
          { status: 400 }
        );
      }
    }

    const movement = await prisma.portfolioMovement.create({
      data: {
        userId:               auth.user.id,
        type:                 normalizedType,
        symbol:               String(symbol).trim().toUpperCase(),
        quantity:             parsedQuantity,
        priceUsd:             parsedPrice,
        feeUsd:               parsedFee,
        executedAt:           executedAtDate,
        suggestedTaxCategory: "UNCLASSIFIED",
        taxClassificationSource: "SYSTEM",
      },
    });

    if (normalizedType === "SELL") {
      const motorResult = await rebuildTaxEvents(auth.user.id);

      if (!motorResult.ok) {
        await prisma.portfolioMovement.delete({ where: { id: movement.id } });
        return NextResponse.json(
          { ok: false, message: "Error en el motor tributario. El movimiento no fue guardado.", code: null, data: null },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ ok: true, data: movement }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message.includes("período tributario")) {
      return NextResponse.json(
        { ok: false, message: error.message, code: null, data: null },
        { status: 409 }
      );
    }
    console.error("[movements/POST]", error);
    return NextResponse.json(
      { ok: false, message: "Error interno al crear el movimiento", code: null, data: null },
      { status: 500 }
    );
  }
}