import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/shared";
import { fail, ok, serverError } from "@/shared/apiResponse";
import { enforceCsrfProtection } from "@/modules/security/application/csrfProtection";
import { parseBankFile } from "@/modules/banking/application/parseBankFile";
import { importBankMovements } from "@/modules/banking/application/importBankMovements";
import { findBankCsvTemplate, upsertBankCsvTemplate } from "@/modules/banking/infrastructure/bankMovementRepository";
import type { ColMapping, BankFileType } from "@/modules/banking/domain/bankTypes";

export const maxDuration = 60;

// ── Detect: POST multipart con solo "file" + opcional "bankName" ──────────────
// Returns: { headers, suggestedMapping, separator, sampleRows, detectedFileType }
//
// Import: POST multipart con "file" + "bankName" + "mapping" JSON + "saveTemplate"

export async function POST(request: NextRequest) {
  const csrf = enforceCsrfProtection(request);
  if (csrf) return csrf;

  const auth = await requireAuth(request);
  if (!auth || auth instanceof NextResponse) return fail("No autorizado", 401);

  try {
    const formData = await request.formData();
    const file     = formData.get("file") as File | null;
    const mode     = (formData.get("mode") as string) || "detect";
    const bankName = ((formData.get("bankName") as string) || "").trim();
    const mappingRaw  = formData.get("mapping") as string | null;
    const saveTemplate = formData.get("saveTemplate") === "true";

    if (!file) return fail("Archivo requerido.", 400);

    const fileName = file.name;
    const ext      = fileName.split(".").pop()?.toLowerCase() ?? "";
    const buffer   = Buffer.from(await file.arrayBuffer());

    const fileType: BankFileType =
      ext === "pdf"              ? "PDF"  :
      ext === "xlsx" || ext === "xls" ? "XLSX" : "CSV";

    // ── Detect ────────────────────────────────────────────────────────────────
    if (mode === "detect") {
      const { detect, result } = await parseBankFile(buffer, fileName);

      if (fileType === "PDF") {
        return ok({
          fileType:    "PDF",
          headers:     [],
          suggestedMapping: {},
          needsMapping: false,
          sampleRows:  [],
          pdfRows:     result?.rows.slice(0, 10).map(r => ({
            occurredAt:  r.occurredAt.toISOString(),
            description: r.description,
            amountClp:   r.amountClp,
            direction:   r.direction,
          })) ?? [],
          pdfTotal:    result?.rows.length ?? 0,
          needsReview: result?.needsReview ?? true,
          errors:      result?.errors ?? [],
        }, "PDF procesado.");
      }

      // CSV / XLSX: ver si hay template guardado
      let savedTemplate: Partial<ColMapping> | null = null;
      if (bankName) {
        const tpl = await findBankCsvTemplate(auth.user.id, bankName);
        if (tpl) {
          savedTemplate = {
            colDate:    tpl.colDate,
            colDesc:    tpl.colDesc,
            colAmount:  tpl.colAmount ?? null,
            colDebit:   tpl.colDebit  ?? null,
            colCredit:  tpl.colCredit ?? null,
            colBalance: tpl.colBalance ?? null,
          };
        }
      }

      return ok({
        fileType,
        headers:          detect?.headers          ?? [],
        suggestedMapping: savedTemplate ?? detect?.suggestedMapping ?? {},
        separator:        detect?.separator        ?? "",
        sampleRows:       detect?.sampleRows        ?? [],
        needsMapping:     true,
        needsReview:      false,
        errors:           [],
      }, "Archivo analizado.");
    }

    // ── Preview ───────────────────────────────────────────────────────────────
    if (mode === "preview") {
      if (fileType === "PDF") return fail("Vista previa no disponible para PDF.", 400);

      const mapping = mappingRaw ? JSON.parse(mappingRaw) as ColMapping : null;
      if (!mapping?.colDate || !mapping?.colDesc) return fail("Mapping incompleto.", 400);

      const { result } = await parseBankFile(buffer, fileName, mapping);
      if (!result) return fail("No se pudo parsear el archivo.", 500);

      return ok({
        rows:    result.rows.slice(0, 20).map(r => ({
          occurredAt:  r.occurredAt.toISOString(),
          description: r.description,
          amountClp:   r.amountClp,
          direction:   r.direction,
          balanceClp:  r.balanceClp,
        })),
        total:   result.rows.length,
        errors:  result.errors.slice(0, 10),
      }, "Vista previa generada.");
    }

    // ── Import ────────────────────────────────────────────────────────────────
    if (mode === "import") {
      if (!bankName) return fail("bankName requerido.", 400);

      let rows       = [];
      let parseErrors: string[] = [];
      let needsReview = false;

      if (fileType === "PDF") {
        const { result } = await parseBankFile(buffer, fileName);
        rows        = result?.rows ?? [];
        parseErrors = result?.errors ?? [];
        needsReview = result?.needsReview ?? true;
      } else {
        const mapping = mappingRaw ? JSON.parse(mappingRaw) as ColMapping : null;
        if (!mapping?.colDate || !mapping?.colDesc) return fail("Mapping incompleto.", 400);

        const { result } = await parseBankFile(buffer, fileName, mapping);
        rows        = result?.rows ?? [];
        parseErrors = result?.errors ?? [];
        needsReview = result?.needsReview ?? false;

        if (saveTemplate) {
          await upsertBankCsvTemplate(auth.user.id, bankName, mapping);
        }
      }

      if (rows.length === 0 && parseErrors.length === 0) {
        return fail("El archivo no contiene filas válidas.", 400);
      }

      const result = await importBankMovements(
        auth.user.id,
        bankName,
        fileName,
        fileType,
        buffer,
        rows,
        parseErrors,
        needsReview,
      );

      return ok(result, `${result.importedRows} movimientos importados.`, 201);
    }

    return fail("Modo inválido.", 400);
  } catch (error) {
    return serverError(error);
  }
}
