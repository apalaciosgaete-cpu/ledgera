export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import speakeasy from "speakeasy";

import { prisma } from "@/lib/prisma";
import {
  createAdminAuditLog,
  getAuditRequestContext,
} from "@/modules/admin/infrastructure/adminAuditLogRepository";
import { recordAuditEvent } from "@/modules/audit/application/recordAuditEvent";
import {
  buildSessionExpirationDate,
  generateSessionToken,
} from "@/modules/identity/application/sessionToken";
import {
  consumeTwoFactorRecovery,
  readTwoFactorRecovery,
} from "@/modules/identity/application/twoFactorRecovery";
import { decryptTwoFactorSecret } from "@/modules/identity/application/twoFactorSecret";
import { rotateSessionForUser } from "@/modules/identity/infrastructure/sessionRepository";
import { getUserById } from "@/modules/identity/infrastructure/userRepository";
import {
  generateCsrfToken,
  setCsrfCookie,
} from "@/modules/security/application/csrfProtection";
import { enforceRequestRateLimit } from "@/modules/security/application/enforceRequestRateLimit";

const TWO_FACTOR_CHALLENGE_COOKIE = "ledgera_2fa_challenge";

function clearLoginChallengeCookie(response: NextResponse) {
  response.cookies.set(TWO_FACTOR_CHALLENGE_COOKIE, "", {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/api/2fa/login",
    expires: new Date(0),
  });
}

export async function POST(req: NextRequest) {
  const rateLimitResponse = enforceRequestRateLimit(req, {
    scope: "2fa-recovery-verify",
    maxAttempts: 5,
    windowMs: 5 * 60 * 1000,
  });

  if (rateLimitResponse) return rateLimitResponse;

  try {
    const body = (await req.json()) as {
      token?: string;
      code?: string;
    };

    const token = String(body.token ?? "").trim();
    const code = String(body.code ?? "").replace(/\D/g, "").slice(0, 6);

    if (!token || code.length !== 6) {
      return NextResponse.json(
        { ok: false, message: "Enlace y código de 6 dígitos son requeridos." },
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

    const user = await getUserById(identity.userId);
    if (
      !user ||
      user.email.toLowerCase() !== identity.email ||
      user.status !== "active" ||
      !user.twoFactorSecret
    ) {
      return NextResponse.json(
        { ok: false, message: "La cuenta no está disponible para recuperación." },
        { status: 403 },
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
        { ok: false, message: "Código inválido. Escanea el QR vigente e intenta nuevamente." },
        { status: 401 },
      );
    }

    const consumedIdentity = await consumeTwoFactorRecovery(token);
    if (
      !consumedIdentity ||
      consumedIdentity.userId !== user.id ||
      consumedIdentity.email !== user.email.toLowerCase()
    ) {
      return NextResponse.json(
        { ok: false, message: "El enlace ya fue utilizado o expiró." },
        { status: 401 },
      );
    }

    const updated = await prisma.users.updateMany({
      where: { id: user.id },
      data: {
        twoFactorEnabled: true,
        updated_at: new Date(),
      },
    });

    if (updated.count !== 1) {
      throw new Error("No fue posible confirmar el nuevo autenticador TOTP.");
    }

    const sessionToken = generateSessionToken();
    const expiresAt = buildSessionExpirationDate();
    const session = await rotateSessionForUser({
      userId: user.id,
      token: sessionToken,
      expiresAt,
    });

    try {
      await recordAuditEvent({
        userId: user.id,
        category: "SECURITY",
        severity: "WARNING",
        event: "2fa_recovered",
        description: "El autenticador TOTP fue reemplazado mediante recuperación por correo",
        result: "SUCCESS",
        entityType: "User",
        entityId: user.id,
        metadata: { source: "email-recovery", sessionRotation: true },
        ipAddress: req.ip ?? req.headers.get("x-forwarded-for") ?? null,
        userAgent: req.headers.get("user-agent") ?? null,
      });
    } catch (auditError) {
      console.warn("[2fa/recovery/verify] audit failed", auditError);
    }

    if (user.role === "admin") {
      await createAdminAuditLog({
        action: "ADMIN_LOGIN",
        actorId: user.id,
        actorEmail: user.email,
        ...getAuditRequestContext(req),
        metadata: {
          source: "api/2fa/recovery/verify",
          twoFactor: true,
          twoFactorRecovery: true,
          sessionId: session.id,
          sessionRotation: true,
        },
      });
    }

    const response = NextResponse.json({
      ok: true,
      message: "Autenticador recuperado correctamente.",
      data: {
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          status: user.status,
          subscriptionPlan: user.subscriptionPlan,
          subscriptionExpiresAt: user.subscriptionExpiresAt,
          twoFactorEnabled: true,
        },
        session: {
          id: session.id,
          token: session.token,
          expiresAt: session.expiresAt,
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
    clearLoginChallengeCookie(response);
    setCsrfCookie(response, generateCsrfToken());

    return response;
  } catch (error) {
    console.error("[2fa/recovery/verify]", error);

    return NextResponse.json(
      { ok: false, message: "No fue posible completar la recuperación del autenticador." },
      { status: 500 },
    );
  }
}
