import fs from "node:fs/promises";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";

import { requireAuth } from "@/shared";
import { fail, serverError } from "@/shared/apiResponse";
import { recordAuditEvent } from "@/modules/audit/application/recordAuditEvent";
import { getDocumentById } from "@/modules/documents/infrastructure/documentRepository";
import { createDocumentStorage } from "@/modules/documents/storage/storageFactory";


// Force dynamic rendering because routes use request.headers/cookies
export const dynamic = 'force-dynamic';
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const auth = await requireAuth(request);
  if (!auth || auth instanceof NextResponse) {
    return fail("No autorizado.", 401);
  }

  try {
    const document = await getDocumentById(params.id);

    if (!document) {
      return fail("Documento no encontrado.", 404);
    }

    if (document.userId !== auth.user.id && auth.user.role !== "admin") {
      return fail("No autorizado.", 403);
    }

    if (document.status === "DELETED") {
      return fail("El documento ha sido eliminado.", 410);
    }

    const provider = process.env.DOCUMENT_STORAGE_PROVIDER ?? "local";

    if (provider === "local") {
      const baseDir = process.env.DOCUMENT_STORAGE_LOCAL_PATH ?? path.join(process.cwd(), "uploads");
      const filePath = path.join(baseDir, document.storageKey);
      const data = await fs.readFile(filePath);

      await recordAuditEvent({
        userId: document.userId,
        actorId: auth.user.id,
        category: "DOCUMENT",
        severity: "INFO",
        event: "document_downloaded",
        description: `Documento descargado: ${document.name}`,
        result: "SUCCESS",
        entityType: "Document",
        entityId: document.id,
        metadata: {
          category: document.category,
          type: document.type,
          fileName: document.fileName,
        },
      });

      return new NextResponse(data, {
        status: 200,
        headers: {
          "Content-Type": document.mimeType,
          "Content-Disposition": `attachment; filename="${encodeURIComponent(document.fileName)}"`,
        },
      });
    }

    const storage = createDocumentStorage();
    const result = await storage.getDocumentUrl(document.storageKey);

    if (!result.ok) {
      return fail(result.message, 400);
    }

    await recordAuditEvent({
      userId: document.userId,
      actorId: auth.user.id,
      category: "DOCUMENT",
      severity: "INFO",
      event: "document_downloaded",
      description: `Documento descargado: ${document.name}`,
      result: "SUCCESS",
      entityType: "Document",
      entityId: document.id,
      metadata: {
        category: document.category,
        type: document.type,
        fileName: document.fileName,
      },
    });

    return NextResponse.redirect(result.url, { status: 302 });
  } catch (error) {
    return serverError(error);
  }
}
