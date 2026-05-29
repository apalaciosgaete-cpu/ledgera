import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/shared";
import { fail, ok, serverError } from "@/shared/apiResponse";
import { enforceCsrfProtection } from "@/modules/security/application/csrfProtection";
import { confirmBankMatch } from "@/modules/staging/application/confirmBankMatch";
import { StagingError } from "@/modules/staging/domain/StagingError";

type Body = {
  bankMovementId?:      string;
  portfolioMovementId?: string;
  confidence?:          number;
  reason?:              string;
};

export async function POST(request: NextRequest) {
  const csrf = enforceCsrfProtection(request);
  if (csrf) return csrf;

  const auth = await requireAuth(request);
  if (!auth || auth instanceof NextResponse) return fail("No autorizado.", 401);

  try {
    const body = (await request.json()) as Body;

    const bankMovementId      = body.bankMovementId?.trim();
    const portfolioMovementId = body.portfolioMovementId?.trim();
    const confidence          = typeof body.confidence === "number" ? body.confidence : 0;
    const reason              = body.reason?.trim() || "Match confirmado desde staging.";

    if (!bankMovementId || !portfolioMovementId) {
      return fail("bankMovementId y portfolioMovementId son obligatorios.", 400);
    }

    const result = await confirmBankMatch({
      bankMovementId,
      portfolioMovementId,
      confidence,
      reason,
      userId: auth.user.id,
    });

    return ok(result, "Match bancario confirmado correctamente.");
  } catch (error) {
    if (error instanceof StagingError) {
      if (error.code === "BANK_MOVEMENT_NOT_FOUND")      return fail("Movimiento bancario no encontrado.", 404);
      if (error.code === "PORTFOLIO_MOVEMENT_NOT_FOUND") return fail("Movimiento de portafolio no encontrado.", 404);
      if (error.code === "ALREADY_MATCHED")              return fail("El movimiento bancario ya está conciliado.", 409);
      if (error.code === "ALREADY_IGNORED")              return fail("No se puede conciliar un movimiento bancario ignorado.", 409);
    }
    return serverError(error);
  }
}
