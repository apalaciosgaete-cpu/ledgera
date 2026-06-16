import { recordAuditEvent } from "@/modules/audit/application/recordAuditEvent";
import { recordTimelineEvent } from "@/modules/timeline/application/recordTimelineEvent";
import {
  getDocumentById,
  updateDocumentStatus,
} from "@/modules/documents/infrastructure/documentRepository";

export type ArchiveDocumentResult =
  | { ok: true }
  | { ok: false; message: string };

export async function archiveDocument(
  id: string,
  userId: string,
  actorId?: string,
): Promise<ArchiveDocumentResult> {
  try {
    const document = await getDocumentById(id);

    if (!document) {
      return { ok: false, message: "Documento no encontrado." };
    }

    if (document.userId !== userId) {
      return { ok: false, message: "No autorizado." };
    }

    if (document.status === "ARCHIVED") {
      return { ok: true };
    }

    if (document.status === "DELETED") {
      return { ok: false, message: "No se puede archivar un documento eliminado." };
    }

    const updated = await updateDocumentStatus(id, "ARCHIVED");

    if (!updated) {
      return { ok: false, message: "Error al archivar el documento." };
    }

    await recordAuditEvent({
      userId: document.userId,
      actorId: actorId ?? userId,
      category: "DOCUMENT",
      severity: "INFO",
      event: "document_archived",
      description: `Documento archivado: ${document.name}`,
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
      title: "Documento archivado",
      description: `Archivaste el documento ${document.name}.`,
      entityType: "Document",
      entityId: id,
      metadata: {
        category: document.category,
        type: document.type,
        fileName: document.fileName,
      },
    });

    return { ok: true };
  } catch (error) {
    console.error("[documents/archiveDocument]", error);
    return { ok: false, message: "Error al archivar el documento." };
  }
}
