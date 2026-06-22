import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/shared";
import { fail, ok, serverError } from "@/shared/apiResponse";
import { enforceCsrfProtection } from "@/modules/security/application/csrfProtection";
import { getAuditRequestContext } from "@/modules/admin/infrastructure/adminAuditLogRepository";
import { rollbackStagingDecision } from "@/modules/staging/application/rollbackStagingDecision";
import { StagingError } from "@/modules/staging/domain/StagingError";

export async function POST(request: NextRequest) {
  const csrf = enforceCsrfProtection(request);
  if (csrf) return csrf;

  const auth = await requireAuth(request);
  if (!auth || auth instanceof NextResponse) return fail("No autorizado.", 401);

  try {
    const body = await request.json() as { bankMovementId?: string; reason?: string };

    if (!body.bankMovementId) return fail("bankMovementId es obligatorio.", 400);

    const ctx    = getAuditRequestContext(request);
    const actor  = { id: auth.user.id, email: auth.user.email, context: ctx };
    const result = await rollbackStagingDecision({
      bankMovementId: body.bankMovementId,
      reason:         body.reason ?? "Reversión de conciliación",
      actor,
    });

    return ok(result, "Conciliación revertida.");
  } catch (error) {
    if (error instanceof StagingError && error.code === "BANK_MOVEMENT_NOT_FOUND") {
      return fail("Movimiento bancario no encontrado.", 404);
    }
    return serverError(error);
  }
}
