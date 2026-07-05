import { NextRequest, NextResponse } from "next/server";

import { requireAuth } from "@/shared";
import { fail, ok, serverError } from "@/shared/apiResponse";
import { enforceCsrfProtection } from "@/modules/security/application/csrfProtection";
import { processDocumentIntake } from "@/modules/intake/application/processDocumentIntake";


// Force dynamic rendering because routes use request.headers/cookies
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

function resolveKindHint(value: FormDataEntryValue | null) {
  return value === "WITHDRAWAL" || value === "DEPOSIT" ? value : undefined;
}

export async function POST(request: NextRequest) {
  const csrf = enforceCsrfProtection(request);
  if (csrf) return csrf;

  const auth = await requireAuth(request);
  if (!auth || auth instanceof NextResponse) return fail("No autorizado.", 401);

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || typeof file === "string") {
      return fail("Se requiere un archivo.", 400);
    }

    const result = await processDocumentIntake({
      userId:        auth.user.id,
      file:          file as Blob,
      sourceHint:    "EXCHANGE",
      providerHint:  "BINANCE",
      documentKind:  "EXCHANGE_HISTORY",
      kindHint:      resolveKindHint(formData.get("kindHint")),
    });

    return ok(
      {
        imported:       result.imported,
        skipped:        result.skipped,
        autoConfirmed:  0,
        pendingReview:  result.pendingReview,
        taxRebuilt:     false,
        format:         result.format,
        errors:         result.errors,
        documentId:     result.documentId,
        redirectTo:     result.redirectTo,
      },
      `Archivo recibido (${result.format}): ${result.imported} registros enviados a revisión, ${result.skipped} ya existían.`,
      201,
    );
  } catch (error) {
    return serverError(error);
  }
}
