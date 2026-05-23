import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/shared";
import { fail, ok, serverError } from "@/shared/apiResponse";
import { enforceCsrfProtection } from "@/modules/security/application/csrfProtection";
import { parseBankFile } from "@/modules/banking/application/parseBankFile";
import { importBankMovements } from "@/modules/banking/application/importBankMovements";

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const csrf = enforceCsrfProtection(request);
  if (csrf) return csrf;

  const auth = await requireAuth(request);
  if (!auth || auth instanceof NextResponse) return fail("No autorizado", 401);

  try {
    const formData = await request.formData();
    const file     = formData.get("file") as File | null;
    const bankName = ((formData.get("bankName") as string) || "").trim();

    if (!file)     return fail("Archivo requerido.", 400);
    if (!bankName) return fail("bankName requerido.", 400);

    const buffer   = Buffer.from(await file.arrayBuffer());
    const fileName = file.name;

    const { fileHash, rows, rawPreview } = await parseBankFile(fileName, buffer);

    const isPdf      = fileName.toLowerCase().endsWith(".pdf");
    const needsReview = isPdf;

    const result = await importBankMovements(
      auth.user.id,
      bankName,
      fileName,
      fileHash,
      buffer,
      rows,
      needsReview,
    );

    return ok(
      {
        uploadId:     result.uploadId,
        totalRows:    result.totalRows,
        importedRows: result.importedRows,
        skippedRows:  result.skippedRows,
        needsReview:  result.needsReview,
        preview:      rawPreview,
      },
      `${result.importedRows} movimientos importados.`,
      201,
    );
  } catch (error) {
    return serverError(error);
  }
}
