import { NextRequest, NextResponse } from "next/server";

import { requireAuth } from "@/shared";
import { fail, ok, serverError } from "@/shared/apiResponse";
import { listUserConversations } from "@/modules/copilot/infrastructure/copilotRepository";

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth || auth instanceof NextResponse) {
    return fail("No autorizado.", 401);
  }

  try {
    const { searchParams } = new URL(request.url);
    const limit = Number(searchParams.get("limit") ?? "20");
    const conversations = await listUserConversations(auth.user.id, Number.isFinite(limit) && limit > 0 ? limit : 20);
    return ok(
      conversations.map((conversation) => ({
        ...conversation,
        lastMessageAt: conversation.lastMessageAt.toISOString(),
        createdAt: conversation.createdAt.toISOString(),
        updatedAt: conversation.updatedAt.toISOString(),
      })),
      "Conversaciones obtenidas.",
    );
  } catch (error) {
    return serverError(error);
  }
}
