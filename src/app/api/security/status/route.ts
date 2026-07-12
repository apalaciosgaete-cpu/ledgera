export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";

import { getSessionFromRequest } from "@/modules/identity/application/sessionToken";
import { listSessionsByUserId } from "@/modules/identity/infrastructure/sessionRepository";

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

    return NextResponse.json(
      {
        ok: true,
        message: "Estado de seguridad obtenido correctamente.",
        data: {
          account: {
            status: auth.user.status,
          },
          email: {
            address: auth.user.email,
            verified: Boolean(auth.user.emailVerifiedAt),
          },
          twoFactor: {
            enabled: auth.user.twoFactorEnabled,
          },
          sessions: sessions.map((session) => ({
            id: session.id,
            createdAt: session.createdAt,
            expiresAt: session.expiresAt,
            isCurrent: session.id === auth.session.id,
          })),
        },
      },
      {
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      },
    );
  } catch (error) {
    console.error("[api/security/status][GET]", error);

    return NextResponse.json(
      {
        ok: false,
        message: "No fue posible verificar el estado de seguridad.",
        data: null,
      },
      { status: 500 },
    );
  }
}
