import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/shared";
import { fail, ok, serverError } from "@/shared/apiResponse";
import { findBankMatchCandidates } from "@/modules/staging/application/findBankMatchCandidates";
import { StagingError } from "@/modules/staging/domain/StagingError";

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth || auth instanceof NextResponse) return fail("No autorizado.", 401);

  try {
    const { searchParams } = new URL(request.url);
    const bankMovementId   = searchParams.get("bankMovementId")?.trim();

    if (!bankMovementId) return fail("bankMovementId es obligatorio.", 400);

    const result = await findBankMatchCandidates(bankMovementId, auth.user.id);

    return ok(
      result,
      `${result.candidates.length} candidato${result.candidates.length !== 1 ? "s" : ""} encontrado${result.candidates.length !== 1 ? "s" : ""}.`,
    );
  } catch (error) {
    if (error instanceof StagingError) {
      if (error.code === "BANK_MOVEMENT_NOT_FOUND") return fail("Movimiento bancario no encontrado.", 404);
      if (error.code === "ALREADY_MATCHED")         return fail("El movimiento ya está conciliado.", 409);
    }
    return serverError(error);
  }
}
