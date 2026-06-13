import { NextRequest, NextResponse } from "next/server";

import { getSessionFromRequest } from "@/modules/identity/application/sessionToken";

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

  return NextResponse.json({
    ok: true,
    message: "Conexión de prueba exitosa.",
    data: null,
  });
}
