// Force dynamic rendering because routes use request.headers/cookies
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";

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
import {
  generateCsrfToken,
  setCsrfCookie,
} from "@/modules/security/application/csrfProtection";

export const runtime = "nodejs";

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

    const sessionToken = generateSessionToken();
    const expiresAt = buildSessionExpirationDate();

    const session = await rotateSessionForUser({
      userId: user.id,
      token: sessionToken,
      expiresAt,
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
        },
      });
    }

    clearLoginRateLimit(rateLimitKey);

    const twoFactorEnabled = Boolean(
      user.twoFactorEnabled && user.twoFactorSecret,
    );

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
          twoFactorEnabled,
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
