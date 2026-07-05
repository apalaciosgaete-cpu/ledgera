import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/shared";
import { fail, ok, serverError } from "@/shared/apiResponse";
import { enforceCsrfProtection } from "@/modules/security/application/csrfProtection";
import { backfillStagingEvents } from "@/modules/staging/application/backfillStagingEvents";


// Force dynamic rendering because routes use request.headers/cookies
export const dynamic = 'force-dynamic';
export async function POST(request: NextRequest) {
  const csrf = enforceCsrfProtection(request);
  if (csrf) return csrf;

  const auth = await requireAuth(request);
  if (!auth || auth instanceof NextResponse) return fail("No autorizado.", 401);

  try {
    const result = await backfillStagingEvents(auth.user.id);
    return ok(
      result,
      `Backfill completado: ${result.exchangeCreated} exchange + ${result.bankCreated} banco creados.`,
    );
  } catch (error) {
    return serverError(error);
  }
}
