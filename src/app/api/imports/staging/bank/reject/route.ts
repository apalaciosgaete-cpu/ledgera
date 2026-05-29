import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/shared";
import { fail, ok, serverError } from "@/shared/apiResponse";
import { enforceCsrfProtection } from "@/modules/security/application/csrfProtection";
import { ignoreBankMovements } from "@/modules/staging/application/ignoreBankMovements";
import { StagingError } from "@/modules/staging/domain/StagingError";

type Body = {
  bankMovementIds?: string[];
  reason?:          string;
};

export async function POST(request: NextRequest) {
  const csrf = enforceCsrfProtection(request);
  if (csrf) return csrf;

  const auth = await requireAuth(request);
  if (!auth || auth instanceof NextResponse) return fail("No autorizado.", 401);

  try {
    const body = (await request.json()) as Body;
    const ids  = Array.isArray(body.bankMovementIds)
      ? body.bankMovementIds.filter(Boolean)
      : [];

    if (ids.length === 0) {
      return fail("bankMovementIds es obligatorio.", 400);
    }

    const result = await ignoreBankMovements({
      bankMovementIds: ids,
      reason:          body.reason,
      userId:          auth.user.id,
    });

    return ok(
      { rejected: result.rejected, bankMovementIds: result.bankMovementIds },
      `${result.rejected} movimiento${result.rejected !== 1 ? "s" : ""} bancario${result.rejected !== 1 ? "s" : ""} rechazado${result.rejected !== 1 ? "s" : ""}.`,
    );
  } catch (error) {
    if (error instanceof StagingError) {
      if (error.code === "NOT_FOUND") return fail("Uno o más movimientos bancarios no existen.", 404);
    }
    return serverError(error);
  }
}
