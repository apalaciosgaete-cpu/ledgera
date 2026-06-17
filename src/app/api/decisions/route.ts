import { NextRequest, NextResponse } from "next/server";

import { requireAuth } from "@/shared";
import { fail, ok, serverError } from "@/shared/apiResponse";
import { buildDecisionCenter } from "@/modules/decision-center/application/buildDecisionCenter";

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth || auth instanceof NextResponse) {
    return fail("No autorizado.", 401);
  }

  try {
    const queue = await buildDecisionCenter(auth.user.id);
    return ok(
      {
        ...queue,
        generatedAt: queue.generatedAt.toISOString(),
        items: queue.items.map((item) => ({
          ...item,
          detectedAt: item.detectedAt.toISOString(),
        })),
      },
      "Cola de decisiones obtenida.",
    );
  } catch (error) {
    return serverError(error);
  }
}
