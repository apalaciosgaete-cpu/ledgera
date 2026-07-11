import { NextRequest, NextResponse } from "next/server";

import { requireAuth } from "@/shared";
import { fail, ok, serverError } from "@/shared/apiResponse";
import { enforceCsrfProtection } from "@/modules/security/application/csrfProtection";
import { processDocumentIntake } from "@/modules/intake/application/processDocumentIntake";
import { attachDocumentIntakeMetadata } from "@/modules/intake/application/attachDocumentIntakeMetadata";

// Force dynamic rendering because routes use request.headers/cookies
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function resolveKindHint(value: FormDataEntryValue | null) {
  return value === "WITHDRAWAL" || value === "DEPOSIT" ? value : undefined;
}

function optionalText(formData: FormData, key: string, maxLength: number): string | undefined {
  const value = formData.get(key);
  if (typeof value !== "string") return undefined;
  const normalized = value.trim();
  return normalized ? normalized.slice(0, maxLength) : undefined;
}

function resolveMaxFileSizeBytes(): number {
  const configuredMb = Number(process.env.DOCUMENT_MAX_SIZE_MB ?? "50");
  const safeMb = Number.isFinite(configuredMb) && configuredMb > 0 ? configuredMb : 50;
  return safeMb * 1024 * 1024;
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

    if (file.size === 0) {
      return fail("El archivo está vacío.", 400);
    }

    const maxFileSizeBytes = resolveMaxFileSizeBytes();
    if (file.size > maxFileSizeBytes) {
      return fail(`El archivo excede el tamaño máximo permitido de ${maxFileSizeBytes / 1024 / 1024} MB.`, 413);
    }

    const sourceHint = String(formData.get("sourceHint") ?? "DOCUMENTACION");
    const documentKind = String(formData.get("documentKind") ?? "");
    const result = await processDocumentIntake({
      userId: auth.user.id,
      file: file as Blob,
      sourceHint,
      providerHint: String(formData.get("providerHint") ?? ""),
      documentKind,
      kindHint: resolveKindHint(formData.get("kindHint")),
    });

    await attachDocumentIntakeMetadata({
      documentId: result.documentId,
      sourceHint,
      providerDetected: result.providerDetected,
      documentKind: result.documentKind,
      documentCategory: optionalText(formData, "documentCategory", 60),
      relatedSource: optionalText(formData, "relatedSource", 60),
      period: optionalText(formData, "period", 80),
      description: optionalText(formData, "description", 240),
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
