import { NextRequest, NextResponse } from "next/server";

import { requireAuth } from "@/shared";
import { fail, ok, serverError } from "@/shared/apiResponse";
import { getAllTaxCasesExpert } from "@/modules/tax-cases/application/buildTaxCases";

// Force dynamic rendering because routes use request.headers/cookies
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth || auth instanceof NextResponse) {
    return fail("No autorizado.", 401);
  }

  const user = auth.user as { id: string; role?: string };
  const isAdmin = user.role === "admin";
  const isProfessional = user.role === "contador";

  if (!isAdmin && !isProfessional) {
    return fail("Acceso restringido a expertos.", 403);
  }

  try {
    const { searchParams } = new URL(request.url);
    const requestedUserId = searchParams.get("userId") ?? undefined;

    const filters = {
      status: searchParams.get("status") ?? undefined,
      priority: searchParams.get("priority") ?? undefined,
      // Until an explicit professional-client mandate exists, professionals
      // can only query their own cases. Administrators retain support scope.
      userId: isAdmin ? requestedUserId : user.id,
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
