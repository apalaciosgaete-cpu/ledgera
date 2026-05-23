import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/shared";
import { fail, ok, serverError } from "@/shared/apiResponse";
import { enforceCsrfProtection } from "@/modules/security/application/csrfProtection";
import { parseBankCsv, autoDetectMapping } from "@/modules/banking/application/parseBankCsv";
import { insertBankMovements, upsertBankCsvTemplate, findBankCsvTemplate, listBankCsvTemplates } from "@/modules/banking/infrastructure/bankMovementRepository";
import type { ColMapping } from "@/modules/banking/domain/bankMovement";

// ── GET: templates guardados del usuario ─────────────────────────────────────
export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth || auth instanceof NextResponse) return fail("No autorizado", 401);

  try {
    const templates = await listBankCsvTemplates(auth.user.id);
    return ok(templates, "Templates obtenidos.");
  } catch (error) {
    return serverError(error);
  }
}

// ── POST: importar CSV bancario ───────────────────────────────────────────────
export async function POST(request: NextRequest) {
  const csrf = enforceCsrfProtection(request);
  if (csrf) return csrf;

  const auth = await requireAuth(request);
  if (!auth || auth instanceof NextResponse) return fail("No autorizado", 401);

  try {
    const contentType = request.headers.get("content-type") ?? "";

    // ── Modo "detect": sube CSV, devuelve headers + sugerencia de mapping ────
    if (contentType.includes("application/json")) {
      const body = await request.json() as {
        mode:      "detect" | "preview" | "import";
        csvBase64?: string;
        bankName?:  string;
        mapping?:   ColMapping;
        saveTemplate?: boolean;
      };

      const { mode, csvBase64, bankName, mapping, saveTemplate } = body;

      if (!csvBase64) return fail("CSV requerido.", 400);

      const csvText = Buffer.from(csvBase64, "base64").toString("utf-8");

      if (mode === "detect") {
        const result = parseBankCsv(csvText);
        let savedTemplate: ColMapping | null = null;

        if (bankName) {
          const tpl = await findBankCsvTemplate(auth.user.id, bankName);
          if (tpl) {
            savedTemplate = {
              colDate:    tpl.colDate,
              colDesc:    tpl.colDesc,
              colAmount:  tpl.colAmount,
              colDebit:   tpl.colDebit,
              colCredit:  tpl.colCredit,
              colBalance: tpl.colBalance,
            };
          }
        }

        return ok({
          headers:          result.headers,
          detectedBank:     result.detectedBank,
          suggestedMapping: savedTemplate ?? result.suggestedMapping,
          separator:        result.separator,
          sampleRows:       0,
        }, "Detección completada.");
      }

      if (mode === "preview") {
        if (!mapping?.colDate || !mapping?.colDesc) {
          return fail("Mapping incompleto: se requieren colDate y colDesc.", 400);
        }
        const result = parseBankCsv(csvText, mapping as ColMapping);
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

      if (mode === "import") {
        if (!mapping?.colDate || !mapping?.colDesc) {
          return fail("Mapping incompleto.", 400);
        }
        if (!bankName) return fail("bankName requerido.", 400);

        const result = parseBankCsv(csvText, mapping as ColMapping);
        if (result.rows.length === 0 && result.errors.length > 0) {
          return fail(`No se parsearon filas. Errores: ${result.errors.slice(0, 3).join("; ")}`, 400);
        }

        const { inserted, skipped } = await insertBankMovements(auth.user.id, bankName, result.rows);

        if (saveTemplate) {
          await upsertBankCsvTemplate(auth.user.id, bankName, mapping as ColMapping);
        }

        return ok(
          { inserted, skipped, parseErrors: result.errors.length },
          `${inserted} movimientos importados, ${skipped} duplicados omitidos.`,
          201,
        );
      }

      return fail("Modo inválido.", 400);
    }

    return fail("Content-Type no soportado.", 415);
  } catch (error) {
    return serverError(error);
  }
}
