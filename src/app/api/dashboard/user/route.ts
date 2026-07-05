import { NextRequest, NextResponse } from "next/server";

import { requireAuth } from "@/shared";
import { buildUserDashboard } from "@/modules/dashboard/application/buildUserDashboard";
import { recordAuditEvent } from "@/modules/audit/application/recordAuditEvent";


// Force dynamic rendering because routes use request.headers/cookies
export const dynamic = 'force-dynamic';
export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth || auth instanceof NextResponse) {
    return NextResponse.json(
      { ok: false, message: "No autorizado.", data: null },
      { status: 401 },
    );
  }

  try {
    const result = await buildUserDashboard(auth.user.id);

    if (!result.ok) {
      return NextResponse.json(
        { ok: false, message: result.message, data: null },
        { status: 500 },
      );
    }

    await recordAuditEvent({
      userId: auth.user.id,
      actorId: auth.user.id,
      category: "ADMIN",
      severity: "INFO",
      event: "dashboard_viewed",
      description: "Dashboard personal consultado",
      result: "SUCCESS",
      entityType: "Dashboard",
      entityId: "user",
      metadata: { path: "/panel" },
    });

    return NextResponse.json({
      ok: true,
      message: "Dashboard personal obtenido.",
      data: result.dashboard,
    });
  } catch (error) {
    console.error("[dashboard/user GET]", error);

    return NextResponse.json(
      { ok: false, message: "Error al obtener dashboard personal.", data: null },
      { status: 500 },
    );
  }
}
