import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/shared";
import { fail, ok, serverError } from "@/shared/apiResponse";

export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth || auth instanceof NextResponse) return fail("No autorizado.", 401);

  try {
    const userId = auth.user.id;

    const [total, pending, matched, ignored, review] = await Promise.all([
      prisma.bankMovement.count({ where: { userId } }),
      prisma.bankMovement.count({ where: { userId, status: "IMPORTED" } }),
      prisma.bankMovement.count({ where: { userId, status: "MATCHED" } }),
      prisma.bankMovement.count({ where: { userId, status: "IGNORED" } }),
      prisma.bankMovement.count({ where: { userId, status: "REVIEW" } }),
    ]);

    return ok(
      {
        totalBankMovements: total,
        pending,
        matched,
        ignored,
        review,
        suggestions: pending + review,
      },
      "Métricas de conciliación calculadas.",
    );
  } catch (error) {
    return serverError(error);
  }
}
