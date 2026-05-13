import { NextRequest, NextResponse } from "next/server";
import speakeasy from "speakeasy";
import { createAdminAuditLog } from "@/modules/admin/infrastructure/adminAuditLogRepository";
import { getUserById } from "@/modules/identity/infrastructure/userRepository";
import { createSession } from "@/modules/identity/infrastructure/sessionRepository";
import { generateSessionToken } from "@/modules/identity/application/sessionToken";

export async function POST(req: NextRequest) {
  try {
    const { userId, code } = await req.json();

    if (!userId || !code) {
      return NextResponse.json(
        { ok: false, message: "userId y code son requeridos." },
        { status: 400 }
      );
    }

    const user = await getUserById(userId);

    if (!user || !user.twoFactorSecret || !user.twoFactorEnabled) {
      return NextResponse.json(
        { ok: false, message: "Usuario no válido o 2FA no habilitado." },
        { status: 400 }
      );
    }

    const isValid = speakeasy.totp.verify({
      secret:   user.twoFactorSecret,
      encoding: "base32",
      token:    code,
      window:   1,
    });

    if (!isValid) {
      return NextResponse.json(
        { ok: false, message: "Código inválido. Intenta nuevamente." },
        { status: 400 }
      );
    }

    const sessionToken = generateSessionToken();
    const expiresAt    = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const session = await createSession({
      userId: user.id,
      token:  sessionToken,
      expiresAt,
    });
if (user.role === "admin") {
  await createAdminAuditLog({
    action: "ADMIN_LOGIN",
    actorId: user.id,
    actorEmail: user.email,
    metadata: {
      source: "api/2fa/login",
      twoFactor: true,
    },
  });
}
    const response = NextResponse.json({
      ok:      true,
      message: "Autenticación completada.",
      data: {
        user: {
          id:       user.id,
          email:    user.email,
          fullName: user.fullName,
          role:     user.role,
        },
        session: {
          id:        session.id,
          token:     session.token,
          expiresAt: session.expiresAt,
        },
      },
    });

    response.cookies.set("session_token", sessionToken, {
      httpOnly: true,
      sameSite: "lax",
      secure:   process.env.NODE_ENV === "production",
      path:     "/",
      expires:  expiresAt,
    });

    return response;
  } catch (error) {
    console.error("[2fa/login]", error);
    return NextResponse.json(
      { ok: false, message: "Error al completar la autenticación." },
      { status: 500 }
    );
  }
}