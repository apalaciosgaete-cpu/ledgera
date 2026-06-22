import { NextRequest, NextResponse } from "next/server";

import { requireAuth } from "@/shared";
import { fail, ok, serverError } from "@/shared/apiResponse";
import { processCopilotMessage } from "@/modules/copilot/application/processCopilotMessage";

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth || auth instanceof NextResponse) {
    return fail("No autorizado.", 401);
  }

  try {
    const body = (await request.json()) as { message?: string; conversationId?: string | null };
    const result = await processCopilotMessage({
      userId: auth.user.id,
      message: body.message ?? "",
      conversationId: body.conversationId ?? null,
    });

    if (!result.ok) return fail(result.message, 400);
    return ok(result.response, "Respuesta generada.");
  } catch (error) {
    return serverError(error);
  }
}
