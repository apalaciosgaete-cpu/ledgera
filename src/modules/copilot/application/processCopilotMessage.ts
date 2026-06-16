import { recordAuditEvent } from "@/modules/audit/application/recordAuditEvent";
import { buildCopilotContext } from "@/modules/copilot/application/buildCopilotContext";
import type { CopilotResponse } from "@/modules/copilot/domain/copilot";
import {
  addMessage,
  createConversation,
  getConversationById,
} from "@/modules/copilot/infrastructure/copilotRepository";

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

    const answer = buildRuleBasedAnswer(input.message, context);
    await addMessage(conversation.id, "ASSISTANT", answer, { context });

    await recordAuditEvent({
      userId: input.userId,
      actorId: input.userId,
      category: "AI",
      severity: "INFO",
      event: "copilot_response_generated",
      description: "Copiloto tributario respondió una consulta.",
      result: "SUCCESS",
      entityType: "CopilotConversation",
      entityId: conversation.id,
      metadata: { conversationId: conversation.id },
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

function buildRuleBasedAnswer(message: string, context: CopilotResponse["context"]): string {
  const normalized = message.toLowerCase();

  if (normalized.includes("urgente") || normalized.includes("hoy")) {
    if (context.criticalAlerts > 0 || context.rejectedDocuments > 0) {
      return `Lo más urgente hoy es revisar ${context.criticalAlerts} alerta(s) crítica(s) y ${context.rejectedDocuments} documento(s) rechazado(s).`;
    }
    if (context.pendingTasks > 0) {
      return `Hoy te conviene avanzar con tus ${context.pendingTasks} tarea(s) pendiente(s).`;
    }
    return "No veo urgencias críticas. Te conviene mantener al día tus tareas y documentos.";
  }

  if (normalized.includes("score") || normalized.includes("mejorar")) {
    return `Para mejorar tu score, enfócate en cerrar tareas pendientes (${context.pendingTasks}), resolver alertas abiertas (${context.openAlerts}) y revisar recomendaciones activas (${context.activeRecommendations}).`;
  }

  if (normalized.includes("riesgo")) {
    return context.riskLevel
      ? `Tu riesgo actual es ${context.riskLevel} con score ${context.riskScore ?? "sin dato"}. Las principales señales son alertas abiertas, tareas pendientes y documentos rechazados.`
      : "Aún no tengo un riesgo calculado. Ejecuta una actualización inteligente para evaluarlo.";
  }

  if (normalized.includes("memoria") || normalized.includes("perfil")) {
    return `Tu perfil adaptativo actual es ${context.adaptiveProfileType ?? "sin clasificar"}. LEDGERA reconoce ${context.memoryPatterns} patrón(es) en tu memoria tributaria.`;
  }

  return `Veo ${context.openAlerts} alerta(s), ${context.pendingTasks} tarea(s), ${context.activeRecommendations} recomendación(es) y riesgo ${context.riskLevel ?? "sin calcular"}. Te sugiero partir por lo pendiente más crítico.`;
}
