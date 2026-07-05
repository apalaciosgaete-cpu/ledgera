import crypto from "node:crypto";

import { NextRequest, NextResponse } from "next/server";
import speakeasy from "speakeasy";

import {

// Force dynamic rendering because routes use request.headers/cookies
export const dynamic = 'force-dynamic';
  buildSessionExpirationDate,
  generateSessionToken,
} from "@/modules/identity/application/sessionToken";
import { rotateSessionForUser } from "@/modules/identity/infrastructure/sessionRepository";
import { prisma } from "@/lib/prisma";
import { decryptTwoFactorSecret } from "@/modules/identity/application/twoFactorSecret";
import { recordAuditEvent } from "@/modules/audit/application/recordAuditEvent";

export const runtime = "nodejs";

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

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      userId?: string;
      email?: string;
      code?: string;
      setupToken?: string;
    };

    const userId = body.userId?.trim();
    const email = body.email?.trim().toLowerCase();
    const code = body.code?.replace(/\D/g, "").slice(0, 6);
    const setupToken = body.setupToken?.trim();

    if (!userId || !email || !code || !setupToken) {
      console.warn("[2fa/registration/verify] Datos incompletos:", {
        hasUserId: !!userId,
        hasEmail: !!email,
        hasCode: !!code,
        hasSetupToken: !!setupToken,
        userIdLen: userId?.length,
        emailLen: email?.length,
        codeLen: code?.length,
        setupTokenLen: setupToken?.length,
      });
      return NextResponse.json(
        {
          ok: false,
          message: "Datos incompletos para activar seguridad inicial.",
        },
        { status: 400 },
      );
    }

    if (code.length !== 6) {
      return NextResponse.json(
        {
          ok: false,
          message: "El código debe tener 6 dígitos.",
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
        full_name: true,
        role: true,
        status: true,
        subscription_plan: true,
        subscription_expires_at: true,
        twoFactorSecret: true,
        twoFactorEnabled: true,
      },
    });

    if (!user || !user.twoFactorSecret) {
      return NextResponse.json(
        {
          ok: false,
          message: "Configuración 2FA no iniciada.",
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

    if (user.status !== "active") {
      return NextResponse.json(
        {
          ok: false,
          message: "La cuenta no está activa.",
        },
        { status: 403 },
      );
    }

    const secretPlain = decryptTwoFactorSecret(user.twoFactorSecret);

    const expectedSetupToken = signSetupToken(
      user.id,
      user.email,
      secretPlain,
    );

    if (!safeEqual(setupToken, expectedSetupToken)) {
      return NextResponse.json(
        {
          ok: false,
          message: "Token de configuración 2FA inválido.",
        },
        { status: 401 },
      );
    }

    const isValid = speakeasy.totp.verify({
      secret: secretPlain,
      encoding: "base32",
      token: code,
      window: 1,
    });

    if (!isValid) {
      return NextResponse.json(
        {
          ok: false,
          message: "Código 2FA inválido.",
        },
        { status: 401 },
      );
    }

    await prisma.users.update({
      where: { id: user.id },
      data: {
        twoFactorEnabled: true,
        updated_at: new Date(),
      },
    });

    await recordAuditEvent({
      userId: user.id,
      category: "SECURITY",
      severity: "INFO",
      event: "2fa_enabled",
      description: "Seguridad de doble factor activada",
      result: "SUCCESS",
      entityType: "User",
      entityId: user.id,
      metadata: { source: "registration" },
      ipAddress: req.ip ?? req.headers.get("x-forwarded-for") ?? null,
      userAgent: req.headers.get("user-agent") ?? null,
    });

    const sessionToken = generateSessionToken();
    const expiresAt = buildSessionExpirationDate();

    const session = await rotateSessionForUser({
      userId: user.id,
      token: sessionToken,
      expiresAt,
    });

    const response = NextResponse.json({
      ok: true,
      message: "Seguridad inicial activada correctamente.",
      data: {
        user: {
          id: user.id,
          email: user.email,
          fullName: user.full_name,
          role: user.role,
          status: user.status,
          subscriptionPlan: user.subscription_plan,
          subscriptionExpiresAt: user.subscription_expires_at,
          twoFactorEnabled: true,
        },
        session: {
          id: session.id,
          token: sessionToken,
          expiresAt: expiresAt.toISOString(),
        },
      },
    });

    response.cookies.set("session_token", sessionToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      expires: expiresAt,
    });

    return response;
  } catch (error) {
    console.error("[2fa/registration/verify]", error);

    return NextResponse.json(
      {
        ok: false,
        message: "Error al verificar seguridad inicial.",
      },
      { status: 500 },
    );
  }
}
