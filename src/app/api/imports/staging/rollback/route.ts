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
    const body = await request.json() as {
      exchangeRecordId?: string;
      bankMovementId?:   string;
      reason?:           string;
    };

    if (!body.exchangeRecordId && !body.bankMovementId) {
      return fail("exchangeRecordId o bankMovementId son obligatorios.", 400);
    }

    const ctx    = getAuditRequestContext(request);
    const actor  = { id: auth.user.id, email: auth.user.email, context: ctx };
    const result = await rollbackStagingDecision({
      exchangeRecordId: body.exchangeRecordId,
      bankMovementId:   body.bankMovementId,
      reason:           body.reason ?? "Reversión manual",
      actor,
    });

    return ok(result, "Reversión aplicada.");
  } catch (error) {
    if (error instanceof StagingError) {
      if (error.code === "NOT_FOUND" || error.code === "BANK_MOVEMENT_NOT_FOUND") {
        return fail("Entidad no encontrada.", 404);
      }
    }
    return serverError(error);
  }
}
