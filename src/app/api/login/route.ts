import crypto from "node:crypto";

import { NextRequest, NextResponse } from "next/server";
import speakeasy from "speakeasy";
import QRCode from "qrcode";

import {
  createAdminAuditLog,
  getAuditRequestContext,
} from "@/modules/admin/infrastructure/adminAuditLogRepository";
import { rotateSessionForUser } from "@/modules/identity/infrastructure/sessionRepository";
import { getUserByEmail } from "@/modules/identity/infrastructure/userRepository";
import {
  buildSessionExpirationDate,
  generateSessionToken,
} from "@/modules/identity/application/sessionToken";
import { verifyPassword } from "@/modules/identity/application/passwordHash";
import {
  checkLoginRateLimit,
  clearLoginRateLimit,
} from "@/modules/security/infrastructure/loginRateLimitStore";
import { prisma } from "@/lib/prisma";

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

type LoginRequestBody = {
  email?: string;
  password?: string;
};

function getClientIp(req: NextRequest): string {
  const forwardedFor = req.headers.get("x-forwarded-for");
  const realIp = req.headers.get("x-real-ip");

  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || "unknown";
  }

  return realIp || "unknown";
}

function buildRateLimitKey(req: NextRequest, email: string): string {
  return `${getClientIp(req)}:${email}`;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as LoginRequestBody;

    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "").trim();

    if (!email || !password) {
      return NextResponse.json(
        { ok: false, message: "Email y contraseña son obligatorios.", data: null },
        { status: 400 },
      );
    }

    const rateLimitKey = buildRateLimitKey(req, email);
    const rateLimit = checkLoginRateLimit(rateLimitKey);

    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          ok: false,
          message: "Demasiados intentos de inicio de sesión. Intenta nuevamente más tarde.",
          data: {
            retryAfterSeconds: rateLimit.retryAfterSeconds,
          },
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(rateLimit.retryAfterSeconds),
          },
        },
      );
    }

    const user = await getUserByEmail(email);

    if (!user) {
      console.warn("[login] Usuario no encontrado:", email);
      return NextResponse.json(
        { ok: false, message: "Credenciales inválidas.", data: null },
        { status: 401 },
      );
    }

    const passwordIsValid = await verifyPassword(password, user.passwordHash);

    if (!passwordIsValid) {
      return NextResponse.json(
        { ok: false, message: "Credenciales inválidas.", data: null },
        { status: 401 },
      );
    }

    if (user.status !== "active") {
      return NextResponse.json(
        { ok: false, message: "El usuario no está activo.", data: null },
        { status: 403 },
      );
    }

    if (user.twoFactorEnabled) {
      return NextResponse.json(
        {
          ok: true,
          twoFactorRequired: true,
          pendingUserId: user.id,
          message: "Se requiere verificación en dos pasos.",
        },
        { status: 200 },
      );
    }

    // Sin 2FA activo → forzar configuración antes de crear sesión
    const secret = speakeasy.generateSecret({
      name: `LEDGERA (${user.email})`,
      issuer: "LEDGERA",
      length: 20,
    });

    if (!secret.base32 || !secret.otpauth_url) {
      return NextResponse.json(
        { ok: false, message: "No fue posible generar seguridad 2FA.", data: null },
        { status: 500 },
      );
    }

    const qrCode = await QRCode.toDataURL(secret.otpauth_url);

    await prisma.users.update({
      where: { id: user.id },
      data: {
        twoFactorSecret: secret.base32,
        twoFactorEnabled: false,
        updated_at: new Date(),
      },
    });

    const setupToken = signSetupToken(user.id, user.email, secret.base32);

    clearLoginRateLimit(rateLimitKey);

    return NextResponse.json({
      ok: true,
      twoFactorSetupRequired: true,
      pendingUserId: user.id,
      pendingEmail: user.email,
      qrCode,
      secret: secret.base32,
      setupToken,
      message: "Debes activar autenticación en dos pasos para continuar.",
    });
  } catch (error) {
    console.error("[login] error:", error);

    return NextResponse.json(
      { ok: false, message: "No fue posible iniciar sesión.", data: null },
      { status: 500 },
    );
  }
}
