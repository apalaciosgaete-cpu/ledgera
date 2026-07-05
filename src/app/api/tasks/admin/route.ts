import { NextRequest, NextResponse } from "next/server";

import { requireAuth } from "@/shared";
import { ok, fail, serverError } from "@/shared/apiResponse";
import { listTasks } from "@/modules/tasks/application/listTasks";
import {

// Force dynamic rendering because routes use request.headers/cookies
export const dynamic = 'force-dynamic';
  isValidTaskCategory,
  isValidTaskPriority,
  isValidTaskSource,
  isValidTaskStatus,
} from "@/modules/tasks/domain/task";

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth || auth instanceof NextResponse) {
    return fail("No autorizado.", 401);
  }

  if (auth.user.role !== "admin") {
    return fail("Sin permisos.", 403);
  }

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") ?? "";
    const category = searchParams.get("category") ?? "";
    const priority = searchParams.get("priority") ?? "";
    const source = searchParams.get("source") ?? "";
    const userId = searchParams.get("userId") ?? "";
    const limit = Number(searchParams.get("limit") ?? "100");

    const result = await listTasks({
      status: isValidTaskStatus(status) ? status : undefined,
      category: isValidTaskCategory(category) ? category : undefined,
      priority: isValidTaskPriority(priority) ? priority : undefined,
      source: isValidTaskSource(source) ? source : undefined,
      userId: userId || undefined,
      limit: Number.isFinite(limit) && limit > 0 ? limit : 100,
    });

    if (!result.ok) {
      return fail(result.message, 500);
    }

    return ok(
      result.tasks.map((t) => ({
        ...t,
        dueDate: t.dueDate?.toISOString() ?? null,
        startedAt: t.startedAt?.toISOString() ?? null,
        completedAt: t.completedAt?.toISOString() ?? null,
        createdAt: t.createdAt.toISOString(),
        updatedAt: t.updatedAt.toISOString(),
      })),
      "Tareas obtenidas.",
    );
  } catch (error) {
    return serverError(error);
  }
}
