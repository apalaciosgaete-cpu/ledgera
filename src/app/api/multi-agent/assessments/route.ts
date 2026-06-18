import { NextRequest, NextResponse } from "next/server";

import { requireAuth } from "@/shared";
import { fail, ok, serverError } from "@/shared/apiResponse";
import { findLatestAssessmentsByUser } from "@/modules/multi-agent/infrastructure/agentAssessmentRepository";

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth || auth instanceof NextResponse) {
    return fail("No autorizado.", 401);
  }

  try {
    const assessments = await findLatestAssessmentsByUser(auth.user.id);
    return ok(
      assessments.map((a) => ({
        ...a,
        createdAt: a.createdAt.toISOString(),
      })),
      "Evaluaciones obtenidas.",
    );
  } catch (error) {
    return serverError(error);
  }
}
