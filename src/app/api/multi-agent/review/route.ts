import { NextRequest, NextResponse } from "next/server";

import { requireAuth } from "@/shared";
import { fail, ok, serverError } from "@/shared/apiResponse";
import { runMultiAgentReview } from "@/modules/multi-agent/application/runMultiAgentReview";
import { type SubjectType } from "@/modules/multi-agent/domain/agent";

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth || auth instanceof NextResponse) {
    return fail("No autorizado.", 401);
  }

  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body.subjectType !== "string" || typeof body.subjectId !== "string") {
      return fail("Se requieren 'subjectType' y 'subjectId'.", 400);
    }

    const validTypes = ["TaxCase", "Workflow", "Decision", "MonitorSignal"];
    if (!validTypes.includes(body.subjectType)) {
      return fail("subjectType inválido. Válidos: " + validTypes.join(", "), 400);
    }

    const report = await runMultiAgentReview(
      auth.user.id,
      body.subjectType as SubjectType,
      body.subjectId,
    );

    return ok(
      {
        ...report,
        generatedAt: report.generatedAt.toISOString(),
        assessments: report.assessments.map((a) => ({
          ...a,
          createdAt: a.createdAt.toISOString(),
        })),
      },
      "Revisión multiagente completada.",
    );
  } catch (error) {
    return serverError(error);
  }
}
