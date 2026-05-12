import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import type { MovementDto } from "@/shared";
import { ok, fail, serverError } from "@/shared/apiResponse";

type InventoryPreviewBody = {
  symbol?: string;
  executedAt?: string;
  movementIdToIgnore?: string;
};

function getBearerToken(request: NextRequest) {
  const authorization = request.headers.get("authorization");

  if (authorization?.startsWith("Bearer ")) {
    return authorization.replace("Bearer ", "").trim();
  }

  return request.cookies.get("session_token")?.value ?? null;
}

function calculateAvailableQuantityAtDate(input: {
  movements: MovementDto[];
  symbol: string;
  executedAt: Date;
  movementIdToIgnore?: string;
}) {
  const normalizedSymbol = input.symbol.trim().toUpperCase();
  const targetDate = input.executedAt.getTime();

  const sortedMovements = [...input.movements]
    .filter((movement) => !movement.deletedAt)
    .filter((movement) => movement.symbol.toUpperCase() === normalizedSymbol)
    .filter((movement) => movement.id !== input.movementIdToIgnore)
    .sort(
      (a, b) =>
        new Date(a.executedAt).getTime() -
        new Date(b.executedAt).getTime(),
    );

  let availableQuantity = 0;

  for (const movement of sortedMovements) {
    const movementDate = new Date(movement.executedAt).getTime();

    if (movementDate > targetDate) {
      break;
    }

    const quantity = Number(movement.quantity) || 0;

    if (movement.type === "BUY") {
      availableQuantity += quantity;
    }

    if (movement.type === "SELL") {
      availableQuantity -= quantity;
    }
  }

  return availableQuantity;
}

export async function POST(request: NextRequest) {
  try {
    const token = getBearerToken(request);

    if (!token) {
      return fail("No autorizado", 401);
    }

    const body = (await request.json()) as InventoryPreviewBody;

    const symbol = body.symbol?.trim().toUpperCase() ?? "";
    const executedAt = body.executedAt ? new Date(body.executedAt) : null;

    if (!symbol) {
      return fail("El símbolo es obligatorio.", 400);
    }

    if (!executedAt || Number.isNaN(executedAt.getTime())) {
      return fail("La fecha de ejecución no es válida.", 400);
    }

    const movements = (await prisma.portfolioMovement.findMany({
      where: {
        deletedAt: null,
      },
      orderBy: {
        executedAt: "asc",
      },
    })) as MovementDto[];

    const availableQuantity = calculateAvailableQuantityAtDate({
      movements,
      symbol,
      executedAt,
      movementIdToIgnore: body.movementIdToIgnore,
    });

    return ok(
      {
        symbol,
        executedAt: executedAt.toISOString(),
        availableQuantity,
      },
      "Inventario disponible calculado correctamente.",
    );
  } catch (error) {
    return serverError(error);
  }
}