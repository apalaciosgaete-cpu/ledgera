import {
  completeRecommendation as persistComplete,
  getRecommendationById,
} from "@/modules/recommendations/infrastructure/recommendationRepository";
import { recordAuditEvent } from "@/modules/audit/application/recordAuditEvent";
import { recordTimelineEvent } from "@/modules/timeline/application/recordTimelineEvent";

export type CompleteRecommendationResult =
  | { ok: true }
  | { ok: false; message: string };

export async function completeRecommendation(
  id: string,
  userId: string,
): Promise<CompleteRecommendationResult> {
  try {
    const existing = await getRecommendationById(id);

    if (!existing) {
      return { ok: false, message: "Recomendación no encontrada." };
    }

    if (existing.userId !== userId) {
      return { ok: false, message: "No autorizado." };
    }

    const completed = await persistComplete(id);

    if (!completed) {
      return { ok: false, message: "La recomendación ya no está activa." };
    }

    await recordAuditEvent({
      userId,
      actorId: userId,
      category: "COMPLIANCE",
      severity: "INFO",
      event: "recommendation_completed",
      description: `Recomendación completada: ${existing.title}`,
      result: "SUCCESS",
      entityType: "Recommendation",
      entityId: id,
      metadata: {
        category: existing.category,
        priority: existing.priority,
      },
    });

    await recordTimelineEvent({
      userId,
      category: "RECOMMENDATION",
      severity: "SUCCESS",
      title: "Recomendación completada",
      description: existing.title,
      entityType: "Recommendation",
      entityId: id,
      metadata: {
        category: existing.category,
        priority: existing.priority,
      },
    });

    return { ok: true };
  } catch (error) {
    console.error("[recommendations/completeRecommendation]", error);
    return { ok: false, message: "Error al completar la recomendación." };
  }
}
