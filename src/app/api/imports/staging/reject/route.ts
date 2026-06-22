import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/shared";
import { fail, ok, serverError } from "@/shared/apiResponse";
import { enforceCsrfProtection } from "@/modules/security/application/csrfProtection";
import { getAuditRequestContext } from "@/modules/admin/infrastructure/adminAuditLogRepository";
import {
  rejectNormalizedExchangeEvent,
  StagingValidationError,
} from "@/modules/staging/application/rejectNormalizedExchangeEvent";
import type { StagingActor } from "@/modules/staging/domain/StagingEvent";

type Body = {
  stagingEventId?: string;
  recordIds:       string[];
  reason?:         string;
};

export async function POST(request: NextRequest) {
  const csrf = enforceCsrfProtection(request);
  if (csrf) return csrf;

  const auth = await requireAuth(request);
  if (!auth || auth instanceof NextResponse) return fail("No autorizado.", 401);

  try {
    const body = (await request.json()) as Body;
    const { recordIds, reason } = body;

    if (!Array.isArray(recordIds) || recordIds.length === 0) {
      return fail("recordIds es obligatorio.", 400);
    }

    const { ipAddress, userAgent } = getAuditRequestContext(request);
    const actor: StagingActor = { id: auth.user.id, email: auth.user.email, context: { ipAddress, userAgent } };

    const result = await rejectNormalizedExchangeEvent({ recordIds, actor, reason });

    return ok(
      { rejectedCount: result.rejectedCount, skipped: result.skipped },
      `${result.rejectedCount} registro${result.rejectedCount !== 1 ? "s" : ""} rechazado${result.rejectedCount !== 1 ? "s" : ""}.`,
    );
  } catch (error) {
    if (error instanceof StagingValidationError) {
      if (error.code === "NOT_FOUND")         return fail("Uno o más registros no encontrados.", 404);
      if (error.code === "ALREADY_PROCESSED") return fail(
        "Uno o más registros ya confirmados — no se puede rechazar.",
        409,
      );
    }
    return serverError(error);
  }
}
