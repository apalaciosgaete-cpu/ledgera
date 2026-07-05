import { NextRequest, NextResponse } from "next/server";

import { getSessionFromRequest } from "@/modules/identity/application/sessionToken";
import { recordAuditEvent } from "@/modules/audit/application/recordAuditEvent";


// Force dynamic rendering because routes use request.headers/cookies
export const dynamic = 'force-dynamic';
export async function POST(req: NextRequest) {
  const auth = await getSessionFromRequest(req);

  if (!auth) {
    return NextResponse.json(
      { ok: false, message: "No autenticado", data: null },
      { status: 401 },
    );
  }

  if (auth.user.role !== "admin") {
    return NextResponse.json(
      { ok: false, message: "Sin permisos", data: null },
      { status: 403 },
    );
  }

  console.info("[sii]", {
    event: "sii_connection_tested",
    userId: auth.user.id,
    environment: process.env.SII_ENVIRONMENT ?? "CERTIFICACION",
  });

  await recordAuditEvent({
    actorId: auth.user.id,
    category: "SII",
    severity: "INFO",
    event: "sii_connection_tested",
    description: "Prueba de conexión SII ejecutada",
    result: "SUCCESS",
    entityType: "SiiCredential",
    metadata: { environment: process.env.SII_ENVIRONMENT ?? "CERTIFICACION" },
    ipAddress: req.ip ?? req.headers.get("x-forwarded-for") ?? null,
    userAgent: req.headers.get("user-agent") ?? null,
  });

  return NextResponse.json({
    ok: true,
    message: "Conexión de prueba exitosa.",
    data: null,
  });
}
