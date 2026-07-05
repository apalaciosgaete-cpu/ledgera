import { NextRequest, NextResponse } from "next/server";

import { requireAuth } from "@/shared";
import { fail, ok, serverError } from "@/shared/apiResponse";
import { getTaxCaseByIdExpert } from "@/modules/tax-cases/application/buildTaxCases";


// Force dynamic rendering because routes use request.headers/cookies
export const dynamic = 'force-dynamic';
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const auth = await requireAuth(request);
  if (!auth || auth instanceof NextResponse) {
    return fail("No autorizado.", 401);
  }

  const user = auth.user as { role?: string };
  if (user.role !== "admin" && user.role !== "contador") {
    return fail("Acceso restringido a expertos.", 403);
  }

  try {
    // Experts can access any user's case by ID (no userId filter)
    const taxCase = await getTaxCaseByIdExpert(params.id);
    if (!taxCase) {
      return fail("Caso no encontrado.", 404);
    }

    return ok(
      {
        ...taxCase,
        createdAt: taxCase.createdAt.toISOString(),
        updatedAt: taxCase.updatedAt.toISOString(),
      },
      "Caso obtenido (vista experto).",
    );
  } catch (error) {
    return serverError(error);
  }
}
