// src/app/api/portfolio/import/confirm/route.ts
import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/shared";
import { fail, ok, serverError } from "@/shared/apiResponse";
import { rebuildTaxEvents } from "@/modules/tax/application/rebuildTaxEvents";
import { getUserById } from "@/modules/identity/infrastructure/userRepository";
import { requireActiveSubscription } from "@/modules/subscription/application/requireActiveSubscription";
import { enforceRequestRateLimit } from "@/modules/security/application/enforceRequestRateLimit";

type RawRow = Record<string, string>;

type NormalizedMovement = {
  type: "BUY" | "SELL";
  symbol: string;
  quantity: number;
  priceUsd: number;
  feeUsd: number;
  executedAt: string;
};

type SimulationMovement = {
  type: "BUY" | "SELL";
  symbol: string;
  quantity: number;
  executedAt: Date;
  source: "DB" | "IMPORT";
  importIndex?: number;
};

type ImportResult = {
  index: number;
  ok: boolean;
  id?: string;
  error?: string;
};

function normalizeRow(row: RawRow): NormalizedMovement | null {
  try {
    const rawType = row.type?.trim().toUpperCase();
    const symbol = row.symbol?.trim().toUpperCase();

    if (!rawType || !symbol) return null;
    if (rawType !== "BUY" && rawType !== "SELL") return null;

    return {
      type: rawType,
      symbol,
      quantity: Number(row.quantity),
      priceUsd: Number(row.priceUsd),
      feeUsd: Number(row.feeUsd || 0),
      executedAt: row.executedAt,
    };
  } catch {
    return null;
  }
}

function validateMovement(m: NormalizedMovement) {
  const errors: string[] = [];

  if (!m.symbol) errors.push("symbol requerido");
  if (!["BUY", "SELL"].includes(m.type)) errors.push("type inválido");
  if (!Number.isFinite(m.quantity) || m.quantity <= 0) errors.push("quantity inválido");
  if (!Number.isFinite(m.priceUsd) || m.priceUsd <= 0) errors.push("priceUsd inválido");
  if (!Number.isFinite(m.feeUsd) || m.feeUsd < 0) errors.push("feeUsd inválido");

  if (!m.executedAt) {
    errors.push("executedAt requerido");
  } else {
    const date = new Date(m.executedAt);
    if (Number.isNaN(date.getTime())) errors.push("executedAt inválido");
  }

  return errors;
}

export async function POST(req: NextRequest) {
  const rateLimitResponse = enforceRequestRateLimit(req, {
    scope: "portfolio-import-confirm",
    maxAttempts: 10,
    windowMs: 60_000,
  });

  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  const auth = await requireAuth(req);

  if (!auth || auth instanceof NextResponse) {
    return fail("No autorizado", 401);
  }

  const currentUser = await getUserById(auth.user.id);

  if (!currentUser) {
    return fail("Usuario no encontrado.", 404);
  }

  const subscriptionCheck = requireActiveSubscription(currentUser);

  if (!subscriptionCheck.ok) {
    return subscriptionCheck.response;
  }

  try {
    const { rows }: { rows: RawRow[] } = await req.json();

    if (!rows || !Array.isArray(rows)) {
      return fail("rows inválido", 400);
    }

    const normalizedRows: { index: number; data: NormalizedMovement }[] = [];
    const errorsMap: Record<number, string> = {};

    for (let i = 0; i < rows.length; i++) {
      const normalized = normalizeRow(rows[i]);

      if (!normalized) {
        errorsMap[i] = "No se pudo normalizar";
        continue;
      }

      const errors = validateMovement(normalized);

      if (errors.length > 0) {
        errorsMap[i] = errors.join(", ");
        continue;
      }

      normalizedRows.push({
        index: i,
        data: normalized,
      });
    }

    const existingMovements = await prisma.portfolioMovement.findMany({
      where: {
        userId: auth.user.id,
      },
      select: {
        type: true,
        symbol: true,
        quantity: true,
        executedAt: true,
      },
    });

    const simulation: SimulationMovement[] = [];

    for (const movement of existingMovements) {
      if (movement.type !== "BUY" && movement.type !== "SELL") {
        continue;
      }

      simulation.push({
        type: movement.type,
        symbol: movement.symbol,
        quantity: movement.quantity,
        executedAt: movement.executedAt,
        source: "DB",
      });
    }

    for (const row of normalizedRows) {
      simulation.push({
        type: row.data.type,
        symbol: row.data.symbol,
        quantity: row.data.quantity,
        executedAt: new Date(row.data.executedAt),
        source: "IMPORT",
        importIndex: row.index,
      });
    }

    simulation.sort((a, b) => a.executedAt.getTime() - b.executedAt.getTime());

    const inventory: Record<string, number> = {};

    for (const movement of simulation) {
      inventory[movement.symbol] = inventory[movement.symbol] ?? 0;

      if (movement.type === "BUY") {
        inventory[movement.symbol] += movement.quantity;
      } else {
        inventory[movement.symbol] -= movement.quantity;

        if (inventory[movement.symbol] < 0 && movement.source === "IMPORT") {
          errorsMap[movement.importIndex!] =
            "Venta sin inventario suficiente (rompe FIFO)";
        }
      }
    }

    const results: ImportResult[] = [];

    for (const row of normalizedRows) {
      if (errorsMap[row.index]) {
        results.push({
          index: row.index,
          ok: false,
          error: errorsMap[row.index],
        });

        continue;
      }

      const executedAt = new Date(row.data.executedAt);

      const exists = await prisma.portfolioMovement.findFirst({
        where: {
          userId: auth.user.id,
          type: row.data.type,
          symbol: row.data.symbol,
          quantity: row.data.quantity,
          priceUsd: row.data.priceUsd,
          feeUsd: row.data.feeUsd,
          executedAt,
        },
      });

      if (exists) {
        results.push({
          index: row.index,
          ok: false,
          error: "Movimiento duplicado",
        });

        continue;
      }

      const created = await prisma.portfolioMovement.create({
        data: {
          userId: auth.user.id,
          type: row.data.type,
          symbol: row.data.symbol,
          quantity: row.data.quantity,
          priceUsd: row.data.priceUsd,
          feeUsd: row.data.feeUsd,
          executedAt,
        },
      });

      results.push({
        index: row.index,
        ok: true,
        id: created.id,
      });
    }

    const insertedCount = results.filter((r) => r.ok).length;
    let rebuildResult: Awaited<ReturnType<typeof rebuildTaxEvents>> | null = null;

    if (insertedCount > 0) {
      rebuildResult = await rebuildTaxEvents(auth.user.id);

      if (!rebuildResult.ok) {
        return fail(
          "Importación ejecutada, pero falló la reconstrucción de eventos tributarios",
          500,
        );
      }
    }

    return ok(
      {
        import: results,
        insertedCount,
        rejectedCount: results.length - insertedCount,
        rebuild: rebuildResult
          ? {
              ok: rebuildResult.ok,
              data: rebuildResult.data,
            }
          : null,
      },
      insertedCount > 0
        ? "Importación ejecutada y eventos tributarios reconstruidos"
        : "Importación procesada sin nuevos movimientos insertados",
    );
  } catch (error) {
    return serverError(error);
  }
}