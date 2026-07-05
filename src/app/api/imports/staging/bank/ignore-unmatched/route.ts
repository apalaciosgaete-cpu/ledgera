import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/shared";
import { fail, ok, serverError } from "@/shared/apiResponse";
import { enforceCsrfProtection } from "@/modules/security/application/csrfProtection";
import { ignoreUnmatchedBankMovements } from "@/modules/staging/application/ignoreBankMovements";


// Force dynamic rendering because routes use request.headers/cookies
export const dynamic = 'force-dynamic';
export async function POST(request: NextRequest) {
  const csrf = enforceCsrfProtection(request);
  if (csrf) return csrf;

  const auth = await requireAuth(request);
  if (!auth || auth instanceof NextResponse) return fail("No autorizado.", 401);

  try {
    const result = await ignoreUnmatchedBankMovements(auth.user.id);

    if (result.ignored === 0) {
      return ok({ ignored: 0 }, "Todos los movimientos IMPORTED tienen candidatos. Nada que ignorar.");
    }

    return ok(
      { ignored: result.ignored },
      `${result.ignored} movimiento${result.ignored !== 1 ? "s" : ""} sin match ignorado${result.ignored !== 1 ? "s" : ""}.`,
    );
  } catch (error) {
    return serverError(error);
  }
}
