import { recordAuditEvent } from "@/modules/audit/application/recordAuditEvent";
import { recordTimelineEvent } from "@/modules/timeline/application/recordTimelineEvent";
import { getDocumentById } from "@/modules/documents/infrastructure/documentRepository";
import { createDocumentStorage } from "@/modules/documents/storage/storageFactory";

export type GetDocumentDownloadUrlResult =
  | { ok: true; url: string }
  | { ok: false; message: string };

export async function getDocumentDownloadUrl(
  id: string,
  userId: string,
  actorId?: string,
): Promise<GetDocumentDownloadUrlResult> {
  try {
    const document = await getDocumentById(id);

    if (!document) {
      return { ok: false, message: "Documento no encontrado." };
    }

    if (document.userId !== userId) {
      return { ok: false, message: "No autorizado." };
    }

    if (document.status === "DELETED") {
      return { ok: false, message: "El documento ha sido eliminado." };
    }

    const storage = createDocumentStorage();
    const result = await storage.getDocumentUrl(document.storageKey);

    if (!result.ok) {
      return { ok: false, message: result.message };
    }

    await recordAuditEvent({
      userId: document.userId,
      actorId: actorId ?? userId,
      category: "DOCUMENT",
      severity: "INFO",
      event: "document_downloaded",
      description: `Documento descargado: ${document.name}`,
      result: "SUCCESS",
      entityType: "Document",
      entityId: id,
      metadata: {
        category: document.category,
        type: document.type,
        fileName: document.fileName,
      },
    });

    await recordTimelineEvent({
      userId: document.userId,
      category: "DOCUMENT",
      severity: "INFO",
      title: "Documento descargado",
      description: `Descargaste el documento ${document.name}.`,
      entityType: "Document",
      entityId: id,
      metadata: {
        category: document.category,
        type: document.type,
        fileName: document.fileName,
      },
    });

    return { ok: true, url: result.url };
  } catch (error) {
    console.error("[documents/getDocumentDownloadUrl]", error);
    return { ok: false, message: "Error al obtener el documento." };
  }
}
