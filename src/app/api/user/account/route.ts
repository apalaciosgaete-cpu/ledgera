// src/app/api/user/account/route.ts
// Derecho de supresión (Ley 21.719, Art. 9). Anonimiza los datos identificatorios
// del titular y cierra la cuenta. Los registros tributarios/financieros se
// conservan según la retención legal (Art. 200 Código Tributario), por lo que se
// aplica anonimización en lugar de borrado físico, preservando integridad referencial.
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/modules/identity/application/sessionToken";
import { deleteSessionsByUserId } from "@/modules/identity/infrastructure/sessionRepository";
import { enforceCsrfProtection } from "@/modules/security/application/csrfProtection";
import { recordAuditEvent } from "@/modules/audit/application/recordAuditEvent";


// Force dynamic rendering because routes use request.headers/cookies
export const dynamic = 'force-dynamic';
const CONFIRMATION = "ELIMINAR MI CUENTA";

function ok(data: unknown, status = 200) {
  return new Response(JSON.stringify({ ok: true, data }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function fail(message: string, status = 400) {
  return new Response(JSON.stringify({ ok: false, message, data: null }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function DELETE(req: NextRequest) {
  const csrf = enforceCsrfProtection(req);
  if (csrf) return csrf;

  const auth = await getSessionFromRequest(req);
  if (!auth) return fail("No autorizado.", 401);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return fail("Cuerpo inválido.", 400);
  }

  const confirmation =
    typeof body === "object" && body !== null
      ? (body as Record<string, unknown>).confirmation
      : undefined;

  if (confirmation !== CONFIRMATION) {
    return fail(
      `Confirmación requerida. Envía { "confirmation": "${CONFIRMATION}" } para eliminar tu cuenta.`,
      400,
    );
  }

  const userId = auth.user.id;

  // Limit the projection to the fields required by this operation. This keeps
  // account closure available while older production databases complete
  // non-essential profile migrations.
  const existing = await prisma.users.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      status: true,
    },
  });
  if (!existing) return fail("Usuario no encontrado.", 404);
  if (
    existing.status === "inactive" &&
    existing.email === `eliminado+${userId}@anonimizado.ledgera.cl`
  ) {
    return fail("La cuenta ya fue eliminada.", 409);
  }

  // Anonimización de datos identificatorios. El email se reemplaza por un valor
  // único no reversible para liberar la restricción de unicidad sin colisiones.
  const anonymized = await prisma.users.updateMany({
    where: {
      id: userId,
      status: "active",
    },
    data: {
      status: "inactive",
      email: `eliminado+${userId}@anonimizado.ledgera.cl`,
      full_name: "Cuenta eliminada",
      rut: null,
      phone: null,
      address: null,
      commune: null,
      twoFactorEnabled: false,
      twoFactorSecret: null,
      updated_at: new Date(),
    },
  });

  if (anonymized.count !== 1) {
    return fail("No fue posible eliminar la cuenta.", 409);
  }

  // Revocar todas las sesiones activas del titular.
  await deleteSessionsByUserId(userId).catch(() => 0);

  // Registro de la solicitud de supresión (control de plazos). Best-effort.
  await prisma.dataSubjectRequest
    .create({
      data: {
        userId,
        email: existing.email,
        type: "ERASURE",
        status: "COMPLETED",
        channel: "IN_APP",
        dueAt: new Date(),
        resolvedAt: new Date(),
        resolution:
          "Datos identificatorios anonimizados; registros tributarios conservados por retención legal.",
        ipAddress: req.ip ?? req.headers.get("x-forwarded-for") ?? null,
      },
    })
    .catch(() => undefined);

  await recordAuditEvent({
    userId,
    category: "SECURITY",
    severity: "WARNING",
    event: "account_deleted",
    description:
      "Cuenta eliminada por el titular (derecho de supresión, Ley 21.719). Datos identificatorios anonimizados; registros tributarios conservados por retención legal.",
    result: "SUCCESS",
    entityType: "User",
    entityId: userId,
    metadata: { legalBasis: "Ley 21.719 Art. 9", retention: "Art. 200 Código Tributario" },
    ipAddress: req.ip ?? req.headers.get("x-forwarded-for") ?? null,
    userAgent: req.headers.get("user-agent") ?? null,
  });

  const response = ok({
    deleted: true,
    message:
      "Tu cuenta fue eliminada y tus datos identificatorios anonimizados. Los registros tributarios se conservan por el plazo legal de retención.",
  });

  // Limpiar la cookie de sesión del cliente.
  response.headers.append(
    "Set-Cookie",
    "session_token=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0",
  );

  return response;
}
