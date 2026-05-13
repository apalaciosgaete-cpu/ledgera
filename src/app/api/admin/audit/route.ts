import { NextRequest, NextResponse } from "next/server";

import { requireAuth } from "@/shared";
import { listAdminAuditLogs } from "@/modules/admin/infrastructure/adminAuditLogRepository";

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);

  if (!auth || auth instanceof NextResponse) {
    return NextResponse.json(
      {
        ok: false,
        message: "No autorizado.",
      },
      { status: 401 },
    );
  }

  if (auth.user.role !== "admin") {
    return NextResponse.json(
      {
        ok: false,
        message: "Acceso denegado.",
      },
      { status: 403 },
    );
  }

  try {
    const { searchParams } = new URL(req.url);

    const limit = Number(searchParams.get("limit") ?? "100");
    const action = searchParams.get("action");

    const logs = await listAdminAuditLogs({
      limit,
      action,
    });

    return NextResponse.json({
      ok: true,
      data: logs,
    });
  } catch (error) {
    console.error("[api/admin/audit]", error);

    return NextResponse.json(
      {
        ok: false,
        message: "No fue posible cargar auditoría.",
      },
      { status: 500 },
    );
  }
}