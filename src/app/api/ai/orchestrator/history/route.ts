import { NextRequest, NextResponse } from "next/server";

import { requireAuth } from "@/shared";
import { fail, ok, serverError } from "@/shared/apiResponse";
import { listUserOrchestrationRuns } from "@/modules/ai-orchestrator/infrastructure/orchestrationRepository";

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth || auth instanceof NextResponse) {
    return fail("No autorizado.", 401);
  }

  try {
    const { searchParams } = new URL(request.url);
    const limit = Number(searchParams.get("limit") ?? "20");
    const runs = await listUserOrchestrationRuns(auth.user.id, Number.isFinite(limit) && limit > 0 ? limit : 20);

    return ok(
      runs.map((run) => ({ ...run, executedAt: run.executedAt.toISOString() })),
      "Historial de orquestación obtenido.",
    );
  } catch (error) {
    return serverError(error);
  }
}
