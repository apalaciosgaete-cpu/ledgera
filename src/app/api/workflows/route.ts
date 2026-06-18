import { NextRequest, NextResponse } from "next/server";

import { requireAuth } from "@/shared";
import { fail, ok, serverError } from "@/shared/apiResponse";
import { findWorkflowsByUser } from "@/modules/workflow-engine/infrastructure/workflowRepository";
import {
  type WorkflowSummary,
  STATUS_LABELS,
} from "@/modules/workflow-engine/domain/workflow";

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth || auth instanceof NextResponse) {
    return fail("No autorizado.", 401);
  }

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") ?? undefined;

    const workflows = await findWorkflowsByUser(auth.user.id, { status });

    const summary: WorkflowSummary = {
      total: workflows.length,
      pendingCount: workflows.filter((w) => w.status === "PENDING").length,
      runningCount: workflows.filter((w) => w.status === "RUNNING").length,
      waitingCount: workflows.filter((w) => w.status === "WAITING_USER").length,
      completedCount: workflows.filter((w) => w.status === "COMPLETED").length,
      failedCount: workflows.filter((w) => w.status === "FAILED").length,
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

    return ok(summary, "Workflows obtenidos.");
  } catch (error) {
    return serverError(error);
  }
}
