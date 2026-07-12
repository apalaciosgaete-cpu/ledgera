export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";

import { getSessionFromRequest } from "@/modules/identity/application/sessionToken";
import { issueEmailVerification } from "@/modules/identity/application/emailVerification";
import { getUserById } from "@/modules/identity/infrastructure/userRepository";
import { enforceRequestRateLimit } from "@/modules/security/application/enforceRequestRateLimit";
import { enforceCsrfProtection } from "@/modules/security/application/csrfProtection";

export async function POST(req: NextRequest) {
  const csrfResponse = enforceCsrfProtection(req);
  if (csrfResponse) return csrfResponse;

  const rateLimitResponse = enforceRequestRateLimit(req, {
    scope: "email-verification-send",
    maxAttempts: 3,
    windowMs: 15 * 60 * 1000,
  });
  if (rateLimitResponse) return rateLimitResponse;

  const auth = await getSessionFromRequest(req);
  if (!auth) {
    return NextResponse.json(
      { ok: false, message: "No autenticado.", data: null },
      { status: 401 },
    );
  }

  try {
    const user = await getUserById(auth.user.id);
    if (!user) {
      return NextResponse.json(
        { ok: false, message: "Usuario no encontrado.", data: null },
        { status: 404 },
      );
    }

    if (user.emailVerifiedAt) {
      return NextResponse.json(
        {
          ok: true,
          message: "El correo ya está verificado.",
          data: { alreadyVerified: true },
        },
      );
    }

    const result = await issueEmailVerification({
      userId: user.id,
      email: user.email,
      fullName: user.fullName,
    });

    return NextResponse.json({
      ok: true,
      message: "Correo de verificación enviado.",
      data: {
        alreadyVerified: false,
        expiresAt: result.expiresAt,
      },
    });
  } catch (error) {
    console.error("[api/email-verification/send]", error);
    return NextResponse.json(
      {
        ok: false,
        message: "No fue posible enviar el correo de verificación.",
        data: null,
      },
      { status: 500 },
    );
  }
}
