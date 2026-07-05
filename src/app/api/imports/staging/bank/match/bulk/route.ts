import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/shared";
import { fail, ok, serverError } from "@/shared/apiResponse";
import { enforceCsrfProtection } from "@/modules/security/application/csrfProtection";
import { findAndPromoteBulkMatchCandidates } from "@/modules/staging/application/bulkFindBankMatchCandidates";


// Force dynamic rendering because routes use request.headers/cookies
export const dynamic = 'force-dynamic';
export async function POST(request: NextRequest) {
  const csrf = enforceCsrfProtection(request);
  if (csrf) return csrf;

  const auth = await requireAuth(request);
  if (!auth || auth instanceof NextResponse) return fail("No autorizado.", 401);

  try {
    const result = await findAndPromoteBulkMatchCandidates(auth.user.id);

    if (result.scanned === 0) {
      return ok(result, "No hay movimientos bancarios pendientes.");
    }

    return ok(
      result,
      `Escaneados ${result.scanned}: ${result.withCandidates} con candidatos ` +
      `(${result.promotedHigh} alta, ${result.promotedMedium} media), ${result.withoutCandidates} sin match.`,
    );
  } catch (error) {
    return serverError(error);
  }
}
