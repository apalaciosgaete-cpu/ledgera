import { NextRequest, NextResponse } from "next/server";

import { requireAuth } from "@/shared";
import { fail, ok, serverError } from "@/shared/apiResponse";
import { getAllTaxCases } from "@/modules/tax-cases/application/buildTaxCases";


// Force dynamic rendering because routes use request.headers/cookies
export const dynamic = 'force-dynamic';
export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth || auth instanceof NextResponse) {
    return fail("No autorizado.", 401);
  }

  try {
    const { searchParams } = new URL(request.url);
    const filters = {
      status: searchParams.get("status") ?? undefined,
      priority: searchParams.get("priority") ?? undefined,
    };

    const summary = await getAllTaxCases(auth.user.id, filters);
    return ok(
      {
        ...summary,
        items: summary.items.map((item) => ({
          ...item,
          createdAt: item.createdAt.toISOString(),
          updatedAt: item.updatedAt.toISOString(),
        })),
      },
      "Casos obtenidos.",
    );
  } catch (error) {
    return serverError(error);
  }
}
