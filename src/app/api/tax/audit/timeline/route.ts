import { NextRequest, NextResponse } from "next/server";

import { requireAuth } from "@/shared";
import { listAuditLogs } from "@/modules/tax/infrastructure/auditLogRepository";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);

  if (!auth || auth instanceof NextResponse) {
    return NextResponse.json(
      { ok: false, message: "No autorizado.", data: null },
      { status: 401 },
    );
  }

  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action");
    const limit = searchParams.get("limit")
      ? Math.min(parseInt(searchParams.get("limit")!, 10), 500)
      : 100;

    const logs = await listAuditLogs({
      userId: auth.user.id,
      action: action ? action.toUpperCase() : undefined,
      limit,
    });

    return NextResponse.json(
      {
        ok: true,
        message: "Timeline de auditoría obtenido correctamente.",
        data: {
          logs,
          total: logs.length,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("[api/tax/audit/timeline][GET]", error);

    return NextResponse.json(
      {
        ok: false,
        message: "No fue posible obtener la timeline de auditoría.",
        data: null,
      },
      { status: 500 },
    );
  }
}
