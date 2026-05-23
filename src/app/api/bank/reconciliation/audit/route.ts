import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/shared";
import { fail, ok, serverError } from "@/shared/apiResponse";

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth || auth instanceof NextResponse) return fail("No autorizado.", 401);

  try {
    const { searchParams } = new URL(request.url);

    const bankMovementId = searchParams.get("bankMovementId");
    const action         = searchParams.get("action");

    const logs = await prisma.bankReconciliationAuditLog.findMany({
      where: {
        userId: auth.user.id,
        ...(bankMovementId ? { bankMovementId } : {}),
        ...(action ? { action } : {}),
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 500,
    });

    return ok(
      {
        logs,
        total: logs.length,
      },
      `${logs.length} eventos de auditoría encontrados.`,
    );
  } catch (error) {
    return serverError(error);
  }
}
