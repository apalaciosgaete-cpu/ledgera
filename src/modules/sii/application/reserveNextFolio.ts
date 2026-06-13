import type { SiiDocumentTypeCode } from "@/modules/sii/domain/sii";
import { reserveNextFolio as reserveFolio } from "@/modules/sii/infrastructure/siiCafRepository";

export async function reserveNextFolio(documentType: SiiDocumentTypeCode): Promise<
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

  return { ok: true, folio: result.folio };
}
