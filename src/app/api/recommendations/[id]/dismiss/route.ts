import { NextRequest, NextResponse } from "next/server";

import { requireAuth } from "@/shared";
import { ok, fail, serverError } from "@/shared/apiResponse";
import { dismissRecommendation } from "@/modules/recommendations/application/dismissRecommendation";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  const auth = await requireAuth(request);
  if (!auth || auth instanceof NextResponse) {
    return fail("No autorizado.", 401);
  }

  try {
    const { id } = await context.params;
    const result = await dismissRecommendation(id, auth.user.id);

    if (!result.ok) {
      return fail(result.message, 400);
    }

    return ok(null, "Recomendación descartada.");
  } catch (error) {
    return serverError(error);
  }
}
