import { NextRequest, NextResponse } from "next/server";

import { listUserDocuments } from "@/modules/documents/application/listUserDocuments";
import { uploadDocument } from "@/modules/documents/application/uploadDocument";
import {
  DOCUMENT_CATEGORIES,
  type Document,
  isValidDocumentCategory,
} from "@/modules/documents/domain/document";
import { enforceCsrfProtection } from "@/modules/security/application/csrfProtection";
import { requireActiveSubscription } from "@/modules/subscription/application/requireActiveSubscription";
import { requireAuth } from "@/shared";
import { ok, fail, serverError } from "@/shared/apiResponse";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth || auth instanceof NextResponse) {
    return fail("No autorizado.", 401);
  }

  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category") ?? "";
    const status = searchParams.get("status") ?? "";
    const type = searchParams.get("type") ?? "";

    const result = await listUserDocuments(auth.user.id, {
      ...(isValidDocumentCategory(category) ? { category } : {}),
      ...(status === "ACTIVE" || status === "ARCHIVED" || status === "DELETED" ? { status } : {}),
      ...(type ? { type: type as Document["type"] } : {}),
    });

    if (!result.ok) {
      return fail(result.message, 400);
    }

    return ok(result.documents, "Documentos obtenidos.");
  } catch (error) {
    return serverError(error);
  }
}

export async function POST(request: NextRequest) {
  const csrfResponse = enforceCsrfProtection(request);
  if (csrfResponse) return csrfResponse;

  const auth = await requireAuth(request);
  if (!auth || auth instanceof NextResponse) {
    return fail("No autorizado.", 401);
  }

  const subscriptionCheck = requireActiveSubscription(auth.user);
  if (!subscriptionCheck.ok) return subscriptionCheck.response;

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return fail("Debe enviar un archivo.", 400);
    }

    const category = formData.get("category")?.toString() ?? "TAX";
    if (!isValidDocumentCategory(category)) {
      return fail(`Categoría no válida. Use una de: ${DOCUMENT_CATEGORIES.join(", ")}.`, 400);
    }

    const name = formData.get("name")?.toString() || file.name;
    const description = formData.get("description")?.toString();
    const tagsRaw = formData.get("tags")?.toString() ?? "";
    const tags = tagsRaw
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);
    const relatedEntityType = formData.get("relatedEntityType")?.toString();
    const relatedEntityId = formData.get("relatedEntityId")?.toString();

    const buffer = Buffer.from(await file.arrayBuffer());

    const result = await uploadDocument({
      userId: auth.user.id,
      file: buffer,
      fileName: file.name,
      mimeType: file.type || "application/octet-stream",
      category,
      name,
      description,
      tags,
      relatedEntityType,
      relatedEntityId,
      uploadedBy: auth.user.id,
    });

    if (!result.ok) {
      return fail(result.message, 400);
    }

    return ok(result.document, "Documento subido correctamente.", 201);
  } catch (error) {
    return serverError(error);
  }
}
