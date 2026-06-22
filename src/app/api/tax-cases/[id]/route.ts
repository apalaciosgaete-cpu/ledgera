import { NextRequest, NextResponse } from "next/server";

import { requireAuth } from "@/shared";
import { fail, ok, serverError } from "@/shared/apiResponse";
import {
  getTaxCaseById,
  updateTaxCaseStatus,
} from "@/modules/tax-cases/application/buildTaxCases";
import { TAX_CASE_STATUSES, type TaxCaseStatus } from "@/modules/tax-cases/domain/taxCase";

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

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const auth = await requireAuth(request);
  if (!auth || auth instanceof NextResponse) {
    return fail("No autorizado.", 401);
  }

  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body.status !== "string") {
      return fail("El campo 'status' es requerido.", 400);
    }

    const newStatus = body.status as TaxCaseStatus;
    if (!TAX_CASE_STATUSES.includes(newStatus)) {
      return fail(
        "Estado inválido. Valores permitidos: " + TAX_CASE_STATUSES.join(", "),
        400,
      );
    }

    const taxCase = await updateTaxCaseStatus(params.id, auth.user.id, newStatus);
    if (!taxCase) {
      return fail("Caso no encontrado.", 404);
    }

    return ok(
      {
        ...taxCase,
        createdAt: taxCase.createdAt.toISOString(),
        updatedAt: taxCase.updatedAt.toISOString(),
      },
      `Caso actualizado a ${newStatus}.`,
    );
  } catch (error) {
    return serverError(error);
  }
}
