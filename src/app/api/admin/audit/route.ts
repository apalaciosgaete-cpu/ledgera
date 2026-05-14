import { NextRequest, NextResponse } from "next/server";

import { requireAuth } from "@/shared";
import { listAdminAuditLogs } from "@/modules/admin/infrastructure/adminAuditRepository";

function forbidden() {
  return NextResponse.json(
    {
      ok: false,
      message: "Acceso denegado. Se requiere rol administrador.",
      data: null,
    },
    { status: 403 },
  );
}

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req);

    if (auth instanceof NextResponse) {
      return auth;
    }

    if (!auth || auth.user.role !== "admin") {
      return forbidden();
    }

    const logs = await listAdminAuditLogs({
      limit: 100,
    });

    return NextResponse.json({
      ok: true,
      message: "Logs de auditoría obtenidos correctamente.",
      data: logs,
    });
  } catch (error) {
    console.error("[api/admin/audit][GET]", error);

    return NextResponse.json(
      {
        ok: false,
        message: "Error al obtener logs de auditoría.",
        data: null,
      },
      { status: 500 },
    );
  }
}
