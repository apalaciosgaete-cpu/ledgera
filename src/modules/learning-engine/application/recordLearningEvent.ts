import { recordAuditEvent } from "@/modules/audit/application/recordAuditEvent";
import type { CreateLearningEventInput } from "@/modules/learning-engine/domain/learning";
import { createLearningEvent } from "@/modules/learning-engine/infrastructure/learningRepository";

export async function recordLearningEvent(input: CreateLearningEventInput) {
  try {
    const event = await createLearningEvent(input);

    await recordAuditEvent({
      userId: input.userId,
      actorId: input.userId,
      category: "AI",
      severity: input.outcome === "NEGATIVE" ? "WARNING" : "INFO",
      event: "learning_event_created",
      description: `Evento de aprendizaje registrado: ${input.eventType}`,
      result: "SUCCESS",
      entityType: "LearningEvent",
      entityId: event.id,
      metadata: { sourceModule: input.sourceModule, outcome: input.outcome },
    });

    return { ok: true as const, event };
  } catch (error) {
    console.error("[learning-engine/recordLearningEvent]", error);
    return { ok: false as const, message: "No se pudo registrar el evento de aprendizaje." };
  }
}
