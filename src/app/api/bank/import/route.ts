import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/shared";
import { fail, ok, serverError } from "@/shared/apiResponse";
import { enforceCsrfProtection } from "@/modules/security/application/csrfProtection";
import { requireActiveSubscription } from "@/modules/subscription/application/requireActiveSubscription";
import { parseBankFile } from "@/modules/banking/application/parseBankFile";
import { importBankMovements } from "@/modules/banking/application/importBankMovements";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const csrf = enforceCsrfProtection(request);
  if (csrf) return csrf;

  const auth = await requireAuth(request);
  if (!auth || auth instanceof NextResponse) return fail("No autorizado", 401);

  const subscriptionCheck = requireActiveSubscription(auth.user);
  if (!subscriptionCheck.ok) return subscriptionCheck.response;

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const bankName = ((formData.get("bankName") as string) || "").trim();

    if (!file) return fail("Archivo requerido.", 400);
    if (!bankName) return fail("bankName requerido.", 400);

    const buffer = Buffer.from(await file.arrayBuffer());
    const fileName = file.name;

    const { fileHash, rows, errorRows } = await parseBankFile(fileName, buffer);

    const result = await importBankMovements(
      auth.user.id,
      bankName,
      fileName,
      fileHash,
      rows,
      errorRows,
    );

    return ok(
      {
        uploadId: result.uploadId,
        duplicate: result.duplicate,
        totalRows: result.totalRows,
        importedRows: result.importedRows,
        errorRows: result.errorRows,
        preview: rows.slice(0, 20).map((row) => ({
          occurredAt: row.occurredAt.toISOString(),
          description: row.description,
          amountClp: row.amountClp,
          direction: row.direction,
        })),
      },
      result.duplicate
        ? "Este archivo ya fue importado anteriormente."
        : `${result.importedRows} movimientos importados.`,
      201,
    );
  } catch (error) {
    return serverError(error);
  }
}
