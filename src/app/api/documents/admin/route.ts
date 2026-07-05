import { NextRequest, NextResponse } from "next/server";

import { requireAuth } from "@/shared";
import { ok, fail, serverError } from "@/shared/apiResponse";
import { listDocuments } from "@/modules/documents/infrastructure/documentRepository";
import {

// Force dynamic rendering because routes use request.headers/cookies
export const dynamic = 'force-dynamic';
  isValidDocumentCategory,
  isValidDocumentStatus,
  isValidDocumentType,
} from "@/modules/documents/domain/document";

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth || auth instanceof NextResponse) {
    return fail("No autorizado.", 401);
  }

  if (auth.user.role !== "admin") {
    return fail("Sin permisos.", 403);
  }

  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId") ?? "";
    const category = searchParams.get("category") ?? "";
    const status = searchParams.get("status") ?? "";
    const type = searchParams.get("type") ?? "";
    const limit = Number(searchParams.get("limit") ?? "100");

    const documents = await listDocuments({
      ...(userId ? { userId } : {}),
      ...(isValidDocumentCategory(category) ? { category } : {}),
      ...(isValidDocumentStatus(status) ? { status } : {}),
      ...(isValidDocumentType(type) ? { type } : {}),
      limit: Number.isFinite(limit) && limit > 0 ? limit : 100,
    });

    return ok(documents, "Documentos obtenidos.");
  } catch (error) {
    return serverError(error);
  }
}
