import { NextRequest, NextResponse } from "next/server";

import { getDocumentMetrics } from "@/modules/documents/application/getDocumentMetrics";
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
    const requestedUserId = searchParams.get("userId") ?? auth.user.id;
    const isAdmin = auth.user.role === "admin";

    if (!isAdmin && requestedUserId !== auth.user.id) {
      return fail("No puedes consultar los documentos de otra cuenta.", 403);
    }

    const result = await getDocumentMetrics(requestedUserId);

    if (!result.ok) {
      return fail(result.message, 400);
    }

    return ok(
      {
        ...result.metrics,
        accessScope: isAdmin && requestedUserId !== auth.user.id
          ? "ADMIN"
          : "OWNER",
      },
      "Métricas obtenidas.",
    );
  } catch (error) {
    return serverError(error);
  }
}
