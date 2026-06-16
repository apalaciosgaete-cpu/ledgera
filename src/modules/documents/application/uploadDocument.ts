import crypto from "node:crypto";
import path from "node:path";

import { recordAuditEvent } from "@/modules/audit/application/recordAuditEvent";
import { recordTimelineEvent } from "@/modules/timeline/application/recordTimelineEvent";
import {
  type CreateDocumentInput,
  type Document,
  documentTypeFromFileName,
  isValidDocumentCategory,
} from "@/modules/documents/domain/document";
import { createDocument } from "@/modules/documents/infrastructure/documentRepository";
import { createDocumentStorage } from "@/modules/documents/storage/storageFactory";

export type UploadDocumentResult =
  | { ok: true; document: Document }
  | { ok: false; message: string };

export interface UploadDocumentInput {
  userId: string;
  file: Buffer;
  fileName: string;
  mimeType: string;
  category: string;
  name?: string;
  description?: string;
  tags?: string[];
  relatedEntityType?: string;
  relatedEntityId?: string;
  uploadedBy?: string;
}

export async function uploadDocument(input: UploadDocumentInput): Promise<UploadDocumentResult> {
  try {
    if (!isValidDocumentCategory(input.category)) {
      return { ok: false, message: "Categoría de documento no válida." };
    }

    if (!input.file || input.file.length === 0) {
      return { ok: false, message: "El archivo está vacío." };
    }

    const maxSize = Number(process.env.DOCUMENT_MAX_SIZE_MB ?? "50") * 1024 * 1024;
    if (input.file.length > maxSize) {
      return { ok: false, message: `El archivo excede el tamaño máximo permitido de ${maxSize / 1024 / 1024} MB.` };
    }

    const type = documentTypeFromFileName(input.fileName);
    const ext = path.extname(input.fileName).replace(".", "").toLowerCase() || "bin";
    const timestamp = Date.now();
    const random = crypto.randomBytes(8).toString("hex");
    const storageKey = `${input.userId}/${timestamp}-${random}.${ext}`;

    const checksum = crypto.createHash("sha256").update(input.file).digest("hex");

    const storage = createDocumentStorage();
    const uploadResult = await storage.uploadDocument({
      key: storageKey,
      data: input.file,
      contentType: input.mimeType,
    });

    if (!uploadResult.ok) {
      return { ok: false, message: uploadResult.message };
    }

    const createInput: CreateDocumentInput = {
      userId: input.userId,
      category: input.category,
      type,
      name: input.name?.trim() || input.fileName,
      description: input.description,
      fileName: input.fileName,
      mimeType: input.mimeType,
      fileSize: input.file.length,
      storageKey,
      checksum,
      tags: input.tags,
      relatedEntityType: input.relatedEntityType,
      relatedEntityId: input.relatedEntityId,
      uploadedBy: input.uploadedBy,
    };

    const document = await createDocument(createInput);

    await recordAuditEvent({
      userId: input.userId,
      actorId: input.uploadedBy ?? input.userId,
      category: "DOCUMENT",
      severity: "INFO",
      event: "document_uploaded",
      description: `Documento subido: ${document.name}`,
      result: "SUCCESS",
      entityType: "Document",
      entityId: document.id,
      metadata: {
        category: document.category,
        type: document.type,
        fileName: document.fileName,
        fileSize: document.fileSize,
      },
    });

    await recordTimelineEvent({
      userId: input.userId,
      category: "DOCUMENT",
      severity: "INFO",
      title: "Documento subido",
      description: `Subiste el documento ${document.name} (${document.fileName}).`,
      entityType: "Document",
      entityId: document.id,
      metadata: {
        category: document.category,
        type: document.type,
        fileName: document.fileName,
        fileSize: document.fileSize,
      },
    });

    return { ok: true, document };
  } catch (error) {
    console.error("[documents/uploadDocument]", error);
    return { ok: false, message: "Error al subir el documento." };
  }
}
