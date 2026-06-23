import { NextRequest, NextResponse } from "next/server";
import speakeasy from "speakeasy";
import QRCode from "qrcode";

import { prisma } from "@/lib/prisma";
import { getUserById } from "@/modules/identity/infrastructure/userRepository";
import { encryptTwoFactorSecret } from "@/modules/identity/application/twoFactorSecret";
import { enforceRequestRateLimit } from "@/modules/security/application/enforceRequestRateLimit";

export async function POST(req: NextRequest) {
  const rateLimitResponse = enforceRequestRateLimit(req, {
    scope: "2fa-login-setup",
    maxAttempts: 5,
    windowMs: 60_000,
  });

  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    const { userId, email } = await req.json();

    if (!userId || !email) {
      return NextResponse.json(
        { ok: false, message: "Usuario y correo son requeridos." },
        { status: 400 },
      );
    }

    const user = await getUserById(userId);

    if (!user || user.email.toLowerCase() !== email.toLowerCase()) {
      return NextResponse.json(
        { ok: false, message: "Usuario no encontrado." },
        { status: 404 },
      );
    }

    if (user.status !== "active") {
      return NextResponse.json(
        { ok: false, message: "La cuenta no está activa." },
        { status: 403 },
      );
    }

    const secret = speakeasy.generateSecret({
      name: `LEDGERA (${user.email})`,
      issuer: "LEDGERA",
      length: 20,
    });

    if (!secret.base32 || !secret.otpauth_url) {
      return NextResponse.json(
        { ok: false, message: "No fue posible generar el secreto 2FA." },
        { status: 500 },
      );
    }

    const qrCode = await QRCode.toDataURL(secret.otpauth_url);

    // Guardamos el nuevo secret; el usuario debe verificarlo con /api/2fa/login
    await prisma.users.update({
      where: { id: user.id },
      data: {
        twoFactorSecret: encryptTwoFactorSecret(secret.base32),
        twoFactorEnabled: false,
        updated_at: new Date(),
      },
    });

    return NextResponse.json({
      ok: true,
      data: {
        qrCode,
        secret: secret.base32,
      },
    });
  } catch (error) {
    console.error("[2fa/login/setup]", error);
    return NextResponse.json(
      { ok: false, message: "Error al generar QR de recuperación." },
      { status: 500 },
    );
  }
}
