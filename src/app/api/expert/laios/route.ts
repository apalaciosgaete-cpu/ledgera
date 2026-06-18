import { NextRequest, NextResponse } from "next/server";

import { requireAuth } from "@/shared";
import { fail, ok, serverError } from "@/shared/apiResponse";
import { getExpertLAIOSStates } from "@/modules/laios/application/buildLAIOSState";

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
    const states = await getExpertLAIOSStates();

    const criticalCount = states.filter((s) => s.operatingStatus === "CRITICAL").length;
    const attentionCount = states.filter((s) => s.operatingStatus === "ATTENTION").length;
    const optimalCount = states.filter((s) => s.operatingStatus === "OPTIMAL").length;
    const normalCount = states.filter((s) => s.operatingStatus === "NORMAL").length;

    return ok(
      {
        total: states.length,
        statusDistribution: { CRITICAL: criticalCount, ATTENTION: attentionCount, OPTIMAL: optimalCount, NORMAL: normalCount },
        items: states.map((s) => ({
          ...s,
          generatedAt: s.generatedAt.toISOString(),
        })),
      },
      "Estados LAIOS obtenidos (vista experto).",
    );
  } catch (error) {
    return serverError(error);
  }
}
