// Force dynamic rendering because routes use request.headers/cookies
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";

import { getSessionFromRequest } from "@/modules/identity/application/sessionToken";

import {
  deleteOtherSessionsForUser,
  listSessionsByUserId,
} from "@/modules/identity/infrastructure/sessionRepository";

import { enforceCsrfProtection } from "@/modules/security/application/csrfProtection";

function maskToken(token: string): string {
  if (token.length <= 12) {
    return "********";
  }

  return `${token.slice(0, 6)}...${token.slice(-6)}`;
}

export async function GET(req: NextRequest) {
  const auth = await getSessionFromRequest(req);

  if (!auth) {
    return NextResponse.json(
      { ok: false, message: "No autenticado.", data: null },
      { status: 401 },
    );
  }

  try {
    const sessions = await listSessionsByUserId(auth.user.id);

    return NextResponse.json({
      ok: true,
      message: "Sesiones obtenidas correctamente.",
      data: sessions.map((session) => ({
        id: session.id,
        tokenPreview: maskToken(session.token),
        createdAt: session.createdAt,
        expiresAt: session.expiresAt,
        isCurrent: session.id === auth.session.id,
      })),
    });
  } catch (error) {
    console.error("[api/sessions][GET]", error);

    return NextResponse.json(
      {
        ok: false,
        message: "No fue posible obtener las sesiones.",
        data: null,
      },
      { status: 500 },
    );
  }
}

export async function DELETE(req: NextRequest) {
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

  try {
    const deletedCount = await deleteOtherSessionsForUser({
      userId: auth.user.id,
      currentSessionId: auth.session.id,
    });

    return NextResponse.json({
      ok: true,
      message: "Sesiones secundarias cerradas correctamente.",
      data: {
        deletedCount,
        currentSessionId: auth.session.id,
      },
    });
  } catch (error) {
    console.error("[api/sessions][DELETE]", error);

    return NextResponse.json(
      {
        ok: false,
        message: "No fue posible cerrar las otras sesiones.",
        data: null,
      },
      { status: 500 },
    );
  }
}