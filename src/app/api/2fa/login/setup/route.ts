export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";

import { enforceRequestRateLimit } from "@/modules/security/application/enforceRequestRateLimit";

export async function POST(req: NextRequest) {
  const rateLimitResponse = enforceRequestRateLimit(req, {
    scope: "2fa-login-setup",
    maxAttempts: 3,
    windowMs: 15 * 60 * 1000,
  });

  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  return NextResponse.json(
    {
      ok: false,
      message:
        "Por seguridad, el autenticador no puede reemplazarse únicamente con la contraseña. La recuperación segura estará disponible mediante correo verificado.",
      data: null,
    },
    { status: 403 },
  );
}
