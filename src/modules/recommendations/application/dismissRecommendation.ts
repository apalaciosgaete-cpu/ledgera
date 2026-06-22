import { dismissRecommendation as persistDismiss } from "@/modules/recommendations/infrastructure/recommendationRepository";
import { getRecommendationById } from "@/modules/recommendations/infrastructure/recommendationRepository";
import { recordAuditEvent } from "@/modules/audit/application/recordAuditEvent";

export type DismissRecommendationResult =
  | { ok: true }
  | { ok: false; message: string };

export async function dismissRecommendation(
  id: string,
  userId: string,
): Promise<DismissRecommendationResult> {
  try {
    const existing = await getRecommendationById(id);

    if (!existing) {
      return { ok: false, message: "Recomendación no encontrada." };
    }

    if (existing.userId !== userId) {
      return { ok: false, message: "No autorizado." };
    }

    const dismissed = await persistDismiss(id);

    if (!dismissed) {
      return { ok: false, message: "La recomendación ya no está activa." };
    }

    await recordAuditEvent({
      userId,
      actorId: userId,
      category: "COMPLIANCE",
      severity: "INFO",
      event: "recommendation_dismissed",
      description: `Recomendación descartada: ${existing.title}`,
      result: "SUCCESS",
      entityType: "Recommendation",
      entityId: id,
      metadata: {
        category: existing.category,
        priority: existing.priority,
      },
    });

    return { ok: true };
  } catch (error) {
    console.error("[recommendations/dismissRecommendation]", error);
    return { ok: false, message: "Error al descartar la recomendación." };
  }
}
