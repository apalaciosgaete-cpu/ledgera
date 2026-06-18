import { NextRequest, NextResponse } from "next/server";

import { requireAuth } from "@/shared";
import { fail, ok, serverError } from "@/shared/apiResponse";
import { findWorkflowsExpert } from "@/modules/workflow-engine/infrastructure/workflowRepository";
import { type WorkflowSummary } from "@/modules/workflow-engine/domain/workflow";

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth || auth instanceof NextResponse) {
    return fail("No autorizado.", 401);
  }

  const user = auth.user as { role?: string };
  if (user.role !== "admin" && user.role !== "contador") {
    return fail("Acceso restringido a expertos.", 403);
  }

  try {
    const { searchParams } = new URL(request.url);
    const filters = {
      status: searchParams.get("status") ?? undefined,
      userId: searchParams.get("userId") ?? undefined,
    };

    const workflows = await findWorkflowsExpert(filters);

    const uniqueUserIds = new Set(workflows.map((w) => w.userId));

    const summary: WorkflowSummary & { uniqueUsers: number } = {
      total: workflows.length,
      pendingCount: workflows.filter((w) => w.status === "PENDING").length,
      runningCount: workflows.filter((w) => w.status === "RUNNING").length,
      waitingCount: workflows.filter((w) => w.status === "WAITING_USER").length,
      completedCount: workflows.filter((w) => w.status === "COMPLETED").length,
      failedCount: workflows.filter((w) => w.status === "FAILED").length,
      uniqueUsers: uniqueUserIds.size,
      items: workflows.map((w) => ({
        ...w,
        createdAt: w.createdAt.toISOString() as unknown as Date,
        updatedAt: w.updatedAt.toISOString() as unknown as Date,
        steps: w.steps.map((s) => ({
          ...s,
          createdAt: s.createdAt.toISOString() as unknown as Date,
          executedAt: s.executedAt ? s.executedAt.toISOString() as unknown as Date : null,
        })),
      })),
    };

    return ok(summary, "Workflows obtenidos (vista experto).");
  } catch (error) {
    return serverError(error);
  }
}
