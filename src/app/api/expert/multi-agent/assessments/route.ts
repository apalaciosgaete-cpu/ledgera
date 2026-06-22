import { NextRequest, NextResponse } from "next/server";

import { requireAuth } from "@/shared";
import { fail, ok, serverError } from "@/shared/apiResponse";
import { findAssessmentsForExpert } from "@/modules/multi-agent/infrastructure/agentAssessmentRepository";

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
      severity: searchParams.get("severity") ?? undefined,
      agentType: searchParams.get("agentType") ?? undefined,
      userId: searchParams.get("userId") ?? undefined,
    };

    const assessments = await findAssessmentsForExpert(filters);

    const uniqueUserIds = new Set(assessments.map((a) => a.userId));
    const severityDist = {
      CRITICAL: assessments.filter((a) => a.severity === "CRITICAL").length,
      HIGH: assessments.filter((a) => a.severity === "HIGH").length,
      MEDIUM: assessments.filter((a) => a.severity === "MEDIUM").length,
      LOW: assessments.filter((a) => a.severity === "LOW").length,
    };

    return ok(
      {
        total: assessments.length,
        uniqueUsers: uniqueUserIds.size,
        severityDistribution: severityDist,
        items: assessments.map((a) => ({
          ...a,
          createdAt: a.createdAt.toISOString(),
        })),
      },
      "Evaluaciones obtenidas (vista experto).",
    );
  } catch (error) {
    return serverError(error);
  }
}
