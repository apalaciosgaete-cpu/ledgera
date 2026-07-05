import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/shared";
import { fail, ok, serverError } from "@/shared/apiResponse";
import { enforceCsrfProtection } from "@/modules/security/application/csrfProtection";
import { markBankMovementForReview } from "@/modules/staging/application/markBankMovementsForReview";
import { StagingError } from "@/modules/staging/domain/StagingError";


// Force dynamic rendering because routes use request.headers/cookies
export const dynamic = 'force-dynamic';
type Body = { bankMovementId: string };

export async function POST(request: NextRequest) {
  const csrf = enforceCsrfProtection(request);
  if (csrf) return csrf;

  const auth = await requireAuth(request);
  if (!auth || auth instanceof NextResponse) return fail("No autorizado.", 401);

  try {
    const body           = (await request.json()) as Body;
    const bankMovementId = body.bankMovementId?.trim();

    if (!bankMovementId) return fail("bankMovementId es obligatorio.", 400);

    const result = await markBankMovementForReview({ bankMovementId, userId: auth.user.id });

    return ok(result, "Movimiento marcado para revisión.");
  } catch (error) {
    if (error instanceof StagingError) {
      if (error.code === "BANK_MOVEMENT_NOT_FOUND") return fail("Movimiento bancario no encontrado.", 404);
      if (error.code === "ALREADY_MATCHED")         return fail("No puedes marcar en revisión un movimiento ya conciliado.", 409);
    }
    return serverError(error);
  }
}
