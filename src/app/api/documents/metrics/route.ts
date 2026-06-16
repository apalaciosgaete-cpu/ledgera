import { NextRequest, NextResponse } from "next/server";

import { requireAuth } from "@/shared";
import { ok, fail, serverError } from "@/shared/apiResponse";
import { getDocumentMetrics } from "@/modules/documents/application/getDocumentMetrics";

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth || auth instanceof NextResponse) {
    return fail("No autorizado.", 401);
  }

  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId") ?? auth.user.id;

    if (userId !== auth.user.id && auth.user.role !== "admin") {
      return fail("No autorizado.", 403);
    }

    const result = await getDocumentMetrics(userId);

    if (!result.ok) {
      return fail(result.message, 400);
    }

    return ok(result.metrics, "Métricas obtenidas.");
  } catch (error) {
    return serverError(error);
  }
}
