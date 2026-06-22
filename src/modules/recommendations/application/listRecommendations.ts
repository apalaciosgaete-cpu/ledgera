import { listRecommendations as persistList } from "@/modules/recommendations/infrastructure/recommendationRepository";
import type {
  Recommendation,
  RecommendationCategory,
  RecommendationPriority,
  RecommendationStatus,
} from "@/modules/recommendations/domain/recommendation";

export type ListRecommendationsResult =
  | { ok: true; recommendations: Recommendation[] }
  | { ok: false; message: string };

export async function listRecommendations(
  filters?: {
    status?: RecommendationStatus;
    category?: RecommendationCategory;
    priority?: RecommendationPriority;
    userId?: string;
    limit?: number;
  },
): Promise<ListRecommendationsResult> {
  try {
    const recommendations = await persistList(filters);
    return { ok: true, recommendations };
  } catch (error) {
    console.error("[recommendations/listRecommendations]", error);
    return { ok: false, message: "Error al listar recomendaciones." };
  }
}
