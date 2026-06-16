import { NextRequest, NextResponse } from "next/server";

import { requireAuth } from "@/shared";
import { ok, fail, serverError } from "@/shared/apiResponse";
import { completeTask } from "@/modules/tasks/application/completeTask";

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
    const result = await completeTask(id, auth.user.id);

    if (!result.ok) {
      return fail(result.message, 400);
    }

    return ok(null, "Tarea completada.");
  } catch (error) {
    return serverError(error);
  }
}
