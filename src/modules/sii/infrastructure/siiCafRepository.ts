import { prisma } from "@/lib/prisma";
import type { SiiCaf, SiiDocumentTypeCode } from "@/modules/sii/domain/sii";

export async function getActiveCaf(
  documentType: SiiDocumentTypeCode,
): Promise<SiiCaf | null> {
  const row = await prisma.siiCaf.findFirst({
    where: { documentType, isActive: true },
    orderBy: { uploadedAt: "desc" },
  });

  return row ? mapCaf(row) : null;
}

export async function createCaf(input: {
  documentType: SiiDocumentTypeCode;
  folioStart: number;
  folioEnd: number;
}): Promise<SiiCaf> {
  const row = await prisma.siiCaf.create({
    data: {
      documentType: input.documentType,
      folioStart: input.folioStart,
      folioEnd: input.folioEnd,
      currentFolio: input.folioStart,
      isActive: true,
    },
  });

  return mapCaf(row);
}

export async function listCafs(): Promise<SiiCaf[]> {
  const rows = await prisma.siiCaf.findMany({
    orderBy: { uploadedAt: "desc" },
  });

  return rows.map(mapCaf);
}

export async function reserveNextFolio(
  documentType: SiiDocumentTypeCode,
): Promise<{ folio: number } | null> {
  const result = await prisma.$queryRaw<{ current_folio: number }[]>`
    UPDATE sii_cafs
    SET current_folio = current_folio + 1
    WHERE document_type = ${documentType}
      AND is_active = true
      AND current_folio < folio_end
    RETURNING current_folio
  `;

  if (!result || result.length === 0) {
    return null;
  }

  return { folio: result[0].current_folio };
}

function mapCaf(row: {
  id: string;
  documentType: string;
  folioStart: number;
  folioEnd: number;
  currentFolio: number;
  isActive: boolean;
  uploadedAt: Date;
}): SiiCaf {
  return {
    id: row.id,
    documentType: row.documentType as SiiDocumentTypeCode,
    folioStart: row.folioStart,
    folioEnd: row.folioEnd,
    currentFolio: row.currentFolio,
    isActive: row.isActive,
    uploadedAt: row.uploadedAt,
  };
}
