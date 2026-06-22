import { NextRequest, NextResponse } from "next/server";

import { requireAuth } from "@/shared";
import { fail, ok, serverError } from "@/shared/apiResponse";
import { approveAgentPlan } from "@/modules/agent/application/approveAgentPlan";

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAuth(request);
  if (!auth || auth instanceof NextResponse) return fail("No autorizado.", 401);

  try {
    const result = await approveAgentPlan(params.id, auth.user.id);
    if (!result.ok) return fail(result.message, 400);
    return ok(result.plan, "Plan aprobado.");
  } catch (error) {
    return serverError(error);
  }
}
