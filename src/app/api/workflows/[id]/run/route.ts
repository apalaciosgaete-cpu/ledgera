import { NextRequest, NextResponse } from "next/server";

import { requireAuth } from "@/shared";
import { fail, ok, serverError } from "@/shared/apiResponse";
import { findWorkflowByIdForUser } from "@/modules/workflow-engine/infrastructure/workflowRepository";
import { runWorkflow } from "@/modules/workflow-engine/application/runWorkflow";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const auth = await requireAuth(request);
  if (!auth || auth instanceof NextResponse) {
    return fail("No autorizado.", 401);
  }

  try {
    const workflow = await findWorkflowByIdForUser(params.id, auth.user.id);
    if (!workflow) {
      return fail("Workflow no encontrado.", 404);
    }

    const result = await runWorkflow(workflow);

    return ok(
      {
        ok: result.ok,
        message: result.message,
        waitingUser: result.waitingUser,
        workflow: {
          ...result.workflow,
          createdAt: result.workflow.createdAt.toISOString(),
          updatedAt: result.workflow.updatedAt.toISOString(),
          steps: result.workflow.steps.map((s) => ({
            ...s,
            createdAt: s.createdAt.toISOString(),
            executedAt: s.executedAt ? s.executedAt.toISOString() : null,
          })),
        },
      },
      result.message,
    );
  } catch (error) {
    return serverError(error);
  }
}
