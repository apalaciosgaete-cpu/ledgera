import crypto from "node:crypto";

import { NextRequest, NextResponse } from "next/server";
import QRCode from "qrcode";

import { prisma } from "@/lib/prisma";
import { encryptTwoFactorSecret } from "@/modules/identity/application/twoFactorSecret";
import { createTwoFactorSetup } from "@/modules/identity/application/twoFactorTotp";

// Force dynamic rendering because routes use request.headers/cookies
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const REGISTRATION_2FA_TOKEN_SECRET =
  process.env.REGISTRATION_2FA_TOKEN_SECRET ??
  process.env.AUTH_SECRET ??
  "ledgera-dev-registration-2fa-secret";

function signSetupToken(userId: string, email: string, secret: string) {
  return crypto
    .createHmac("sha256", REGISTRATION_2FA_TOKEN_SECRET)
    .update(`${userId}:${email}:${secret}`)
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

    const setup = createTwoFactorSetup(user.email);
    const qrCode = await QRCode.toDataURL(setup.otpauthUrl);

    await prisma.users.update({
      where: { id: user.id },
      data: {
        twoFactorSecret: encryptTwoFactorSecret(setup.secret),
        twoFactorEnabled: false,
        updated_at: new Date(),
      },
    });

    const setupToken = signSetupToken(user.id, user.email, setup.secret);

    return NextResponse.json({
      ok: true,
      message: "QR de seguridad generado correctamente.",
      data: {
        userId: user.id,
        email: user.email,
        qrCode,
        secret: setup.secret,
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
