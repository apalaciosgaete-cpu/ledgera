// src/app/api/tax/classification/route.ts
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { fail, ok, serverError } from "@/shared/apiResponse";
import { requireAuth } from "@/shared";
import { NextResponse } from "next/server";

type TaxCategory =
  | "NON_TAXABLE"
  | "CAPITAL_GAIN"
  | "ORDINARY_INCOME"
  | "UNCLASSIFIED";

type TaxClassificationSource = "USER" | "ACCOUNTANT";

type UpdateTaxClassificationBody = {
  movementId?:              string;
  appliedTaxCategory?:      TaxCategory | null;
  taxClassificationSource?: TaxClassificationSource;
};

function normalizeTaxCategory(value: unknown): TaxCategory | null {
  if (value === null) return null;
  const normalized = String(value ?? "").trim().toUpperCase();
  if (
    normalized === "NON_TAXABLE"    ||
    normalized === "CAPITAL_GAIN"   ||
    normalized === "ORDINARY_INCOME"||
    normalized === "UNCLASSIFIED"
  ) return normalized as TaxCategory;
  return null;
}

function normalizeSource(value: unknown): TaxClassificationSource | null {
  const normalized = String(value ?? "").trim().toUpperCase();
  if (normalized === "USER" || normalized === "ACCOUNTANT") return normalized as TaxClassificationSource;
  return null;
}

function resolveEffectiveCategory(params: {
  appliedTaxCategory:   TaxCategory | null;
  suggestedTaxCategory: string | null;
}) {
  return (params.appliedTaxCategory || params.suggestedTaxCategory || "UNCLASSIFIED")
    .trim()
    .toUpperCase();
}

async function isYearClosed(userId: string, date: Date) {
  const year = date.getUTCFullYear();

  const closure = await prisma.taxPeriodClose.findUnique({
    where: { userId_periodYear: { userId, periodYear: year } },
  });

  return Boolean(closure && !closure.reopenedAt);
}

export async function PATCH(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth || auth instanceof NextResponse) return fail("No autorizado.", 401);

  try {
    const body = (await request.json()) as UpdateTaxClassificationBody;

    const movementId              = String(body.movementId ?? "").trim();
    const appliedTaxCategory      = normalizeTaxCategory(body.appliedTaxCategory);
    const taxClassificationSource = normalizeSource(body.taxClassificationSource);

    if (!movementId) return fail("movementId es obligatorio.", 400);

    if (body.appliedTaxCategory !== null && !appliedTaxCategory) {
      return fail("appliedTaxCategory inválida.", 400);
    }

    if (!taxClassificationSource) {
      return fail("taxClassificationSource debe ser USER o ACCOUNTANT.", 400);
    }

    const movement = await prisma.portfolioMovement.findUnique({
      where: { id: movementId },
    });

    if (!movement || movement.deletedAt) {
      return fail("Movimiento no encontrado o anulado.", 404);
    }

    if (movement.userId !== auth.user.id) {
      return fail("Sin permisos sobre este movimiento.", 403);
    }

    const closed = await isYearClosed(auth.user.id, new Date(movement.executedAt));
    if (closed) {
      return fail("No se puede modificar la clasificación de un período tributario cerrado.", 409);
    }

    const effectiveTaxCategory = resolveEffectiveCategory({
      appliedTaxCategory,
      suggestedTaxCategory: movement.suggestedTaxCategory,
    });

    const updated = await prisma.portfolioMovement.update({
      where: { id: movementId },
      data: {
        appliedTaxCategory,
        taxClassificationSource,
        suggestedTaxCategory: effectiveTaxCategory,
      },
    });

    await prisma.taxEvent.updateMany({
      where: { movementId },
      data:  { effectiveTaxCategory },
    });

    return ok(
      {
        movementId,
        appliedTaxCategory:      updated.appliedTaxCategory,
        effectiveTaxCategory,
        taxClassificationSource: updated.taxClassificationSource,
      },
      "Clasificación tributaria actualizada correctamente."
    );
  } catch (error) {
    return serverError(error);
  }
}