import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/shared";
import { fail, ok, serverError } from "@/shared/apiResponse";
import { enforceCsrfProtection } from "@/modules/security/application/csrfProtection";
import { autoConfirmBankMatches } from "@/modules/staging/application/autoConfirmBankMatches";


// Force dynamic rendering because routes use request.headers/cookies
export const dynamic = 'force-dynamic';
export async function POST(request: NextRequest) {
  const csrf = enforceCsrfProtection(request);
  if (csrf) return csrf;

  const auth = await requireAuth(request);
  if (!auth || auth instanceof NextResponse) return fail("No autorizado.", 401);

  try {
    const result = await autoConfirmBankMatches(auth.user.id);

    return ok(result, `Auto-confirmación completada: ${result.confirmed} confirmados de ${result.scanned} revisados.`);
  } catch (error) {
    return serverError(error);
  }
}
