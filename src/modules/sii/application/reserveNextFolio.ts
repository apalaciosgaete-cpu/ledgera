import type { SiiDocumentTypeCode } from "@/modules/sii/domain/sii";
import { reserveNextFolio as reserveFolio } from "@/modules/sii/infrastructure/siiCafRepository";
import { recordAuditEvent } from "@/modules/audit/application/recordAuditEvent";

export async function reserveNextFolio(
  documentType: SiiDocumentTypeCode,
  options?: { userId?: string },
): Promise<
  | { ok: true; folio: number }
  | { ok: false; message: string }
> {
  const result = await reserveFolio(documentType);

  if (!result) {
    return {
      ok: false,
      message: "No hay folios disponibles para el tipo de documento solicitado.",
    };
  }

  console.info("[sii]", {
    event: "folio_reserved",
    documentType,
    folio: result.folio,
  });

  await recordAuditEvent({
    userId: options?.userId ?? null,
    category: "SII",
    severity: "INFO",
    event: "folio_reserved",
    description: `Folio ${result.folio} reservado para documento tipo ${documentType}`,
    result: "SUCCESS",
    entityType: "SiiCaf",
    entityId: documentType,
    metadata: { documentType, folio: result.folio },
  });

  return { ok: true, folio: result.folio };
}
