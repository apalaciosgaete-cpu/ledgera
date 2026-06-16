import { NextRequest, NextResponse } from "next/server";

import { requireAuth } from "@/shared";
import { fail, ok, serverError } from "@/shared/apiResponse";
import { buildLearningProfile } from "@/modules/learning-engine/application/buildLearningProfile";

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth || auth instanceof NextResponse) {
    return fail("No autorizado.", 401);
  }

  try {
    const result = await buildLearningProfile(auth.user.id);
    if (!result.ok) return fail(result.message, 500);
    return ok(
      { ...result.profile, generatedAt: result.profile.generatedAt.toISOString() },
      "Perfil de aprendizaje obtenido.",
    );
  } catch (error) {
    return serverError(error);
  }
}
