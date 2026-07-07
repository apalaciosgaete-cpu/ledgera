// Force dynamic rendering because routes use request.headers/cookies
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";

import { requireAuth } from "@/shared";
import { ok, fail, serverError } from "@/shared/apiResponse";
import { generateRecommendations } from "@/modules/recommendations/application/generateRecommendations";
import { getUserRecommendations } from "@/modules/recommendations/application/getUserRecommendations";
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

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") ?? "";
    const category = searchParams.get("category") ?? "";
    const priority = searchParams.get("priority") ?? "";

    const result = await getUserRecommendations(auth.user.id, {
      status: isValidRecommendationStatus(status) ? status : "ACTIVE",
      category: isValidRecommendationCategory(category) ? category : undefined,
      priority: isValidRecommendationPriority(priority) ? priority : undefined,
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

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth || auth instanceof NextResponse) {
    return fail("No autorizado.", 401);
  }

  try {
    const result = await generateRecommendations(auth.user.id);

    if (!result.ok) {
      return fail(result.message, 500);
    }

    return ok(result, "Recomendaciones regeneradas.");
  } catch (error) {
    return serverError(error);
  }
}
