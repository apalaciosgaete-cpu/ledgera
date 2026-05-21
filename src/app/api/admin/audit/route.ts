import { NextRequest, NextResponse } from "next/server";

import { requireAuth } from "@/shared";
import { enforceRequestRateLimit } from "@/modules/security/application/enforceRequestRateLimit";
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

function resolveLimit(value: string | null): number {
  const parsed = Number(value ?? "100");

  if (!Number.isFinite(parsed)) {
    return 100;
  }

  return Math.min(Math.max(parsed, 1), 250);
}

export async function GET(req: NextRequest) {
  const rateLimitResponse = enforceRequestRateLimit(req, {
    scope: "admin-audit",
    maxAttempts: 60,
    windowMs: 60_000,
  });

  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    const auth = await requireAuth(req);

    if (auth instanceof NextResponse) {
      return auth;
    }

    if (!auth || auth.user.role !== "admin") {
      return forbidden();
    }

    const { searchParams } = new URL(req.url);
    const limit        = resolveLimit(searchParams.get("limit"));
    const actionPrefix = searchParams.get("actionPrefix") ?? undefined;
    const action       = searchParams.get("action") ?? undefined;

    const logs = await listAdminAuditLogs({ limit, actionPrefix, action });

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