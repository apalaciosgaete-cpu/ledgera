import { NextRequest, NextResponse } from "next/server";

import { requireAuth } from "@/shared";
import { fail, ok, serverError } from "@/shared/apiResponse";
import { reopenTaxCase } from "@/modules/tax-cases/application/buildTaxCases";


// Force dynamic rendering because routes use request.headers/cookies
export const dynamic = 'force-dynamic';
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const auth = await requireAuth(request);
  if (!auth || auth instanceof NextResponse) {
    return fail("No autorizado.", 401);
  }

  try {
    const taxCase = await reopenTaxCase(params.id, auth.user.id);
    if (!taxCase) {
      return fail("Caso no encontrado o no se puede reabrir.", 404);
    }

    return ok(
      {
        ...taxCase,
        createdAt: taxCase.createdAt.toISOString(),
        updatedAt: taxCase.updatedAt.toISOString(),
      },
      "Caso reabierto.",
    );
  } catch (error) {
    return serverError(error);
  }
}
