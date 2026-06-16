import type { Document } from "@/modules/documents/domain/document";
import {
  listUserDocuments as listUserDocumentsFromRepo,
} from "@/modules/documents/infrastructure/documentRepository";

export type ListUserDocumentsResult =
  | { ok: true; documents: Document[] }
  | { ok: false; message: string };

export async function listUserDocuments(
  userId: string,
  filters?: {
    category?: Document["category"];
    status?: Document["status"];
    type?: Document["type"];
    relatedEntityType?: string;
    relatedEntityId?: string;
  },
): Promise<ListUserDocumentsResult> {
  try {
    const documents = await listUserDocumentsFromRepo(userId, filters);
    return { ok: true, documents };
  } catch (error) {
    console.error("[documents/listUserDocuments]", error);
    return { ok: false, message: "Error al listar los documentos." };
  }
}
