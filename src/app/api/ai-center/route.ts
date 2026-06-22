import { NextRequest, NextResponse } from "next/server";

import { requireAuth } from "@/shared";
import { fail, ok, serverError } from "@/shared/apiResponse";
import { buildAICenter } from "@/modules/ai-center/application/buildAICenter";

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth || auth instanceof NextResponse) {
    return fail("No autorizado.", 401);
  }

  try {
    const data = await buildAICenter(auth.user.id);
    return ok(data, "Centro AI obtenido.");
  } catch (error) {
    return serverError(error);
  }
}
