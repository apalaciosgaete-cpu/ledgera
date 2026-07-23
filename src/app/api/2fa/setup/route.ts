// Force dynamic rendering because routes use request.headers/cookies
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import QRCode from "qrcode";

import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/modules/identity/application/sessionToken";
import { getUserById } from "@/modules/identity/infrastructure/userRepository";
import {
  decryptTwoFactorSecret,
  encryptTwoFactorSecret,
} from "@/modules/identity/application/twoFactorSecret";
import {
  createTwoFactorOtpAuthUrl,
  createTwoFactorSetup,
} from "@/modules/identity/application/twoFactorTotp";
import { enforceRequestRateLimit } from "@/modules/security/application/enforceRequestRateLimit";

export async function GET(req: NextRequest) {
  const rateLimitResponse = enforceRequestRateLimit(req, {
    scope: "2fa-setup",
    maxAttempts: 10,
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

    const searchParams = req.nextUrl.searchParams;
    const regenerate = searchParams.get("regenerate") === "1";

    const user = await getUserById(session.user.id);
    const existingSecret = user?.twoFactorSecret
      ? decryptTwoFactorSecret(user.twoFactorSecret)
      : null;

    // Si ya tiene secret y no pide regenerar, reutilizarlo
    if (!regenerate && existingSecret) {
      const otpauthUrl = createTwoFactorOtpAuthUrl(
        existingSecret,
        session.user.email,
      );
      const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl);

      return NextResponse.json({
        ok: true,
        qrCode: qrCodeDataUrl,
        secret: existingSecret,
      });
    }

    // Generar nuevo secret
    const setup = createTwoFactorSetup(session.user.email);
    const qrCodeDataUrl = await QRCode.toDataURL(setup.otpauthUrl);

    await prisma.users.update({
      where: { id: session.user.id },
      data: {
        twoFactorSecret: encryptTwoFactorSecret(setup.secret),
        updated_at: new Date(),
      },
    });

    return NextResponse.json({
      ok: true,
      qrCode: qrCodeDataUrl,
      secret: setup.secret,
    });
  } catch (error) {
    console.error("[2fa/setup]", error);

    return NextResponse.json(
      { ok: false, message: "Error al generar QR" },
      { status: 500 },
    );
  }
}
