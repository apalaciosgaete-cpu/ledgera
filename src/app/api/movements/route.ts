import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { MovementDto, MovementType } from "@/shared";
import { fail, ok, serverError } from "@/shared/apiResponse";
import { validateSellInventory } from "@/modules/portfolio/application/validateMovement";
import { assertPeriodOpen } from "@/modules/tax/domain/periodGuard";
import { buildUserScopeWhere } from "@/modules/identity/domain/accessPolicy";
import { requireAuth } from "@/shared";
import { enforceCsrfProtection } from "@/modules/security/application/csrfProtection";
import { enforceMovementLimit } from "@/modules/subscription/application/enforceMovementLimit";

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

function toJsonNumber(value: unknown): number {
  if (typeof value === "bigint") return Number(value);
  if (typeof value === "number") return value;
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function isValidMovementType(value: unknown): value is MovementType {
  return value === "BUY" || value === "SELL";
}

const VALID_SORT_FIELDS = ["executedAt", "priceUsd", "quantity"] as const;
const VALID_TYPES       = ["BUY", "SELL", "DEPOSIT", "WITHDRAW"] as const;
const VALID_SOURCES     = ["BINANCE", "BINANCE_TAX", "MANUAL", "BANK"] as const;

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth || auth instanceof NextResponse) return fail("No autorizado", 401);

  try {
    const { searchParams } = new URL(request.url);

    const typeParam   = searchParams.get("type")   ?? "";
    const symbolParam = searchParams.get("symbol") ?? "";
    const sourceParam = searchParams.get("source") ?? "";
    const sortParam   = searchParams.get("sort")   ?? "executedAt";
    const orderParam  = searchParams.get("order")  === "asc" ? "asc" as const : "desc" as const;
    const searchParam = searchParams.get("search") ?? "";
    const page        = Math.max(1, Number(searchParams.get("page")  || "1"));
    const limit       = Math.min(500, Math.max(1, Number(searchParams.get("limit") || "200")));
    const skip        = (page - 1) * limit;

    const type   = (VALID_TYPES   as readonly string[]).includes(typeParam)   ? typeParam   : null;
    const source = (VALID_SOURCES as readonly string[]).includes(sourceParam) ? sourceParam : null;
    const symbol = symbolParam.trim().toUpperCase() || null;
    const search = searchParam.trim().toUpperCase() || null;
    const sort   = (VALID_SORT_FIELDS as readonly string[]).includes(sortParam) ? sortParam : "executedAt";

    const baseWhere = {
      ...buildUserScopeWhere(auth.user),
    };

    const symbolWhere = symbol
      ? { symbol }
      : search
      ? { symbol: { contains: search } }
      : {};

    const filterWhere = {
      ...baseWhere,
      ...(type   ? { type }   : {}),
      ...(source ? { source } : {}),
      ...symbolWhere,
    };

    const [movements, total, typeGroups] = await Promise.all([
      prisma.portfolioMovement.findMany({
        where:   filterWhere,
        orderBy: { [sort]: orderParam },
        skip,
        take: limit,
      }),
      prisma.portfolioMovement.count({ where: filterWhere }),
      prisma.portfolioMovement.groupBy({
        by:    ["type"],
        where: { ...baseWhere, deletedAt: null },
        _count: { type: true },
      }),
    ]);

    const typeCounts = Object.fromEntries(
      typeGroups.map((group) => [group.type, toJsonNumber(group._count.type)]),
    );

    return ok(
      {
        movements,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        stats: {
          buys:        typeCounts["BUY"]      ?? 0,
          sells:       typeCounts["SELL"]     ?? 0,
          deposits:    typeCounts["DEPOSIT"]  ?? 0,
          withdrawals: typeCounts["WITHDRAW"] ?? 0,
        },
      },
      "Movimientos obtenidos correctamente.",
    );
  } catch (error) {
    return serverError(error);
  }
}

export async function POST(request: NextRequest) {
  const csrfResponse = enforceCsrfProtection(request);
  if (csrfResponse) return csrfResponse;

  const auth = await requireAuth(request);
  if (!auth || auth instanceof NextResponse) return fail("No autorizado", 401);

  try {
    const body = (await request.json()) as CreateMovementBody;

    const type     = body.type;
    const symbol   = body.symbol?.trim().toUpperCase() ?? "";
    const quantity = parsePositiveNumber(body.quantity);
    const priceUsd = parsePositiveNumber(body.priceUsd);
    const feeUsd   = body.feeUsd === undefined || body.feeUsd === "" ? 0 : parsePositiveNumber(body.feeUsd);

    if (!isValidMovementType(type)) return fail("El tipo debe ser BUY o SELL.", 400);
    if (!symbol)                    return fail("El símbolo es obligatorio.", 400);
    if (!Number.isFinite(quantity) || quantity <= 0) return fail("Cantidad inválida.", 400);
    if (!Number.isFinite(priceUsd) || priceUsd <= 0) return fail("Precio inválido.", 400);
    if (!Number.isFinite(feeUsd)   || feeUsd   <  0) return fail("Fee inválido.", 400);

    const executedAt = body.executedAt ? new Date(body.executedAt) : new Date();
    if (Number.isNaN(executedAt.getTime())) return fail("Fecha inválida.", 400);

    try {
      await assertPeriodOpen(executedAt, auth.user.id);
    } catch (error) {
      return fail(error instanceof Error ? error.message : "El período tributario está cerrado.", 409);
    }

    const allMovements = (await prisma.portfolioMovement.findMany({
      where:   { deletedAt: null, userId: auth.user.id },
      orderBy: { executedAt: "asc" },
    })) as MovementDto[];

    const validation = validateSellInventory({ movements: allMovements, type, symbol, quantity, executedAt });
    if (!validation.ok) return fail(validation.message, 400);

    await enforceMovementLimit({ userId: auth.user.id });

    const movement = await prisma.portfolioMovement.create({
      data: { type, symbol, quantity, priceUsd, feeUsd, executedAt, userId: auth.user.id },
    });

    return ok(movement, "Movimiento creado correctamente.", 201);
  } catch (error) {
    return serverError(error);
  }
}
