// src/app/api/2fa/oauth-setup/route.ts
import crypto from "node:crypto";

import { NextRequest, NextResponse } from "next/server";
import speakeasy from "speakeasy";
import QRCode from "qrcode";

import { requireAuth } from "@/shared";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const PENDING_2FA_COOKIE = "ledgera_pending_2fa";

const REGISTRATION_2FA_TOKEN_SECRET =
  process.env.REGISTRATION_2FA_TOKEN_SECRET ??
  process.env.NEXTAUTH_SECRET ??
  process.env.AUTH_SECRET ??
  "ledgera-dev-registration-2fa-secret";

function signSetupToken(userId: string, email: string, secret: string) {
  return crypto
    .createHmac("sha256", REGISTRATION_2FA_TOKEN_SECRET)
    .update(`${userId}:${email}:${secret}`)
    .digest("hex");
}

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req);

    if (!auth || auth instanceof NextResponse) {
      return NextResponse.json(
        { ok: false, message: "No autorizado.", data: null },
        { status: 401 },
      );
    }

    const pendingToken = req.cookies.get(PENDING_2FA_COOKIE)?.value;

    if (!pendingToken) {
      return NextResponse.json(
        { ok: false, message: "Flujo de 2FA no iniciado.", data: null },
        { status: 400 },
      );
    }

    const user = await prisma.users.findUnique({
      where: { id: auth.user.id },
      select: { id: true, email: true, twoFactorSecret: true },
    });

    if (!user || !user.twoFactorSecret) {
      return NextResponse.json(
        { ok: false, message: "Configuración de 2FA no encontrada.", data: null },
        { status: 400 },
      );
    }

    const otpauthUrl = speakeasy.otpauthURL({
      secret: user.twoFactorSecret,
      label: `LEDGERA (${user.email})`,
      issuer: "LEDGERA",
      encoding: "base32",
    });

    const qrCode = await QRCode.toDataURL(otpauthUrl);
    const setupToken = signSetupToken(user.id, user.email, user.twoFactorSecret);

    return NextResponse.json({
      ok: true,
      data: {
        qrCode,
        secret: user.twoFactorSecret,
        setupToken,
      },
    });
  } catch (error) {
    console.error("[2fa/oauth-setup] error:", error);

    return NextResponse.json(
      { ok: false, message: "No fue posible generar la configuración de 2FA.", data: null },
      { status: 500 },
    );
  }
}
