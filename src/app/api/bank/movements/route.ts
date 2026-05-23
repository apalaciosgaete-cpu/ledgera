import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/shared";
import { fail, ok, serverError } from "@/shared/apiResponse";

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth || auth instanceof NextResponse) return fail("No autorizado.", 401);

  try {
    const { searchParams } = new URL(request.url);

    const direction = searchParams.get("direction");
    const status = searchParams.get("status");
    const bankName = searchParams.get("bankName");
    const q = searchParams.get("q");

    const page = Math.max(1, Number(searchParams.get("page") ?? 1));
    const limit = Math.min(200, Math.max(1, Number(searchParams.get("limit") ?? 50)));
    const skip = (page - 1) * limit;

    const where = {
      userId: auth.user.id,
      ...(direction ? { direction } : {}),
      ...(status ? { status } : {}),
      ...(bankName ? { bankName } : {}),
      ...(q
        ? {
            description: {
              contains: q,
              mode: "insensitive" as const,
            },
          }
        : {}),
    };

    const [movements, total] = await Promise.all([
      prisma.bankMovement.findMany({
        where,
        orderBy: { occurredAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.bankMovement.count({ where }),
    ]);

    return ok(
      {
        movements,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      },
      "Movimientos bancarios obtenidos correctamente.",
    );
  } catch (error) {
    return serverError(error);
  }
}
