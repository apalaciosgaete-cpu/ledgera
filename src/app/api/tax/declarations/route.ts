import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/shared";
import { fail, ok, serverError } from "@/shared/apiResponse";
import {
  buildDeclarationDraft,
  type TaxEventForDeclaration,
} from "@/modules/tax-dj/application/buildDeclarationDraft";
import type { TaxDeclarationType } from "@/modules/tax-dj/domain/declaration";
import {
  createTaxDeclarationDraft,
  listTaxDeclarationsByUser,
} from "@/modules/tax-dj/infrastructure/declarationRepository";
import { enforceCsrfProtection } from "@/modules/security/application/csrfProtection";

const VALID_DECLARATION_TYPES: TaxDeclarationType[] = [
  "DJ_CRYPTO_SUMMARY",
  "DJ_REALIZED_GAINS",
  "DJ_FOREIGN_EXCHANGE_ACTIVITY",
  "DJ_TAX_SUPPORTING_LEDGER",
];

function resolveTaxYear(value: string | null): number {
  const year = Number(value);

  if (!Number.isInteger(year) || year < 2000 || year > 2100) {
    throw new Error("Año inválido.");
  }

  return year;
}

function resolveDeclarationType(value: string | null): TaxDeclarationType {
  const declarationType = String(value ?? "DJ_CRYPTO_SUMMARY")
    .trim()
    .toUpperCase();

  if (!VALID_DECLARATION_TYPES.includes(declarationType as TaxDeclarationType)) {
    throw new Error("Tipo de declaración inválido.");
  }

  return declarationType as TaxDeclarationType;
}

async function fetchTaxEventsForDeclaration(input: {
  userId: string;
  taxYear: number;
}) {
  return prisma.taxEvent.findMany({
    where: {
      userId: input.userId,
      executedAt: {
        gte: new Date(`${input.taxYear}-01-01T00:00:00.000Z`),
        lt: new Date(`${input.taxYear + 1}-01-01T00:00:00.000Z`),
      },
    },
    orderBy: [{ executedAt: "asc" }, { id: "asc" }],
    select: {
      id: true,
      movementId: true,
      eventType: true,
      symbol: true,
      executedAt: true,
      quantity: true,
      effectiveTaxCategory: true,
      proceedsNetUsd: true,
      proceedsNetClp: true,
      costBasisUsd: true,
      costBasisClp: true,
      feeUsd: true,
      feeClp: true,
      realizedPnlUsd: true,
      realizedPnlClp: true,
      usdClp: true,
    },
  }) as Promise<TaxEventForDeclaration[]>;
}

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);

  if (!auth || auth instanceof NextResponse) {
    return fail("No autorizado.", 401);
  }

  try {
    const { searchParams } = new URL(req.url);
    const yearParam = searchParams.get("year");

    const taxYear = yearParam ? resolveTaxYear(yearParam) : undefined;

    const declarations = await listTaxDeclarationsByUser({
      userId: auth.user.id,
      taxYear,
    });

    return ok(
      {
        declarations: declarations.map((declaration) => ({
          id: declaration.id,
          taxYear: declaration.taxYear,
          declarationType: declaration.declarationType,
          status: declaration.status,
          source: declaration.source,
          contentHash: declaration.contentHash,
          generatedAt: declaration.generatedAt,
          confirmedAt: declaration.confirmedAt,
          voidedAt: declaration.voidedAt,
          createdAt: declaration.createdAt,
          updatedAt: declaration.updatedAt,
        })),
      },
      "Declaraciones obtenidas correctamente.",
    );
  } catch (error) {
    return serverError(error);
  }
}

export async function POST(req: NextRequest) {
  const csrfResponse = enforceCsrfProtection(req);

  if (csrfResponse) {
    return csrfResponse;
  }

  const auth = await requireAuth(req);

  if (!auth || auth instanceof NextResponse) {
    return fail("No autorizado.", 401);
  }

  try {
    const body = (await req.json()) as {
      year?: number | string;
      type?: string;
    };

    const taxYear = resolveTaxYear(String(body.year ?? ""));
    const declarationType = resolveDeclarationType(body.type ?? null);

    const events = await fetchTaxEventsForDeclaration({
      userId: auth.user.id,
      taxYear,
    });

    const draft = buildDeclarationDraft({
      userId: auth.user.id,
      taxYear,
      declarationType,
      events,
    });

    const declaration = await createTaxDeclarationDraft(draft);

    return ok(
      {
        declaration: {
          id: declaration.id,
          taxYear: declaration.taxYear,
          declarationType: declaration.declarationType,
          status: declaration.status,
          source: declaration.source,
          contentHash: declaration.contentHash,
          generatedAt: declaration.generatedAt,
          confirmedAt: declaration.confirmedAt,
          createdAt: declaration.createdAt,
          updatedAt: declaration.updatedAt,
        },
      },
      "Borrador de declaración guardado correctamente.",
      201,
    );
  } catch (error) {
    return serverError(error);
  }
}