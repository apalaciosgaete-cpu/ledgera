import { NextRequest, NextResponse } from "next/server";

import { requireAuth } from "@/shared";
import { fail, ok, serverError } from "@/shared/apiResponse";
import { buildAgentPlans } from "@/modules/agent/application/buildAgentPlan";
import { isValidAgentPlanStatus } from "@/modules/agent/domain/agent";
import { listUserAgentPlans } from "@/modules/agent/infrastructure/agentRepository";

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth || auth instanceof NextResponse) return fail("No autorizado.", 401);

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") ?? "";
    const plans = await listUserAgentPlans(auth.user.id, isValidAgentPlanStatus(status) ? status : undefined);
    return ok(
      plans.map((plan) => ({
        ...plan,
        createdAt: plan.createdAt.toISOString(),
        approvedAt: plan.approvedAt?.toISOString() ?? null,
        executedAt: plan.executedAt?.toISOString() ?? null,
        completedAt: plan.completedAt?.toISOString() ?? null,
      })),
      "Planes obtenidos.",
    );
  } catch (error) {
    return serverError(error);
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth || auth instanceof NextResponse) return fail("No autorizado.", 401);

  try {
    const result = await buildAgentPlans(auth.user.id);
    if (!result.ok) return fail(result.message, 500);
    return ok(result, "Planes supervisados generados.");
  } catch (error) {
    return serverError(error);
  }
}
