import { NextRequest, NextResponse } from "next/server";
import speakeasy from "speakeasy";
import { db } from "@/infrastructure/db/client";
import { getSessionFromRequest } from "@/modules/identity/application/sessionToken";
import { getUserById } from "@/modules/identity/infrastructure/userRepository";

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ ok: false, message: "No autorizado" }, { status: 401 });
    }

    const { code } = await req.json();
    if (!code) {
      return NextResponse.json({ ok: false, message: "Código requerido" }, { status: 400 });
    }

    const user = await getUserById(session.user.id);
    if (!user?.twoFactorSecret) {
      return NextResponse.json({ ok: false, message: "2FA no iniciado" }, { status: 400 });
    }

    const isValid = speakeasy.totp.verify({
      secret:   user.twoFactorSecret,
      encoding: "base32",
      token:    code,
      window:   1,
    });

    if (!isValid) {
      return NextResponse.json({ ok: false, message: "Código inválido" }, { status: 400 });
    }

    await db.query(
      `update users set "twoFactorEnabled" = true, updated_at = now() where id = $1`,
      [session.user.id]
    );

    return NextResponse.json({ ok: true, message: "2FA activado correctamente." });
  } catch (error) {
    console.error("[2fa/verify]", error);
    return NextResponse.json({ ok: false, message: "Error al verificar código" }, { status: 500 });
  }
}