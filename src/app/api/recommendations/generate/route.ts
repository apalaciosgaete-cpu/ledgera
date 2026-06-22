import { NextRequest, NextResponse } from "next/server";

import { requireAuth } from "@/shared";
import { ok, fail, serverError } from "@/shared/apiResponse";
import { generateRecommendations } from "@/modules/recommendations/application/generateRecommendations";

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth || auth instanceof NextResponse) {
    return fail("No autorizado.", 401);
  }

  try {
    const result = await generateRecommendations(auth.user.id);

    if (!result.ok) {
      return fail(result.message, 500);
    }

    return ok(result, "Recomendaciones regeneradas.");
  } catch (error) {
    return serverError(error);
  }
}
