import { NextRequest, NextResponse } from "next/server";

import { requireAuth } from "@/shared";
import { fail, ok, serverError } from "@/shared/apiResponse";
import { buildTaxCases } from "@/modules/tax-cases/application/buildTaxCases";


// Force dynamic rendering because routes use request.headers/cookies
export const dynamic = 'force-dynamic';
export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth || auth instanceof NextResponse) {
    return fail("No autorizado.", 401);
  }

  try {
    const summary = await buildTaxCases(auth.user.id);
    return ok(
      {
        ...summary,
        items: summary.items.map((item) => ({
          ...item,
          createdAt: item.createdAt.toISOString(),
          updatedAt: item.updatedAt.toISOString(),
        })),
      },
      "Casos reconstruidos.",
    );
  } catch (error) {
    return serverError(error);
  }
}
