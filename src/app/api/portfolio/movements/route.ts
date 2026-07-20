import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { MovementDto, MovementType } from "@/shared";
import { fail, ok, serverError } from "@/shared/apiResponse";
import { validateSellInventory } from "@/modules/portfolio/application/validateMovement";
import { assertPeriodOpen } from "@/modules/tax/domain/periodGuard";
import { buildUserScopeWhere } from "@/modules/identity/domain/accessPolicy";
import { enforceMovementLimit } from "@/modules/subscription/application/enforceMovementLimit";
import { requireActiveSubscription } from "@/modules/subscription/application/requireActiveSubscription";
import { requireAuth } from "@/shared";

// Force dynamic rendering because routes use request.headers/cookies
export const dynamic = "force-dynamic";
type CreateMovementBody = {
  type?: MovementType;
  symbol?: string;
  quantity?: number | string;
  priceUsd?: number | string;
  feeUsd?: number | string;
  executedAt?: string;
};

function parsePositiveNumber(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : NaN;
}

function isValidMovementType(value: unknown): value is MovementType {
  return value === "BUY" || value === "SELL";
}

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth || auth instanceof NextResponse) return fail("No autorizado", 401);

  try {
    const movements = await prisma.portfolioMovement.findMany({
      where: {
        deletedAt: null,
        ...buildUserScopeWhere(auth.user),
      },
      orderBy: { executedAt: "desc" },
    });

    return ok(movements, "Movimientos obtenidos correctamente.");
  } catch (error) {
    return serverError(error);
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth || auth instanceof NextResponse) return fail("No autorizado", 401);

  const subscriptionCheck = requireActiveSubscription(auth.user);
  if (!subscriptionCheck.ok) return subscriptionCheck.response;

  try {
    const body = (await request.json()) as CreateMovementBody;

    const type = body.type;
    const symbol = body.symbol?.trim().toUpperCase() ?? "";
    const quantity = parsePositiveNumber(body.quantity);
    const priceUsd = parsePositiveNumber(body.priceUsd);
    const feeUsd =
      body.feeUsd === undefined || body.feeUsd === ""
        ? 0
        : parsePositiveNumber(body.feeUsd);

    if (!isValidMovementType(type)) return fail("El tipo debe ser BUY o SELL.", 400);
    if (!symbol) return fail("El símbolo es obligatorio.", 400);
    if (!Number.isFinite(quantity) || quantity <= 0) return fail("Cantidad inválida.", 400);
    if (!Number.isFinite(priceUsd) || priceUsd <= 0) return fail("Precio inválido.", 400);
    if (!Number.isFinite(feeUsd) || feeUsd < 0) return fail("Fee inválido.", 400);

    const executedAt = body.executedAt ? new Date(body.executedAt) : new Date();
    if (Number.isNaN(executedAt.getTime())) return fail("Fecha inválida.", 400);

    try {
      await assertPeriodOpen(executedAt, auth.user.id);
    } catch (error) {
      return fail(
        error instanceof Error ? error.message : "El período tributario está cerrado.",
        409,
      );
    }

    const movements = (await prisma.portfolioMovement.findMany({
      where: {
        deletedAt: null,
        userId: auth.user.id,
      },
      orderBy: { executedAt: "asc" },
    })) as MovementDto[];

    const validation = validateSellInventory({
      movements,
      type,
      symbol,
      quantity,
      executedAt,
    });

    if (!validation.ok) return fail(validation.message, 400);

    await enforceMovementLimit({ userId: auth.user.id });

    const movement = await prisma.portfolioMovement.create({
      data: {
        type,
        symbol,
        quantity,
        priceUsd,
        feeUsd,
        executedAt,
        userId: auth.user.id,
      },
    });

    return ok(movement, "Movimiento creado correctamente.", 201);
  } catch (error) {
    return serverError(error);
  }
}
