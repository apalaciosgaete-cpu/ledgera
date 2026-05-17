import { NextRequest, NextResponse } from "next/server";

import { requireAuth } from "@/shared";
import { fail, ok, serverError } from "@/shared/apiResponse";
import type { TaxDeclarationAuditAction } from "@/modules/tax-dj/infrastructure/declarationRepository";
import { listTaxDeclarationAuditLogs } from "@/modules/tax-dj/infrastructure/declarationRepository";

const VALID_ACTIONS: TaxDeclarationAuditAction[] = [
  "DECLARATION_CREATED",
  "DECLARATION_REVIEWED",
  "DECLARATION_CONFIRMED",
  "DECLARATION_VOIDED",
  "DECLARATION_EXPORTED",
  "DECLARATION_INTEGRITY_VERIFIED",
];

function resolveTaxYear(value: string | null): number | undefined {
  if (!value) {
    return undefined;
  }

  const year = Number(value);

  if (!Number.isInteger(year) || year < 2000 || year > 2100) {
    throw new Error("Año inválido.");
  }

  return year;
}

function resolveLimit(value: string | null): number {
  if (!value) {
    return 100;
  }

  const limit = Number(value);

  if (!Number.isInteger(limit) || limit < 1 || limit > 500) {
    throw new Error("Límite inválido.");
  }

  return limit;
}

function resolveAction(
  value: string | null,
): TaxDeclarationAuditAction | undefined {
  if (!value) {
    return undefined;
  }

  const normalized = value.trim().toUpperCase();

  if (!VALID_ACTIONS.includes(normalized as TaxDeclarationAuditAction)) {
    throw new Error("Acción inválida.");
  }

  return normalized as TaxDeclarationAuditAction;
}

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);

  if (!auth || auth instanceof NextResponse) {
    return fail("No autorizado.", 401);
  }

  try {
    const { searchParams } = new URL(req.url);

    const logs = await listTaxDeclarationAuditLogs({
      userId: auth.user.id,
      taxYear: resolveTaxYear(searchParams.get("year")),
      declarationId: searchParams.get("declarationId") ?? undefined,
      action: resolveAction(searchParams.get("action")),
      limit: resolveLimit(searchParams.get("limit")),
    });

    return ok(
      {
        logs,
      },
      "Auditoría DDJJ obtenida correctamente.",
    );
  } catch (error) {
    return serverError(error);
  }
}
