import { NextRequest, NextResponse } from "next/server";

import { requireAuth } from "@/shared";
import { ok, fail, serverError } from "@/shared/apiResponse";
import { getTaskById } from "@/modules/tasks/infrastructure/taskRepository";


// Force dynamic rendering because routes use request.headers/cookies
export const dynamic = 'force-dynamic';
type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  const auth = await requireAuth(request);
  if (!auth || auth instanceof NextResponse) {
    return fail("No autorizado.", 401);
  }

  try {
    const { id } = await context.params;
    const task = await getTaskById(id);

    if (!task || task.userId !== auth.user.id) {
      return fail("Tarea no encontrada.", 404);
    }

    return ok(
      {
        ...task,
        dueDate: task.dueDate?.toISOString() ?? null,
        startedAt: task.startedAt?.toISOString() ?? null,
        completedAt: task.completedAt?.toISOString() ?? null,
        createdAt: task.createdAt.toISOString(),
        updatedAt: task.updatedAt.toISOString(),
      },
      "Tarea obtenida.",
    );
  } catch (error) {
    return serverError(error);
  }
}
