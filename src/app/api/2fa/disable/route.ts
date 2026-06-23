import { NextRequest, NextResponse } from "next/server";
import speakeasy from "speakeasy";

import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/modules/identity/application/sessionToken";
import { getUserById } from "@/modules/identity/infrastructure/userRepository";
import { decryptTwoFactorSecret } from "@/modules/identity/application/twoFactorSecret";
import { enforceRequestRateLimit } from "@/modules/security/application/enforceRequestRateLimit";

export async function POST(req: NextRequest) {
  const rateLimitResponse = enforceRequestRateLimit(req, {
    scope: "2fa-disable",
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

    if (!user?.twoFactorSecret) {
      return NextResponse.json(
        { ok: false, message: "2FA no configurado" },
        { status: 400 },
      );
    }

    const isValid = speakeasy.totp.verify({
      secret: decryptTwoFactorSecret(user.twoFactorSecret),
      encoding: "base32",
      token: code,
      window: 1,
    });

    if (!isValid) {
      return NextResponse.json(
        { ok: false, message: "Código inválido" },
        { status: 400 },
      );
    }

    await prisma.users.update({
      where: { id: session.user.id },
      data: { twoFactorEnabled: false, twoFactorSecret: null, updated_at: new Date() },
    });

    return NextResponse.json({
      ok: true,
      message: "2FA desactivado correctamente.",
    });
  } catch (error) {
    console.error("[2fa/disable]", error);

    return NextResponse.json(
      { ok: false, message: "Error al desactivar 2FA" },
      { status: 500 },
    );
  }
}