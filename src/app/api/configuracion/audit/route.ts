import { prisma } from "@/lib/prisma";
import { ok, serverError } from "@/shared/apiResponse";

export async function GET() {
  try {
    const logs = await prisma.settingsAuditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return ok(logs, "Registros de auditoría cargados.");
  } catch (error) {
    return serverError(error);
  }
}