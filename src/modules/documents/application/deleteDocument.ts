import { recordAuditEvent } from "@/modules/audit/application/recordAuditEvent";
import { recordTimelineEvent } from "@/modules/timeline/application/recordTimelineEvent";
import {
  getDocumentById,
  updateDocumentStatus,
} from "@/modules/documents/infrastructure/documentRepository";

export type DeleteDocumentResult =
  | { ok: true }
  | { ok: false; message: string };

export async function deleteDocument(
  id: string,
  userId: string,
  actorId?: string,
): Promise<DeleteDocumentResult> {
  try {
    const document = await getDocumentById(id);

    if (!document) {
      return { ok: false, message: "Documento no encontrado." };
    }

    if (document.userId !== userId) {
      return { ok: false, message: "No autorizado." };
    }

    if (document.status === "DELETED") {
      return { ok: true };
    }

    const updated = await updateDocumentStatus(id, "DELETED");

    if (!updated) {
      return { ok: false, message: "Error al eliminar el documento." };
    }

    await recordAuditEvent({
      userId: document.userId,
      actorId: actorId ?? userId,
      category: "DOCUMENT",
      severity: "INFO",
      event: "document_deleted",
      description: `Documento eliminado: ${document.name}`,
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
      severity: "WARNING",
      title: "Documento eliminado",
      description: `Eliminaste el documento ${document.name}.`,
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
    console.error("[documents/deleteDocument]", error);
    return { ok: false, message: "Error al eliminar el documento." };
  }
}
