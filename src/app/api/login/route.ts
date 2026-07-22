// Force dynamic rendering because routes use request.headers/cookies
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";

import {
  createAdminAuditLog,
  getAuditRequestContext,
} from "@/modules/admin/infrastructure/adminAuditLogRepository";
import { recordAuditEvent } from "@/modules/audit/application/recordAuditEvent";
import { rotateSessionForUser } from "@/modules/identity/infrastructure/sessionRepository";
import { getUserByEmail } from "@/modules/identity/infrastructure/userRepository";
import {
  buildSessionExpirationDate,
  generateSessionToken,
} from "@/modules/identity/application/sessionToken";
import { issueTwoFactorLoginChallenge } from "@/modules/identity/application/twoFactorLoginChallenge";
import { verifyPassword } from "@/modules/identity/application/passwordHash";
import {
  checkLoginRateLimit,
  clearLoginRateLimit,
} from "@/modules/security/infrastructure/loginRateLimitStore";
import {
  generateCsrfToken,
  setCsrfCookie,
} from "@/modules/security/application/csrfProtection";

export const runtime = "nodejs";

const TWO_FACTOR_CHALLENGE_COOKIE = "ledgera_2fa_challenge";

type LoginRequestBody = {
  email?: string;
  password?: string;
};

async function recordLoginAudit(input: {
  userId: string;
  event: "login_success" | "login_failed";
  description: string;
  result: "SUCCESS" | "FAILED";
  metadata?: Record<string, unknown>;
}) {
  try {
    await recordAuditEvent({
      userId: input.userId,
      category: "SECURITY",
      severity: input.result === "FAILED" ? "WARNING" : "INFO",
      event: input.event,
      description: input.description,
      result: input.result,
      entityType: "User",
      entityId: input.userId,
      metadata: {
        provider: "credentials",
        ...input.metadata,
      },
    });
  } catch (auditError) {
    console.warn(`[audit] ${input.event} failed`, auditError);
  }
}

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
      await recordLoginAudit({
        userId: user.id,
        event: "login_failed",
        description: "Intento de inicio de sesión fallido por credenciales inválidas",
        result: "FAILED",
        metadata: { reason: "INVALID_CREDENTIALS" },
      });

      return NextResponse.json(
        { ok: false, message: "Credenciales inválidas.", data: null },
        { status: 401 },
      );
    }

    if (user.status !== "active") {
      await recordLoginAudit({
        userId: user.id,
        event: "login_failed",
        description: "Intento de inicio de sesión rechazado para una cuenta inactiva",
        result: "FAILED",
        metadata: { reason: "USER_INACTIVE" },
      });

      return NextResponse.json(
        { ok: false, message: "El usuario no está activo.", data: null },
        { status: 403 },
      );
    }

    const twoFactorEnabled = Boolean(
      user.twoFactorEnabled && user.twoFactorSecret,
    );

    clearLoginRateLimit(rateLimitKey);

    if (twoFactorEnabled) {
      const challenge = await issueTwoFactorLoginChallenge({
        userId: user.id,
        email: user.email,
      });

      const response = NextResponse.json({
        ok: true,
        message: "Ingresa el código de tu aplicación autenticadora.",
        twoFactorRequired: true,
        pendingUserId: user.id,
        pendingEmail: user.email,
        data: null,
      });

      response.cookies.set(TWO_FACTOR_CHALLENGE_COOKIE, challenge.token, {
        httpOnly: true,
        sameSite: "strict",
        secure: process.env.NODE_ENV === "production",
        path: "/api/2fa/login",
        expires: challenge.expires,
      });

      return response;
    }

    const sessionToken = generateSessionToken();
    const expiresAt = buildSessionExpirationDate();

    const session = await rotateSessionForUser({
      userId: user.id,
      token: sessionToken,
      expiresAt,
    });

    await recordLoginAudit({
      userId: user.id,
      event: "login_success",
      description: "Inicio de sesión exitoso mediante credenciales",
      result: "SUCCESS",
      metadata: {
        sessionId: session.id,
        sessionRotation: true,
        twoFactor: false,
      },
    });

    if (user.role === "admin") {
      await createAdminAuditLog({
        action: "ADMIN_LOGIN",
        actorId: user.id,
        actorEmail: user.email,
        ...getAuditRequestContext(req),
        metadata: {
          source: "api/login",
          sessionId: session.id,
          sessionRotation: true,
          twoFactor: false,
        },
      });
    }

    const response = NextResponse.json({
      ok: true,
      message: "Inicio de sesión correcto.",
      data: {
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          status: user.status,
          subscriptionPlan: user.subscriptionPlan,
          subscriptionExpiresAt: user.subscriptionExpiresAt,
          twoFactorEnabled: false,
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

    setCsrfCookie(response, generateCsrfToken());

    return response;
  } catch (error) {
    console.error("[login] error:", error);

    return NextResponse.json(
      { ok: false, message: "No fue posible iniciar sesión.", data: null },
      { status: 500 },
    );
  }
}
