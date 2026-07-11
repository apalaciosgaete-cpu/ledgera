import { prisma } from "@/lib/prisma";

type DocumentIntakeMetadataInput = {
  documentId: string;
  sourceHint: string;
  providerDetected: string | null;
  documentKind: string;
  documentCategory?: string;
  relatedSource?: string;
  period?: string;
  description?: string;
};

function isMissingDocumentError(error: unknown): boolean {
  if (typeof error !== "object" || error === null || !("code" in error)) return false;
  const code = (error as { code?: unknown }).code;
  return code === "P2021" || code === "P2025";
}

export async function attachDocumentIntakeMetadata(input: DocumentIntakeMetadataInput): Promise<void> {
  if (input.documentId.startsWith("virtual:")) return;

  try {
    await prisma.document.update({
      where: { id: input.documentId },
      data: {
        description: input.description ?? null,
        tags: {
          sourceHint: input.sourceHint.trim().toUpperCase() || "DOCUMENTACION",
          providerDetected: input.providerDetected,
          documentKind: input.documentKind,
          documentCategory: input.documentCategory ?? null,
          relatedSource: input.relatedSource ?? null,
          period: input.period ?? null,
        },
      },
    });
  } catch (error) {
    if (isMissingDocumentError(error)) {
      console.warn("[intake] document metadata could not be attached", {
        documentId: input.documentId,
        reason: (error as { code?: unknown }).code,
      });
      return;
    }

    throw error;
  }
}
