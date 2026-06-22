import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/shared";
import { fail, ok, serverError } from "@/shared/apiResponse";
import { enforceCsrfProtection } from "@/modules/security/application/csrfProtection";
import { getAuditRequestContext } from "@/modules/admin/infrastructure/adminAuditLogRepository";
import {
  confirmNormalizedExchangeEvent,
  StagingValidationError,
} from "@/modules/staging/application/confirmNormalizedExchangeEvent";
import type { StagingActor } from "@/modules/staging/domain/StagingEvent";
import type { ConfirmOverride } from "@/modules/integrations/binance/application/confirmExchangeRecord";

type Body = {
  stagingEventId?: string;
  recordIds:       string[];
  override?:       ConfirmOverride;
};

export async function POST(request: NextRequest) {
  const csrf = enforceCsrfProtection(request);
  if (csrf) return csrf;

  const auth = await requireAuth(request);
  if (!auth || auth instanceof NextResponse) return fail("No autorizado.", 401);

  try {
    const body = (await request.json()) as Body;
    const { recordIds, override } = body;

    if (!Array.isArray(recordIds) || recordIds.length === 0) {
      return fail("recordIds es obligatorio.", 400);
    }

    const { ipAddress, userAgent } = getAuditRequestContext(request);
    const actor: StagingActor = { id: auth.user.id, email: auth.user.email, context: { ipAddress, userAgent } };

    const result = await confirmNormalizedExchangeEvent({ recordIds, actor, override });

    return ok(
      { movementId: result.movementId, confirmedCount: result.confirmedCount, taxEventsRebuilt: result.taxEventsRebuilt },
      `Evento confirmado: ${result.confirmedCount} fuente${result.confirmedCount > 1 ? "s" : ""} vinculadas al movimiento ${result.movementId}.`,
      201,
    );
  } catch (error) {
    if (error instanceof StagingValidationError) {
      if (error.code === "NOT_FOUND")         return fail("Uno o más registros no encontrados.", 404);
      if (error.code === "ALREADY_PROCESSED") return fail("Uno o más registros ya fueron procesados.", 409);
      if (error.code === "TYPE_UNKNOWN")      return fail(
        "El evento requiere revisión manual — tipo de movimiento no determinado. Usa el formulario de revisión.",
        422,
      );
    }
    return serverError(error);
  }
}
