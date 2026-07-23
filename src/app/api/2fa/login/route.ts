// Force dynamic rendering because routes use request.headers/cookies
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";

import {
  createAdminAuditLog,
  getAuditRequestContext,
} from "@/modules/admin/infrastructure/adminAuditLogRepository";
import { getUserById } from "@/modules/identity/infrastructure/userRepository";
import { decryptTwoFactorSecret } from "@/modules/identity/application/twoFactorSecret";
import { validateTwoFactorCode } from "@/modules/identity/application/twoFactorTotp";
import {
  consumeTwoFactorLoginChallenge,
  readTwoFactorLoginChallenge,
} from "@/modules/identity/application/twoFactorLoginChallenge";
import { rotateSessionForUser } from "@/modules/identity/infrastructure/sessionRepository";
import {
  buildSessionExpirationDate,
  generateSessionToken,
} from "@/modules/identity/application/sessionToken";
import { enforceRequestRateLimit } from "@/modules/security/application/enforceRequestRateLimit";
import {
  generateCsrfToken,
  setCsrfCookie,
} from "@/modules/security/application/csrfProtection";

export const runtime = "nodejs";

const TWO_FACTOR_CHALLENGE_COOKIE = "ledgera_2fa_challenge";

function clearChallengeCookie(response: NextResponse) {
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
    scope: "2fa-login",
    maxAttempts: 5,
    windowMs: 60_000,
  });

  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    const body = (await req.json()) as {
      challenge?: string;
      code?: string;
    };
    const challenge = String(
      body.challenge ??
        req.cookies.get(TWO_FACTOR_CHALLENGE_COOKIE)?.value ??
        "",
    ).trim();
    const code = String(body.code ?? "").replace(/\D/g, "").slice(0, 6);

    if (!challenge || code.length !== 6) {
      return NextResponse.json(
        { ok: false, message: "Desafío y código 2FA son requeridos." },
        { status: 400 },
      );
    }

    const challengeIdentity = await readTwoFactorLoginChallenge(challenge);
    if (!challengeIdentity) {
      const response = NextResponse.json(
        {
          ok: false,
          message: "La verificación expiró. Ingresa nuevamente tu contraseña.",
        },
        { status: 401 },
      );
      clearChallengeCookie(response);
      return response;
    }

    const user = await getUserById(challengeIdentity.userId);

    if (
      !user ||
      user.email.toLowerCase() !== challengeIdentity.email ||
      !user.twoFactorEnabled ||
      !user.twoFactorSecret
    ) {
      return NextResponse.json(
        { ok: false, message: "Usuario no válido o 2FA no configurado." },
        { status: 400 },
      );
    }

    if (user.status !== "active") {
      return NextResponse.json(
        { ok: false, message: "El usuario no está activo.", data: null },
        { status: 403 },
      );
    }

    const secret = decryptTwoFactorSecret(user.twoFactorSecret);
    const validationDelta = validateTwoFactorCode({
      secret,
      code,
    });

    if (validationDelta === null) {
      const clockDriftDelta = validateTwoFactorCode({
        secret,
        code,
        window: 10,
      });
      const clockDriftDetected = clockDriftDelta !== null;
      console.warn("[2fa/login] token rejected", {
        reason: clockDriftDetected ? "CLOCK_DRIFT" : "TOKEN_MISMATCH",
        driftSteps: clockDriftDelta,
      });

      return NextResponse.json(
        {
          ok: false,
          message: clockDriftDetected
            ? "La hora de tu autenticador está desincronizada. Activa la fecha y hora automáticas e intenta nuevamente."
            : "Código inválido. Verifica que corresponda a LEDGERA o recupera tu autenticador.",
        },
        { status: 401 },
      );
    }

    const consumedIdentity = await consumeTwoFactorLoginChallenge(challenge);
    if (
      !consumedIdentity ||
      consumedIdentity.userId !== user.id ||
      consumedIdentity.email !== user.email.toLowerCase()
    ) {
      const response = NextResponse.json(
        {
          ok: false,
          message: "La verificación ya fue utilizada o expiró. Inicia sesión nuevamente.",
        },
        { status: 401 },
      );
      clearChallengeCookie(response);
      return response;
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
          source: "api/2fa/login",
          twoFactor: true,
          sessionId: session.id,
          sessionRotation: true,
        },
      });
    }

    const response = NextResponse.json({
      ok: true,
      message: "Autenticación completada.",
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
    clearChallengeCookie(response);
    setCsrfCookie(response, generateCsrfToken());

    return response;
  } catch (error) {
    console.error("[2fa/login]", error);

    return NextResponse.json(
      { ok: false, message: "Error al completar la autenticación." },
      { status: 500 },
    );
  }
}
