export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";

import { sendTwoFactorRecoveryEmail } from "@/lib/emails/twoFactorRecovery";
import { recordAuditEvent } from "@/modules/audit/application/recordAuditEvent";
import { verifyPassword } from "@/modules/identity/application/passwordHash";
import { issueTwoFactorRecovery } from "@/modules/identity/application/twoFactorRecovery";
import { getUserByEmail } from "@/modules/identity/infrastructure/userRepository";
import { enforceRequestRateLimit } from "@/modules/security/application/enforceRequestRateLimit";

function resolveApplicationUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.APP_URL ??
    "https://ledgera.cl"
  ).replace(/\/$/, "");
}

export async function POST(req: NextRequest) {
  const rateLimitResponse = enforceRequestRateLimit(req, {
    scope: "2fa-recovery-request",
    maxAttempts: 5,
    windowMs: 15 * 60 * 1000,
  });

  if (rateLimitResponse) return rateLimitResponse;

  try {
    const body = (await req.json()) as {
      email?: string;
      password?: string;
    };

    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");

    if (!email || !password) {
      return NextResponse.json(
        { ok: false, message: "Correo y contraseña son obligatorios." },
        { status: 400 },
      );
    }

    const user = await getUserByEmail(email);
    const passwordIsValid = user
      ? await verifyPassword(password, user.passwordHash)
      : false;

    if (!user || !passwordIsValid) {
      return NextResponse.json(
        { ok: false, message: "Credenciales inválidas." },
        { status: 401 },
      );
    }

    if (user.status !== "active") {
      return NextResponse.json(
        { ok: false, message: "La cuenta no está activa." },
        { status: 403 },
      );
    }

    if (!user.twoFactorEnabled || !user.twoFactorSecret) {
      return NextResponse.json(
        {
          ok: false,
          message: "La cuenta no tiene un autenticador activo. Inicia sesión con tu correo y contraseña.",
        },
        { status: 400 },
      );
    }

    const recovery = await issueTwoFactorRecovery({
      userId: user.id,
      email: user.email,
    });
    const recoveryUrl = `${resolveApplicationUrl()}/recuperar-2fa?token=${encodeURIComponent(recovery.token)}`;

    await sendTwoFactorRecoveryEmail({
      to: user.email,
      fullName: user.fullName,
      recoveryUrl,
      expiresAt: recovery.expires,
    });

    try {
      await recordAuditEvent({
        userId: user.id,
        category: "SECURITY",
        severity: "WARNING",
        event: "2fa_recovery_requested",
        description: "Se solicitó recuperación del autenticador TOTP",
        result: "SUCCESS",
        entityType: "User",
        entityId: user.id,
        metadata: { source: "login-recovery" },
        ipAddress: req.ip ?? req.headers.get("x-forwarded-for") ?? null,
        userAgent: req.headers.get("user-agent") ?? null,
      });
    } catch (auditError) {
      console.warn("[2fa/recovery/request] audit failed", auditError);
    }

    return NextResponse.json({
      ok: true,
      message: "Enviamos un enlace de recuperación al correo registrado. Revisa también la carpeta de spam.",
      data: {
        expiresAt: recovery.expires.toISOString(),
      },
    });
  } catch (error) {
    console.error("[2fa/recovery/request]", error);

    return NextResponse.json(
      { ok: false, message: "No fue posible iniciar la recuperación del autenticador." },
      { status: 500 },
    );
  }
}
