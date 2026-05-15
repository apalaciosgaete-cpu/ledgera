import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

import { requireAuth } from "@/shared";
import { fail, ok, serverError } from "@/shared/apiResponse";

import {
  buildDeclarationDraft,
  type TaxEventForDeclaration,
} from "@/modules/tax-dj/application/buildDeclarationDraft";

import type { TaxDeclarationType } from "@/modules/tax-dj/domain/declaration";

const VALID_DECLARATION_TYPES: TaxDeclarationType[] = [
  "DJ_CRYPTO_SUMMARY",
  "DJ_REALIZED_GAINS",
  "DJ_FOREIGN_EXCHANGE_ACTIVITY",
  "DJ_TAX_SUPPORTING_LEDGER",
];

function resolveTaxYear(value: string | null): number {
  const year = Number(value);

  if (!Number.isInteger(year)) {
    throw new Error("Año inválido.");
  }

  if (year < 2000 || year > 2100) {
    throw new Error("Año inválido.");
  }

  return year;
}

function resolveDeclarationType(
  value: string | null,
): TaxDeclarationType {
  const declarationType = String(
    value ?? "DJ_CRYPTO_SUMMARY",
  )
    .trim()
    .toUpperCase();

  if (
    !VALID_DECLARATION_TYPES.includes(
      declarationType as TaxDeclarationType,
    )
  ) {
    throw new Error(
      "Tipo de declaración inválido.",
    );
  }

  return declarationType as TaxDeclarationType;
}

export async function GET(
  req: NextRequest,
) {
  const auth = await requireAuth(req);

  if (
    !auth ||
    auth instanceof NextResponse
  ) {
    return fail(
      "No autorizado.",
      401,
    );
  }

  try {
    const { searchParams } =
      new URL(req.url);

    let taxYear: number;
    let declarationType: TaxDeclarationType;

    try {
      taxYear = resolveTaxYear(
        searchParams.get("year"),
      );

      declarationType =
        resolveDeclarationType(
          searchParams.get("type"),
        );
    } catch (error) {
      return fail(
        error instanceof Error
          ? error.message
          : "Parámetros inválidos.",
        400,
      );
    }

    const events =
      (await prisma.taxEvent.findMany({
        where: {
          userId: auth.user.id,
          executedAt: {
            gte: new Date(
              `${taxYear}-01-01T00:00:00.000Z`,
            ),

            lt: new Date(
              `${
                taxYear + 1
              }-01-01T00:00:00.000Z`,
            ),
          },
        },

        orderBy: [
          {
            executedAt: "asc",
          },

          {
            id: "asc",
          },
        ],

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
      })) as TaxEventForDeclaration[];

    const declaration =
      buildDeclarationDraft({
        userId: auth.user.id,
        taxYear,
        declarationType,
        events,
      });

    return ok(
      {
        declaration,

        meta: {
          officialSiiForm: false,

          purpose:
            "Borrador interno auditable de declaración tributaria.",
        },
      },

      "Borrador de declaración generado correctamente.",
    );
  } catch (error) {
    return serverError(error);
  }
}