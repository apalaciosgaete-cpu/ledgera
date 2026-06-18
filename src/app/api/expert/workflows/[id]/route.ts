import { NextRequest, NextResponse } from "next/server";

import { requireAuth } from "@/shared";
import { fail, ok, serverError } from "@/shared/apiResponse";
import { findWorkflowById } from "@/modules/workflow-engine/infrastructure/workflowRepository";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const auth = await requireAuth(request);
  if (!auth || auth instanceof NextResponse) {
    return fail("No autorizado.", 401);
  }

  const user = auth.user as { role?: string };
  if (user.role !== "admin" && user.role !== "contador") {
    return fail("Acceso restringido a expertos.", 403);
  }

  try {
    // Experts can see any user's workflow (no userId filter)
    const workflow = await findWorkflowById(params.id);
    if (!workflow) {
      return fail("Workflow no encontrado.", 404);
    }

    return ok(
      {
        ...workflow,
        createdAt: workflow.createdAt.toISOString(),
        updatedAt: workflow.updatedAt.toISOString(),
        steps: workflow.steps.map((s) => ({
          ...s,
          createdAt: s.createdAt.toISOString(),
          executedAt: s.executedAt ? s.executedAt.toISOString() : null,
        })),
      },
      "Workflow obtenido (vista experto).",
    );
  } catch (error) {
    return serverError(error);
  }
}
