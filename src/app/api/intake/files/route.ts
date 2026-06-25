import { NextRequest, NextResponse } from "next/server";

import { requireAuth } from "@/shared";
import { fail, ok, serverError } from "@/shared/apiResponse";
import { enforceCsrfProtection } from "@/modules/security/application/csrfProtection";
import { processDocumentIntake } from "@/modules/intake/application/processDocumentIntake";

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
      sourceHint:    String(formData.get("sourceHint") ?? "DOCUMENTACION"),
      providerHint:  String(formData.get("providerHint") ?? ""),
      documentKind:  String(formData.get("documentKind") ?? ""),
      kindHint:      resolveKindHint(formData.get("kindHint")),
    });

    const stagedMsg = result.stagingTarget === "EXCHANGE"
      ? ` ${result.imported} registros enviados a importaciones.`
      : " Archivo registrado para revisión documental.";

    return ok(
      result,
      `Archivo recibido: ${result.fileName}.${stagedMsg}`,
      201,
    );
  } catch (error) {
    return serverError(error);
  }
}
