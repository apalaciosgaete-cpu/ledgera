import crypto from "node:crypto";

import { NextRequest, NextResponse } from "next/server";
import speakeasy from "speakeasy";
import QRCode from "qrcode";

import { prisma } from "@/lib/prisma";
import { sealTotpSeed } from "@/modules/security/application/totpSecretCrypto";

export const runtime = "nodejs";

const REGISTRATION_2FA_TOKEN_SECRET =
  process.env.REGISTRATION_2FA_TOKEN_SECRET ??
  process.env.NEXTAUTH_SECRET ??
  process.env.AUTH_SECRET ??
  "ledgera-dev-registration-2fa-secret";

function signSetupToken(userId: string, email: string, seed: string) {
  return crypto
    .createHmac("sha256", REGISTRATION_2FA_TOKEN_SECRET)
    .update(`${userId}:${email}:${seed}`)
    .digest("hex");
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      userId?: string;
      email?: string;
    };

    const userId = body.userId?.trim();
    const email = body.email?.trim().toLowerCase();

    if (!userId || !email) {
      return NextResponse.json(
        {
          ok: false,
          message: "Usuario y correo son requeridos para configurar 2FA.",
        },
        { status: 400 },
      );
    }

    const user = await prisma.users.findFirst({
      where: {
        id: userId,
        email,
      },
      select: {
        id: true,
        email: true,
        twoFactorEnabled: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          ok: false,
          message: "Usuario no encontrado para configuración 2FA.",
        },
        { status: 404 },
      );
    }

    if (user.twoFactorEnabled) {
      return NextResponse.json(
        {
          ok: false,
          message: "La cuenta ya tiene 2FA activado.",
        },
        { status: 409 },
      );
    }

    const generated = speakeasy.generateSecret({
      name: `LEDGERA (${user.email})`,
      issuer: "LEDGERA",
      length: 20,
    });

    if (!generated.base32 || !generated.otpauth_url) {
      return NextResponse.json(
        {
          ok: false,
          message: "No fue posible generar el código 2FA.",
        },
        { status: 500 },
      );
    }

    const seed = generated.base32;
    const qrCode = await QRCode.toDataURL(generated.otpauth_url);

    await prisma.users.update({
      where: { id: user.id },
      data: {
        twoFactorSecret: sealTotpSeed(seed),
        twoFactorEnabled: false,
        updated_at: new Date(),
      },
    });

    const setupToken = signSetupToken(user.id, user.email, seed);

    return NextResponse.json({
      ok: true,
      message: "QR de seguridad generado correctamente.",
      data: {
        userId: user.id,
        email: user.email,
        qrCode,
        secret: seed,
        setupToken,
      },
    });
  } catch (error) {
    console.error("[2fa/registration/setup]", error);

    return NextResponse.json(
      {
        ok: false,
        message: "Error al iniciar configuración 2FA de registro.",
      },
      { status: 500 },
    );
  }
}
