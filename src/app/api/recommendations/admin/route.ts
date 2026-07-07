// Force dynamic rendering because routes use request.headers/cookies
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";

import { requireAuth } from "@/shared";
import { ok, fail, serverError } from "@/shared/apiResponse";
import { listRecommendations } from "@/modules/recommendations/application/listRecommendations";
import {
  isValidRecommendationCategory,
  isValidRecommendationPriority,
  isValidRecommendationStatus,
} from "@/modules/recommendations/domain/recommendation";

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth || auth instanceof NextResponse) {
    return fail("No autorizado.", 401);
  }

  if (auth.user.role !== "admin") {
    return fail("Sin permisos.", 403);
  }

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") ?? "";
    const category = searchParams.get("category") ?? "";
    const priority = searchParams.get("priority") ?? "";
    const userId = searchParams.get("userId") ?? "";
    const limit = Number(searchParams.get("limit") ?? "100");

    const result = await listRecommendations({
      status: isValidRecommendationStatus(status) ? status : undefined,
      category: isValidRecommendationCategory(category) ? category : undefined,
      priority: isValidRecommendationPriority(priority) ? priority : undefined,
      userId: userId || undefined,
      limit: Number.isFinite(limit) && limit > 0 ? limit : 100,
    });

    if (!result.ok) {
      return fail(result.message, 500);
    }

    return ok(
      result.recommendations.map((r) => ({
        ...r,
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
      })),
      "Recomendaciones obtenidas.",
    );
  } catch (error) {
    return serverError(error);
  }
}
