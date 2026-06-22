import { recordAuditEvent } from "@/modules/audit/application/recordAuditEvent";
import { buildCopilotContext } from "@/modules/copilot/application/buildCopilotContext";
import type { CopilotResponse } from "@/modules/copilot/domain/copilot";
import {
  addMessage,
  createConversation,
  getConversationById,
} from "@/modules/copilot/infrastructure/copilotRepository";
import {
  buildVoiceResponse,
  resolveProfile,
} from "@/modules/copilot/domain/ledgeraVoice";

export type ProcessCopilotMessageResult =
  | { ok: true; response: CopilotResponse }
  | { ok: false; message: string };

export async function processCopilotMessage(input: {
  userId: string;
  message: string;
  conversationId?: string | null;
}): Promise<ProcessCopilotMessageResult> {
  if (!input.message.trim()) {
    return { ok: false, message: "Mensaje requerido." };
  }

  try {
    const conversation = input.conversationId
      ? await getConversationById(input.conversationId)
      : await createConversation(input.userId, createTitle(input.message));

    if (!conversation || conversation.userId !== input.userId) {
      return { ok: false, message: "Conversación no encontrada." };
    }

    const context = await buildCopilotContext(input.userId);
    await addMessage(conversation.id, "USER", input.message);

    // UX 3.0.04 — Generate response using LEDGERA voice engine
    const profile = resolveProfile(context.profileType);
    const answer = buildVoiceResponse({
      message: input.message,
      context,
      profile,
    });
    await addMessage(conversation.id, "ASSISTANT", answer, { context, profile });

    await recordAuditEvent({
      userId: input.userId,
      actorId: input.userId,
      category: "AI",
      severity: "INFO",
      event: "copilot_response_generated",
      description: "LEDGERA respondió una consulta.",
      result: "SUCCESS",
      entityType: "CopilotConversation",
      entityId: conversation.id,
      metadata: { conversationId: conversation.id, profile },
    });

    return { ok: true, response: { conversationId: conversation.id, answer, context } };
  } catch (error) {
    console.error("[copilot/processCopilotMessage]", error);
    return { ok: false, message: "No se pudo procesar el mensaje." };
  }
}

function createTitle(message: string): string {
  return message.trim().slice(0, 60) || "Nueva conversación";
}
