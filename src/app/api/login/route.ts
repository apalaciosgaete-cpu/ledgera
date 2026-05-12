import { NextRequest, NextResponse } from "next/server";

import { createSession } from "@/modules/identity/infrastructure/sessionRepository";
import { getUserByEmail } from "@/modules/identity/infrastructure/userRepository";
import { generateSessionToken } from "@/modules/identity/application/sessionToken";
import { verifyPassword } from "@/modules/identity/application/password";
import {
  checkLoginRateLimit,
  clearLoginRateLimit,
} from "@/modules/security/infrastructure/loginRateLimitStore";

type LoginRequestBody = {
  email?: string;
  password?: string;
};

function buildSessionExpirationDate() {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);
  return expiresAt;
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
          ok: false,
          twoFactorRequired: true,
          pendingUserId: user.id,
          message: "Se requiere verificación en dos pasos.",
        },
        { status: 200 },
      );
    }

    const sessionToken = generateSessionToken();
    const expiresAt = buildSessionExpirationDate();

    const session = await createSession({
      userId: user.id,
      token: sessionToken,
      expiresAt,
    });

    clearLoginRateLimit(rateLimitKey);

    const response = NextResponse.json({
      ok: true,
      message: "Login exitoso.",
      data: {
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
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

    return response;
  } catch (error) {
    console.error("[login] error:", error);

    return NextResponse.json(
      { ok: false, message: "No fue posible iniciar sesión.", data: null },
      { status: 500 },
    );
  }
}