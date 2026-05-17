import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/shared";
import { fail, ok, serverError } from "@/shared/apiResponse";
import { enforceCsrfProtection } from "@/modules/security/application/csrfProtection";
import {
  buildDeclarationDraft,
  type TaxEventForDeclaration,
} from "@/modules/tax-dj/application/buildDeclarationDraft";
import type { TaxDeclarationType } from "@/modules/tax-dj/domain/declaration";
import {
  createTaxDeclarationAuditLog,
  createTaxDeclarationDraft,
  findActiveDeclarationByHash,
  listTaxDeclarationsByUser,
} from "@/modules/tax-dj/infrastructure/declarationRepository";

const VALID_DECLARATION_TYPES: TaxDeclarationType[] = [
  "DJ_CRYPTO_SUMMARY",
  "DJ_REALIZED_GAINS",
  "DJ_FOREIGN_EXCHANGE_ACTIVITY",
  "DJ_TAX_SUPPORTING_LEDGER",
];

type TaxDeclarationRecord = {
  id: string;
  taxYear: number;
  declarationType: string;
  status: string;
  source: string;
  contentHash: string;
  generatedAt: Date;
  confirmedAt: Date | null;
  voidedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

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

function serializeDeclaration(declaration: TaxDeclarationRecord) {
  return {
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
  };
}

function resolveRequestMetadata(req: NextRequest) {
  return {
    ipAddress:
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      req.headers.get("x-real-ip") ??
      null,
    userAgent: req.headers.get("user-agent") ?? null,
  };
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

    const declarations = (await listTaxDeclarationsByUser({
      userId: auth.user.id,
      taxYear,
    })) as TaxDeclarationRecord[];

    return ok(
      {
        declarations: declarations.map(serializeDeclaration),
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

    const existing = (await findActiveDeclarationByHash({
      userId: auth.user.id,
      taxYear,
      declarationType,
      contentHash: draft.contentHash,
    })) as TaxDeclarationRecord | null;

    if (existing) {
      return ok(
        {
          declaration: serializeDeclaration(existing),
          reused: true,
        },
        "Ya existe un borrador activo con el mismo contenido.",
      );
    }

    const declaration = (await createTaxDeclarationDraft(
      draft,
    )) as TaxDeclarationRecord;

    const requestMetadata = resolveRequestMetadata(req);

    await createTaxDeclarationAuditLog({
      userId: auth.user.id,
      declarationId: declaration.id,
      action: "DECLARATION_CREATED",
      actorId: auth.user.id,
      actorEmail: auth.user.email,
      taxYear: declaration.taxYear,
      declarationType: declaration.declarationType,
      statusFrom: null,
      statusTo: declaration.status,
      contentHash: declaration.contentHash,
      ipAddress: requestMetadata.ipAddress,
      userAgent: requestMetadata.userAgent,
      metadata: {
        source: declaration.source,
        generatedAt: declaration.generatedAt,
      },
    });

    return ok(
      {
        declaration: serializeDeclaration(declaration),
        reused: false,
      },
      "Borrador de declaración guardado correctamente.",
      201,
    );
  } catch (error) {
    return serverError(error);
  }
}
