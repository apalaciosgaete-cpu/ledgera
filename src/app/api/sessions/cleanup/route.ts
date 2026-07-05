import { NextRequest, NextResponse } from "next/server";

import { getSessionFromRequest } from "@/modules/identity/application/sessionToken";
import { deleteExpiredSessions } from "@/modules/identity/infrastructure/sessionRepository";
import { enforceCsrfProtection } from "@/modules/security/application/csrfProtection";


// Force dynamic rendering because routes use request.headers/cookies
export const dynamic = 'force-dynamic';
export async function POST(req: NextRequest) {
  const csrfResponse = enforceCsrfProtection(req);

  if (csrfResponse) {
    return csrfResponse;
  }

  const auth = await getSessionFromRequest(req);

  if (!auth) {
    return NextResponse.json(
      { ok: false, message: "No autenticado.", data: null },
      { status: 401 },
    );
  }

  if (auth.user.role !== "admin") {
    return NextResponse.json(
      { ok: false, message: "Sin permisos.", data: null },
      { status: 403 },
    );
  }

  try {
    const deletedCount = await deleteExpiredSessions();

    return NextResponse.json({
      ok: true,
      message: "Sesiones expiradas limpiadas correctamente.",
      data: {
        deletedCount,
      },
    });
  } catch (error) {
    console.error("[api/sessions/cleanup][POST]", error);

    return NextResponse.json(
      {
        ok: false,
        message: "No fue posible limpiar sesiones expiradas.",
        data: null,
      },
      { status: 500 },
    );
  }
}