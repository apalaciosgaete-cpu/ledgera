export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { issuePasswordReset } from "@/modules/identity/application/passwordReset";
import { getUserByEmail } from "@/modules/identity/infrastructure/userRepository";
import { enforceCsrfProtection } from "@/modules/security/application/csrfProtection";
import { enforceRequestRateLimit } from "@/modules/security/application/enforceRequestRateLimit";

const NEUTRAL_MESSAGE = "Si existe una cuenta asociada, recibirás un enlace para restablecer tu contraseña.";

export async function POST(req: NextRequest) {
  const csrf = enforceCsrfProtection(req);
  if (csrf) return csrf;
  const limited = enforceRequestRateLimit(req, { scope: "password-reset-request", maxAttempts: 3, windowMs: 15 * 60 * 1000 });
  if (limited) return limited;

  try {
    const body = (await req.json()) as { email?: string; website?: string };
    const email = String(body.email ?? "").trim().toLowerCase();
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      return NextResponse.json({ ok: false, message: "Ingresa un correo válido." }, { status: 400 });
    }
    if (body.website) return NextResponse.json({ ok: true, message: NEUTRAL_MESSAGE });

    const user = await getUserByEmail(email);
    if (user && user.status === "active") {
      try {
        await issuePasswordReset({ userId: user.id, email: user.email, fullName: user.fullName });
      } catch (sendError) {
        // La respuesta pública debe seguir siendo neutra para impedir que se
        // deduzca si el correo corresponde a una cuenta existente.
        console.error("[api/password-reset/request] email delivery failed", sendError);
      }
    }
    return NextResponse.json({ ok: true, message: NEUTRAL_MESSAGE });
  } catch (error) {
    console.error("[api/password-reset/request]", error);
    return NextResponse.json({ ok: false, message: "No fue posible procesar la solicitud. Intenta nuevamente." }, { status: 500 });
  }
}
