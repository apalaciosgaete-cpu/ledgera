import { NextRequest, NextResponse } from "next/server";

import { requireAuth } from "@/shared";
import { ok, fail, serverError } from "@/shared/apiResponse";
import { blockTask } from "@/modules/tasks/application/blockTask";


// Force dynamic rendering because routes use request.headers/cookies
export const dynamic = 'force-dynamic';
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
    const body = (await request.json().catch(() => ({}))) as { reason?: string };
    const result = await blockTask(id, auth.user.id, body.reason);

    if (!result.ok) {
      return fail(result.message, 400);
    }

    return ok(null, "Tarea bloqueada.");
  } catch (error) {
    return serverError(error);
  }
}
