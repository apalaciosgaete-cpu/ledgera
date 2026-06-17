import { NextRequest, NextResponse } from "next/server";

import { requireAuth } from "@/shared";
import { fail, ok, serverError } from "@/shared/apiResponse";
import { buildDecisionCenter } from "@/modules/decision-center/application/buildDecisionCenter";

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth || auth instanceof NextResponse) {
    return fail("No autorizado.", 401);
  }

  try {
    const summary = await buildDecisionCenter(auth.user.id);
    return ok(
      {
        ...summary,
        generatedAt: summary.generatedAt.toISOString(),
        decisions: summary.decisions.map((decision) => ({
          ...decision,
          createdAt: decision.createdAt.toISOString(),
        })),
      },
      "Centro de decisiones reconstruido.",
    );
  } catch (error) {
    return serverError(error);
  }
}
