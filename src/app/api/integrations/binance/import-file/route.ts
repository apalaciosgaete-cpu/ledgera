import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/shared";
import { fail, ok, serverError } from "@/shared/apiResponse";
import { enforceCsrfProtection } from "@/modules/security/application/csrfProtection";
import { prisma } from "@/lib/prisma";
import { parseBinanceFile } from "@/modules/integrations/binance/application/parseBinanceFile";
import { normalizeBinanceFileRow } from "@/modules/integrations/binance/application/normalizeBinanceFileRow";
import { upsertImportRecord } from "@/modules/integrations/binance/infrastructure/exchangeImportRepository";
import { findConnectionByUser } from "@/modules/integrations/binance/infrastructure/exchangeConnectionRepository";
import { encryptSecret } from "@/modules/security/application/encryption";
import { autoConfirmImports } from "@/modules/integrations/binance/application/autoConfirmImports";
import { rebuildTaxEvents } from "@/modules/tax/application/rebuildTaxEvents";
import { generateAnnualTaxSummary } from "@/modules/tax/application/generateAnnualTaxSummary";

export const maxDuration = 60;

async function getOrCreateConnection(userId: string): Promise<string> {
  const existing = await findConnectionByUser(userId, "BINANCE");
  if (existing) return existing.id;

  const placeholder = await prisma.exchangeConnection.create({
    data: {
      userId,
      exchange:           "BINANCE",
      apiKeyEncrypted:    encryptSecret("FILE_IMPORT"),
      apiSecretEncrypted: encryptSecret("FILE_IMPORT"),
      status:             "FILE_ONLY",
      permissions:        "[]",
    },
  });
  return placeholder.id;
}

export async function POST(request: NextRequest) {
  const csrf = enforceCsrfProtection(request);
  if (csrf) return csrf;

  const auth = await requireAuth(request);
  if (!auth || auth instanceof NextResponse) return fail("No autorizado.", 401);

  try {
    const formData = await request.formData();
    const file     = formData.get("file");
    const kindHint = formData.get("kindHint");

    if (!file || typeof file === "string") {
      return fail("Se requiere un archivo CSV.", 400);
    }

    const csvText = await (file as Blob).text();
    if (!csvText.trim()) return fail("El archivo está vacío.", 400);

    const hint = kindHint === "WITHDRAWAL" ? "WITHDRAWAL"
               : kindHint === "DEPOSIT"    ? "DEPOSIT"
               : undefined;

    const { rows, format, errors: parseErrors } = parseBinanceFile(csvText, { kindHint: hint });

    if (parseErrors.length > 0 && rows.length === 0) {
      return fail(parseErrors[0] ?? "Formato no reconocido.", 422);
    }

    const connectionId = await getOrCreateConnection(auth.user.id);

    let imported = 0;
    let skipped  = 0;
    const rowErrors: string[] = [];

    for (const row of rows) {
      try {
        const normalized = await normalizeBinanceFileRow(row);
        const { isNew }  = await upsertImportRecord(
          auth.user.id,
          connectionId,
          "BINANCE",
          normalized,
          JSON.stringify(row),
        );
        isNew ? imported++ : skipped++;
      } catch (err) {
        rowErrors.push(err instanceof Error ? err.message : String(err));
      }
    }

    let autoConfirmed = 0;
    let pendingReview = 0;
    let taxRebuilt    = false;

    try {
      const autoResult = await autoConfirmImports(auth.user.id);
      autoConfirmed = autoResult.confirmed;
      pendingReview = autoResult.skippedReview;

      if (autoConfirmed > 0) {
        const rebuild = await rebuildTaxEvents(auth.user.id);
        taxRebuilt = rebuild.ok;
        if (taxRebuilt) await generateAnnualTaxSummary(auth.user.id);
      }
    } catch (autoErr) {
      rowErrors.push(autoErr instanceof Error ? autoErr.message : "Error en auto-confirmación");
    }

    const allErrors = [...parseErrors, ...rowErrors];
    const reviewMsg = pendingReview > 0 ? `, ${pendingReview} en revisión manual` : "";

    return ok(
      { imported, skipped, autoConfirmed, pendingReview, taxRebuilt, format, errors: allErrors },
      `Archivo procesado (${format}): ${imported} registros importados, ${autoConfirmed} confirmados automáticamente${reviewMsg}.`,
    );
  } catch (error) {
    return serverError(error);
  }
}
