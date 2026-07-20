import { NextRequest, NextResponse } from "next/server";

import { requireAuth } from "@/shared";
import { fail, ok, serverError } from "@/shared/apiResponse";
import { requireFeatureAccess } from "@/modules/subscription/application/requireFeatureAccess";
import { Feature } from "@/modules/subscription/domain/planFeatures";
import { getAllTaxCasesExpert } from "@/modules/tax-cases/application/buildTaxCases";

// Force dynamic rendering because routes use request.headers/cookies
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth || auth instanceof NextResponse) {
    return fail("No autorizado.", 401);
  }

  const access = requireFeatureAccess(auth.user, Feature.EXPERT_MODE);
  if (!access.ok) return access.response;

  const isAdmin = auth.user.role === "admin";

  try {
    const { searchParams } = new URL(request.url);
    const requestedUserId = searchParams.get("userId") ?? undefined;

    const filters = {
      status: searchParams.get("status") ?? undefined,
      priority: searchParams.get("priority") ?? undefined,
      // Until an explicit professional-client mandate exists, paid experts
      // can only query their own cases. Administrators retain support scope.
      userId: isAdmin ? requestedUserId : auth.user.id,
    };

    const summary = await getAllTaxCasesExpert(filters);
    return ok(
      {
        ...summary,
        items: summary.items.map((item) => ({
          ...item,
          createdAt: item.createdAt.toISOString(),
          updatedAt: item.updatedAt.toISOString(),
        })),
      },
      "Casos obtenidos (vista experto).",
    );
  } catch (error) {
    return serverError(error);
  }
}
