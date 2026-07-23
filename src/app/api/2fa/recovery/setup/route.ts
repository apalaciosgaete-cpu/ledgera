export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import QRCode from "qrcode";

import { prisma } from "@/lib/prisma";
import {
  prepareTwoFactorRecovery,
  readTwoFactorRecovery,
} from "@/modules/identity/application/twoFactorRecovery";
import {
  createTwoFactorOtpAuthUrl,
  createTwoFactorSetup,
} from "@/modules/identity/application/twoFactorTotp";
import { enforceRequestRateLimit } from "@/modules/security/application/enforceRequestRateLimit";

export async function POST(req: NextRequest) {
  const rateLimitResponse = enforceRequestRateLimit(req, {
    scope: "2fa-recovery-setup",
    maxAttempts: 10,
    windowMs: 15 * 60 * 1000,
  });

  if (rateLimitResponse) return rateLimitResponse;

  try {
    const body = (await req.json()) as { token?: string };
    const token = String(body.token ?? "").trim();

    if (!token) {
      return NextResponse.json(
        { ok: false, message: "Enlace de recuperación inválido." },
        { status: 400 },
      );
    }

    const identity = await readTwoFactorRecovery(token);
    if (!identity) {
      return NextResponse.json(
        { ok: false, message: "El enlace de recuperación expiró o ya no es válido." },
        { status: 401 },
      );
    }

    const user = await prisma.users.findFirst({
      where: {
        id: identity.userId,
        email: identity.email,
      },
      select: {
        id: true,
        email: true,
        status: true,
      },
    });

    if (!user || user.status !== "active") {
      return NextResponse.json(
        { ok: false, message: "La cuenta no está disponible para recuperación." },
        { status: 403 },
      );
    }

    const generatedSecret = identity.pendingSecret
      ? null
      : createTwoFactorSetup(user.email).secret;
    const prepared = identity.pendingSecret
      ? identity
      : await prepareTwoFactorRecovery(token, generatedSecret!);
    const pendingSecret = prepared?.pendingSecret;
    if (!pendingSecret) {
      throw new Error("No fue posible preparar el nuevo secreto TOTP.");
    }

    const qrCode = await QRCode.toDataURL(
      createTwoFactorOtpAuthUrl(pendingSecret, user.email),
    );

    return NextResponse.json({
      ok: true,
      message: "Nuevo autenticador generado.",
      data: {
        qrCode,
        secret: pendingSecret,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("[2fa/recovery/setup]", error);

    return NextResponse.json(
      { ok: false, message: "No fue posible generar el nuevo autenticador." },
      { status: 500 },
    );
  }
}
