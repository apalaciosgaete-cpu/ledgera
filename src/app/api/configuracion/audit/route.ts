import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { fail, ok, serverError } from "@/shared/apiResponse";
import { requireAuth } from "@/shared";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req);

    if (auth instanceof NextResponse) {
      return auth;
    }

    if (!auth || auth.user.role !== "admin") {
      return fail("Requiere rol administrador", 403);
    }

    const logs = await prisma.settingsAuditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return ok(logs, "Registros de auditoría cargados.");
  } catch (error) {
    return serverError(error);
  }
}
