import { NextRequest, NextResponse } from "next/server";

import { requireAuth } from "@/shared";
import { ok, fail, serverError } from "@/shared/apiResponse";
import { getUserTasks } from "@/modules/tasks/application/getUserTasks";
import { createTask } from "@/modules/tasks/application/createTask";
import {
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

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") ?? "";
    const category = searchParams.get("category") ?? "";
    const priority = searchParams.get("priority") ?? "";
    const source = searchParams.get("source") ?? "";

    const result = await getUserTasks(auth.user.id, {
      status: isValidTaskStatus(status) ? status : undefined,
      category: isValidTaskCategory(category) ? category : undefined,
      priority: isValidTaskPriority(priority) ? priority : undefined,
      source: isValidTaskSource(source) ? source : undefined,
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

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth || auth instanceof NextResponse) {
    return fail("No autorizado.", 401);
  }

  try {
    const body = (await request.json()) as {
      title?: string;
      description?: string;
      category?: string;
      priority?: string;
      source?: string;
      sourceId?: string | null;
      assignedTo?: string | null;
      dueDate?: string | null;
      metadata?: Record<string, unknown>;
    };

    if (!isValidTaskCategory(body.category ?? "")) {
      return fail("Categoría inválida.", 400);
    }

    if (!isValidTaskPriority(body.priority ?? "")) {
      return fail("Prioridad inválida.", 400);
    }

    if (!isValidTaskSource(body.source ?? "")) {
      return fail("Origen inválido.", 400);
    }

    const result = await createTask({
      userId: auth.user.id,
      title: body.title ?? "",
      description: body.description ?? "",
      category: body.category as "TRIBUTARY" | "COMPLIANCE" | "OPERATIONS" | "CONNECTIONS" | "BILLING" | "SECURITY",
      priority: body.priority as "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
      source: body.source as "ALERT" | "RECOMMENDATION" | "RISK" | "DTE" | "SII" | "BILLING" | "MANUAL",
      sourceId: body.sourceId ?? null,
      assignedTo: body.assignedTo ?? null,
      dueDate: body.dueDate ? new Date(body.dueDate) : null,
      metadata: body.metadata ?? null,
    });

    if (!result.ok) {
      return fail(result.message, 400);
    }

    return ok(
      {
        ...result.task,
        dueDate: result.task.dueDate?.toISOString() ?? null,
        startedAt: result.task.startedAt?.toISOString() ?? null,
        completedAt: result.task.completedAt?.toISOString() ?? null,
        createdAt: result.task.createdAt.toISOString(),
        updatedAt: result.task.updatedAt.toISOString(),
      },
      "Tarea creada.",
      201,
    );
  } catch (error) {
    return serverError(error);
  }
}
