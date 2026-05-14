import { NextRequest, NextResponse } from "next/server";
import speakeasy from "speakeasy";
import QRCode from "qrcode";

import { db } from "@/infrastructure/db/client";
import { getSessionFromRequest } from "@/modules/identity/application/sessionToken";
import { enforceRequestRateLimit } from "@/modules/security/application/enforceRequestRateLimit";

export async function GET(req: NextRequest) {
  const rateLimitResponse = enforceRequestRateLimit(req, {
    scope: "2fa-setup",
    maxAttempts: 10,
    windowMs: 60_000,
  });

  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    const session = await getSessionFromRequest(req);

    if (!session) {
      return NextResponse.json(
        { ok: false, message: "No autorizado" },
        { status: 401 },
      );
    }

    const secret = speakeasy.generateSecret({
      name: `Ledgera (${session.user.email})`,
      length: 20,
    });

    const qrCodeDataUrl = await QRCode.toDataURL(secret.otpauth_url!);

    await db.query(
      `update users set "twoFactorSecret" = $1, updated_at = now() where id = $2`,
      [secret.base32, session.user.id],
    );

    return NextResponse.json({
      ok: true,
      qrCode: qrCodeDataUrl,
      secret: secret.base32,
    });
  } catch (error) {
    console.error("[2fa/setup]", error);

    return NextResponse.json(
      { ok: false, message: "Error al generar QR" },
      { status: 500 },
    );
  }
}