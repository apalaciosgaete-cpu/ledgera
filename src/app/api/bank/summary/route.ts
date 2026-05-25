import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/shared";
import { fail, ok, serverError } from "@/shared/apiResponse";

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);

  if (!auth || auth instanceof NextResponse) {
    return fail("No autorizado.", 401);
  }

  try {
    const [
      totalBankMovements,
      pending,
      matched,
      ignored,
      uploads,
    ] = await Promise.all([
      prisma.bankMovement.count({
        where: { userId: auth.user.id },
      }),
      prisma.bankMovement.count({
        where: { userId: auth.user.id, status: { in: ["IMPORTED", "REVIEW"] } },
      }),
      prisma.bankMovement.count({
        where: { userId: auth.user.id, status: "MATCHED" },
      }),
      prisma.bankMovement.count({
        where: { userId: auth.user.id, status: "IGNORED" },
      }),
      prisma.bankFileUpload.findMany({
        where:   { userId: auth.user.id },
        orderBy: { createdAt: "desc" },
        take:    5,
        select: {
          id:           true,
          bankName:     true,
          fileName:     true,
          status:       true,
          totalRows:    true,
          importedRows: true,
          errorRows:    true,
          createdAt:    true,
        },
      }),
    ]);

    return ok(
      {
        totalBankMovements,
        pending,
        matched,
        ignored,
        uploads,
      },
      "Resumen bancario obtenido correctamente.",
    );
  } catch (error) {
    return serverError(error);
  }
}
