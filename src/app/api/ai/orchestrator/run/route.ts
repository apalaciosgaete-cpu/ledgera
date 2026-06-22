import { NextRequest, NextResponse } from "next/server";

import { requireAuth } from "@/shared";
import { fail, ok, serverError } from "@/shared/apiResponse";
import { runAIOrchestration } from "@/modules/ai-orchestrator/application/runAIOrchestration";

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth || auth instanceof NextResponse) {
    return fail("No autorizado.", 401);
  }

  try {
    const result = await runAIOrchestration(auth.user.id);
    return ok(
      {
        ...result,
        executedAt: result.executedAt.toISOString(),
        message: result.status === "SUCCESS"
          ? "LEDGERA actualizó tu estado tributario."
          : "LEDGERA actualizó parte de tu estado tributario.",
      },
      "Orquestación ejecutada.",
    );
  } catch (error) {
    return serverError(error);
  }
}
