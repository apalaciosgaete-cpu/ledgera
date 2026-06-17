import { NextRequest, NextResponse } from "next/server";

import { requireAuth } from "@/shared";
import { fail, ok, serverError } from "@/shared/apiResponse";
import { getTaxCaseById } from "@/modules/tax-cases/application/buildTaxCases";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const auth = await requireAuth(request);
  if (!auth || auth instanceof NextResponse) {
    return fail("No autorizado.", 401);
  }

  try {
    const taxCase = await getTaxCaseById(params.id, auth.user.id);
    if (!taxCase) {
      return fail("Caso no encontrado.", 404);
    }

    return ok(
      {
        ...taxCase,
        createdAt: taxCase.createdAt.toISOString(),
        updatedAt: taxCase.updatedAt.toISOString(),
      },
      "Caso obtenido.",
    );
  } catch (error) {
    return serverError(error);
  }
}
