import { NextRequest, NextResponse } from "next/server";
import speakeasy from "speakeasy";

import { getSessionFromRequest } from "@/modules/identity/application/sessionToken";
import { getUserById } from "@/modules/identity/infrastructure/userRepository";
import { enforceRequestRateLimit } from "@/modules/security/application/enforceRequestRateLimit";
import { openTotpSeed } from "@/modules/security/application/totpSecretCrypto";

export async function POST(req: NextRequest) {
  const rateLimitResponse = enforceRequestRateLimit(req, {
    scope: "2fa-validate",
    maxAttempts: 5,
    windowMs: 60_000,
  });

  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    const session = await getSessionFromRequest(req);

    if (!session) {
      return NextResponse.json(
        { ok: false, message: "No autorizado" },
        { status: 401 },
      );
    }

    const { code } = await req.json();

    if (!code) {
      return NextResponse.json(
        { ok: false, message: "Código requerido" },
        { status: 400 },
      );
    }

    const user = await getUserById(session.user.id);

    if (!user?.twoFactorSecret || !user?.twoFactorEnabled) {
      return NextResponse.json(
        { ok: false, message: "2FA no habilitado" },
        { status: 400 },
      );
    }

    const isValid = speakeasy.totp.verify({
      secret: openTotpSeed(user.twoFactorSecret),
      encoding: "base32",
      token: code,
      window: 1,
    });

    if (!isValid) {
      return NextResponse.json(
        { ok: false, message: "Código inválido." },
        { status: 400 },
      );
    }

    return NextResponse.json({
      ok: true,
      message: "Código válido.",
    });
  } catch (error) {
    console.error("[2fa/validate]", error);

    return NextResponse.json(
      { ok: false, message: "Error al validar código" },
      { status: 500 },
    );
  }
}
