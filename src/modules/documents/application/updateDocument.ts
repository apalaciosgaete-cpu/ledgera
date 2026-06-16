import { recordAuditEvent } from "@/modules/audit/application/recordAuditEvent";
import type { UpdateDocumentInput } from "@/modules/documents/domain/document";
import {
  getDocumentById,
  updateDocument as updateDocumentRepo,
} from "@/modules/documents/infrastructure/documentRepository";

export type UpdateDocumentResult =
  | { ok: true }
  | { ok: false; message: string };

export async function updateDocument(
  id: string,
  userId: string,
  input: UpdateDocumentInput,
  actorId?: string,
): Promise<UpdateDocumentResult> {
  try {
    const document = await getDocumentById(id);

    if (!document) {
      return { ok: false, message: "Documento no encontrado." };
    }

    if (document.userId !== userId) {
      return { ok: false, message: "No autorizado." };
    }

    if (document.status === "DELETED") {
      return { ok: false, message: "No se puede editar un documento eliminado." };
    }

    const updated = await updateDocumentRepo(id, {
      name: input.name,
      description: input.description,
      tags: input.tags,
      relatedEntityType: input.relatedEntityType,
      relatedEntityId: input.relatedEntityId,
    });

    if (!updated) {
      return { ok: false, message: "Error al actualizar el documento." };
    }

    await recordAuditEvent({
      userId: document.userId,
      actorId: actorId ?? userId,
      category: "DOCUMENT",
      severity: "INFO",
      event: "document_updated",
      description: `Documento actualizado: ${document.name}`,
      result: "SUCCESS",
      entityType: "Document",
      entityId: id,
      metadata: {
        category: document.category,
        type: document.type,
        fields: Object.keys(input),
      },
    });

    return { ok: true };
  } catch (error) {
    console.error("[documents/updateDocument]", error);
    return { ok: false, message: "Error al actualizar el documento." };
  }
}
