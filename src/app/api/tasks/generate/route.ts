import { NextRequest, NextResponse } from "next/server";

import { requireAuth } from "@/shared";
import { ok, fail, serverError } from "@/shared/apiResponse";
import { generateTasksFromRecommendations } from "@/modules/tasks/application/generateTasksFromRecommendations";


// Force dynamic rendering because routes use request.headers/cookies
export const dynamic = 'force-dynamic';
export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth || auth instanceof NextResponse) {
    return fail("No autorizado.", 401);
  }

  try {
    const result = await generateTasksFromRecommendations(auth.user.id);

    if (!result.ok) {
      return fail(result.message, 500);
    }

    return ok({ created: result.created }, "Tareas generadas desde recomendaciones.");
  } catch (error) {
    return serverError(error);
  }
}
