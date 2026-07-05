import { NextRequest, NextResponse } from "next/server";

import { getSessionFromRequest } from "@/modules/identity/application/sessionToken";
import { getBillingStatus } from "@/modules/billing/application/getBillingStatus";


// Force dynamic rendering because routes use request.headers/cookies
export const dynamic = 'force-dynamic';
export async function GET(request: NextRequest) {
  try {
    const auth = await getSessionFromRequest(request);

    if (!auth) {
      return NextResponse.json(
        {
          ok: false,
          message: "No autorizado.",
          data: null,
        },
        { status: 401 },
      );
    }

    const status = await getBillingStatus(auth.user.id);

    if (!status) {
      return NextResponse.json(
        {
          ok: false,
          message: "Usuario no encontrado.",
          data: null,
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      ok: true,
      message: "Estado comercial obtenido.",
      data: status,
    });
  } catch (error) {
    console.error("[billing/status GET]", error);

    return NextResponse.json(
      {
        ok: false,
        message: "No fue posible obtener el estado comercial.",
        data: null,
      },
      { status: 500 },
    );
  }
}
