import { NextRequest, NextResponse } from "next/server";

import { getSessionFromRequest } from "@/modules/identity/application/sessionToken";
import { deleteSessionByIdForUser } from "@/modules/identity/infrastructure/sessionRepository";
import { enforceCsrfProtection } from "@/modules/security/application/csrfProtection";


// Force dynamic rendering because routes use request.headers/cookies
export const dynamic = 'force-dynamic';
type RouteContext = { params: { id: string } };

export async function DELETE(
  req: NextRequest,
  { params }: RouteContext,
) {
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

  const { id } = params;

  if (!id) {
    return NextResponse.json(
      { ok: false, message: "ID de sesión requerido.", data: null },
      { status: 400 },
    );
  }

  if (id === auth.session.id) {
    return NextResponse.json(
      {
        ok: false,
        message: "No puedes cerrar la sesión actual desde este endpoint.",
        data: null,
      },
      { status: 400 },
    );
  }

  try {
    const deleted = await deleteSessionByIdForUser({
      sessionId: id,
      userId: auth.user.id,
    });

    if (!deleted) {
      return NextResponse.json(
        { ok: false, message: "Sesión no encontrada.", data: null },
        { status: 404 },
      );
    }

    return NextResponse.json({
      ok: true,
      message: "Sesión cerrada correctamente.",
      data: {
        id,
      },
    });
  } catch (error) {
    console.error("[api/sessions/[id]][DELETE]", error);

    return NextResponse.json(
      {
        ok: false,
        message: "No fue posible cerrar la sesión.",
        data: null,
      },
      { status: 500 },
    );
  }
}
