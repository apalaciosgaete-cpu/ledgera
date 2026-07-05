import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/shared";
import { fail, ok, serverError } from "@/shared/apiResponse";


// Force dynamic rendering because routes use request.headers/cookies
export const dynamic = 'force-dynamic';
const VALID_STATUSES = ["IMPORTED", "REVIEW", "MATCHED", "IGNORED"] as const;
const VALID_DIRECTIONS = ["INFLOW", "OUTFLOW"] as const;

function getParam(request: NextRequest, key: string): string | null {
  const value = request.nextUrl.searchParams.get(key);
  return value && value.trim() ? value.trim() : null;
}

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);

  if (!auth || auth instanceof NextResponse) {
    return fail("No autorizado.", 401);
  }

  try {
    const status = getParam(request, "status");
    const bankName = getParam(request, "bankName");
    const direction = getParam(request, "direction");

    const takeRaw = Number(request.nextUrl.searchParams.get("take") ?? 100);
    const take = Number.isFinite(takeRaw)
      ? Math.min(Math.max(Math.trunc(takeRaw), 1), 250)
      : 100;

    const where = {
      userId: auth.user.id,
      ...(status && VALID_STATUSES.includes(status as typeof VALID_STATUSES[number])
        ? { status }
        : {}),
      ...(direction && VALID_DIRECTIONS.includes(direction as typeof VALID_DIRECTIONS[number])
        ? { direction }
        : {}),
      ...(bankName ? { bankName } : {}),
    };

    const [movements, total] = await Promise.all([
      prisma.bankMovement.findMany({
        where,
        orderBy: { occurredAt: "desc" },
        take,
        select: {
          id: true,
          uploadId: true,
          bankName: true,
          occurredAt: true,
          description: true,
          amountClp: true,
          direction: true,
          balanceClp: true,
          status: true,
          bankCategory: true,
          categoryReason: true,
          matchedPortfolioMovementId: true,
          matchedConfidence: true,
          matchedAt: true,
          matchedReason: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.bankMovement.count({ where }),
    ]);

    return ok(
      {
        movements,
        total,
        take,
      },
      "Movimientos bancarios obtenidos correctamente.",
    );
  } catch (error) {
    return serverError(error);
  }
}
