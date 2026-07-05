import { NextRequest, NextResponse } from "next/server";

import { requireAuth } from "@/shared";
import { ok, fail, serverError } from "@/shared/apiResponse";
import { deleteDocument } from "@/modules/documents/application/deleteDocument";
import { getDocumentById } from "@/modules/documents/infrastructure/documentRepository";
import { updateDocument } from "@/modules/documents/application/updateDocument";


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

    return ok(document, "Documento obtenido.");
  } catch (error) {
    return serverError(error);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const auth = await requireAuth(request);
  if (!auth || auth instanceof NextResponse) {
    return fail("No autorizado.", 401);
  }

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const name = typeof body.name === "string" ? body.name : undefined;
    const description = typeof body.description === "string" ? body.description : undefined;
    const relatedEntityType = typeof body.relatedEntityType === "string" ? body.relatedEntityType : undefined;
    const relatedEntityId = typeof body.relatedEntityId === "string" ? body.relatedEntityId : undefined;
    const tags = Array.isArray(body.tags)
      ? body.tags.filter((t): t is string => typeof t === "string")
      : undefined;

    const document = await getDocumentById(params.id);

    if (!document) {
      return fail("Documento no encontrado.", 404);
    }

    const targetUserId = document.userId;

    if (targetUserId !== auth.user.id && auth.user.role !== "admin") {
      return fail("No autorizado.", 403);
    }

    const result = await updateDocument(params.id, targetUserId, {
      name,
      description,
      tags,
      relatedEntityType,
      relatedEntityId,
    }, auth.user.id);

    if (!result.ok) {
      return fail(result.message, 400);
    }

    return ok(null, "Documento actualizado.");
  } catch (error) {
    return serverError(error);
  }
}

export async function DELETE(
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

    const targetUserId = document.userId;

    if (targetUserId !== auth.user.id && auth.user.role !== "admin") {
      return fail("No autorizado.", 403);
    }

    const result = await deleteDocument(params.id, targetUserId, auth.user.id);

    if (!result.ok) {
      return fail(result.message, 400);
    }

    return ok(null, "Documento eliminado.");
  } catch (error) {
    return serverError(error);
  }
}
