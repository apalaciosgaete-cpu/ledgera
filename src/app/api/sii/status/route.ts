import { NextRequest, NextResponse } from "next/server";

import { getSessionFromRequest } from "@/modules/identity/application/sessionToken";
import { getSiiStatus } from "@/modules/sii/application/getSiiStatus";
import type { SiiEnvironment } from "@/modules/sii/domain/sii";


// Force dynamic rendering because routes use request.headers/cookies
export const dynamic = 'force-dynamic';
export async function GET(req: NextRequest) {
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

  try {
    const { searchParams } = new URL(req.url);
    const environment = (searchParams.get("environment") ?? "CERTIFICACION") as SiiEnvironment;
    const issuerRut = searchParams.get("issuerRut") ?? process.env.LEDGERA_ISSUER_RUT ?? "76999999-9";

    const status = await getSiiStatus(environment, issuerRut);

    return NextResponse.json({
      ok: true,
      message: "Estado del SII obtenido.",
      data: status,
    });
  } catch (error) {
    console.error("[sii/status GET]", error);

    return NextResponse.json(
      { ok: false, message: "Error al obtener estado del SII.", data: null },
      { status: 500 },
    );
  }
}
