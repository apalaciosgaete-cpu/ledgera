import { NextRequest, NextResponse } from "next/server";

import { requireAuth } from "@/shared";
import { fail, ok, serverError } from "@/shared/apiResponse";
import { getConversationById, listConversationMessages } from "@/modules/copilot/infrastructure/copilotRepository";

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAuth(_request);
  if (!auth || auth instanceof NextResponse) {
    return fail("No autorizado.", 401);
  }

  try {
    const conversation = await getConversationById(params.id);
    if (!conversation || conversation.userId !== auth.user.id) {
      return fail("Conversación no encontrada.", 404);
    }

    const messages = await listConversationMessages(params.id);
    return ok(
      {
        conversation: {
          ...conversation,
          lastMessageAt: conversation.lastMessageAt.toISOString(),
          createdAt: conversation.createdAt.toISOString(),
          updatedAt: conversation.updatedAt.toISOString(),
        },
        messages: messages.map((message) => ({
          ...message,
          createdAt: message.createdAt.toISOString(),
        })),
      },
      "Conversación obtenida.",
    );
  } catch (error) {
    return serverError(error);
  }
}
