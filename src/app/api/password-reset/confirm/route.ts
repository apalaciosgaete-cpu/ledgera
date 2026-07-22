export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { recordAuditEvent } from "@/modules/audit/application/recordAuditEvent";
import { hashPassword } from "@/modules/identity/application/passwordHash";
import { validatePasswordComplexity } from "@/modules/identity/application/password";
import { parsePasswordResetIdentifier } from "@/modules/identity/application/passwordReset";
import { consumeOneTimeToken } from "@/modules/identity/infrastructure/oneTimeTokenRepository";
import { deleteSessionsByUserId } from "@/modules/identity/infrastructure/sessionRepository";
import { updateUserPassword } from "@/modules/identity/infrastructure/userRepository";
import { enforceCsrfProtection } from "@/modules/security/application/csrfProtection";
import { enforceRequestRateLimit } from "@/modules/security/application/enforceRequestRateLimit";

export async function POST(req: NextRequest) {
  const csrf = enforceCsrfProtection(req);
  if (csrf) return csrf;
  const limited = enforceRequestRateLimit(req, { scope: "password-reset-confirm", maxAttempts: 5, windowMs: 15 * 60 * 1000 });
  if (limited) return limited;

  try {
    const body = (await req.json()) as { token?: string; password?: string };
    const token = String(body.token ?? "").trim();
    const password = String(body.password ?? "");
    const validation = validatePasswordComplexity(password);
    if (!token) return NextResponse.json({ ok: false, message: "El enlace no es válido." }, { status: 400 });
    if (!validation.valid) return NextResponse.json({ ok: false, message: validation.message }, { status: 400 });

    const record = await consumeOneTimeToken(token);
    const userId = record ? parsePasswordResetIdentifier(record.identifier) : null;
    if (!userId) return NextResponse.json({ ok: false, message: "El enlace venció o ya fue utilizado." }, { status: 400 });

    const updated = await updateUserPassword(userId, await hashPassword(password));
    if (!updated) return NextResponse.json({ ok: false, message: "No fue posible actualizar la contraseña." }, { status: 400 });
    await deleteSessionsByUserId(userId);
    try {
      await recordAuditEvent({ userId, category: "SECURITY", severity: "INFO", event: "password_reset", description: "Contraseña restablecida y sesiones anteriores invalidadas", entityType: "User", entityId: userId, metadata: { source: "password-reset", sessionsRevoked: true }, ipAddress: req.ip ?? req.headers.get("x-forwarded-for"), userAgent: req.headers.get("user-agent") });
    } catch (auditError) { console.warn("[password-reset/confirm] audit failed", auditError); }
    return NextResponse.json({ ok: true, message: "Tu contraseña fue actualizada. Ya puedes iniciar sesión." });
  } catch (error) {
    console.error("[api/password-reset/confirm]", error);
    return NextResponse.json({ ok: false, message: "No fue posible actualizar la contraseña." }, { status: 500 });
  }
}
