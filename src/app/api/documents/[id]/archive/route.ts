import { NextRequest, NextResponse } from "next/server";

import { requireAuth } from "@/shared";
import { ok, fail, serverError } from "@/shared/apiResponse";
import { archiveDocument } from "@/modules/documents/application/archiveDocument";
import { getDocumentById } from "@/modules/documents/infrastructure/documentRepository";


// Force dynamic rendering because routes use request.headers/cookies
export const dynamic = 'force-dynamic';
export async function POST(
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

    const result = await archiveDocument(params.id, targetUserId, auth.user.id);

    if (!result.ok) {
      return fail(result.message, 400);
    }

    return ok(null, "Documento archivado.");
  } catch (error) {
    return serverError(error);
  }
}
