import { listUserRecommendations } from "@/modules/recommendations/infrastructure/recommendationRepository";
import type { Recommendation, RecommendationCategory, RecommendationPriority, RecommendationStatus } from "@/modules/recommendations/domain/recommendation";

export type GetUserRecommendationsResult =
  | { ok: true; recommendations: Recommendation[] }
  | { ok: false; message: string };

export async function getUserRecommendations(
  userId: string,
  filters?: {
    status?: RecommendationStatus;
    category?: RecommendationCategory;
    priority?: RecommendationPriority;
  },
): Promise<GetUserRecommendationsResult> {
  try {
    const recommendations = await listUserRecommendations(userId, filters);
    return { ok: true, recommendations };
  } catch (error) {
    console.error("[recommendations/getUserRecommendations]", error);
    return { ok: false, message: "Error al obtener recomendaciones." };
  }
}
