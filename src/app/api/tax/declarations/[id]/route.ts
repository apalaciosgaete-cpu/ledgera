import { NextRequest, NextResponse } from "next/server";

import { requireAuth } from "@/shared";
import { fail, ok, serverError } from "@/shared/apiResponse";
import { enforceCsrfProtection } from "@/modules/security/application/csrfProtection";
import type { TaxDeclarationStatus } from "@/modules/tax-dj/domain/declaration";
import {

// Force dynamic rendering because routes use request.headers/cookies
export const dynamic = 'force-dynamic';
  createTaxDeclarationAuditLog,
  getTaxDeclarationByIdForUser,
  updateTaxDeclarationStatus,
} from "@/modules/tax-dj/infrastructure/declarationRepository";

const MUTABLE_STATUSES: TaxDeclarationStatus[] = [
  "REVIEW",
  "CONFIRMED",
  "VOIDED",
];

type RouteContext = { params: { id: string } };

type TaxDeclarationRecord = {
  id: string;
  taxYear: number;
  declarationType: string;
  status: string;
  source: string;
  payloadJson: string;
  contentHash: string;
  generatedAt: Date;
  confirmedAt: Date | null;
  voidedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

function parsePayloadJson(value: string) {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function normalizeStatus(value: unknown): TaxDeclarationStatus | null {
  const status = String(value ?? "").trim().toUpperCase();

  if (!MUTABLE_STATUSES.includes(status as TaxDeclarationStatus)) {
    return null;
  }

  return status as TaxDeclarationStatus;
}

function resolveAuditAction(status: TaxDeclarationStatus) {
  switch (status) {
    case "REVIEW":
      return "DECLARATION_REVIEWED" as const;
    case "CONFIRMED":
      return "DECLARATION_CONFIRMED" as const;
    case "VOIDED":
      return "DECLARATION_VOIDED" as const;
    default:
      return null;
  }
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

function serializeDeclaration(declaration: TaxDeclarationRecord) {
  return {
    id: declaration.id,
    taxYear: declaration.taxYear,
    declarationType: declaration.declarationType,
    status: declaration.status,
    source: declaration.source,
    payloadJson: parsePayloadJson(declaration.payloadJson),
    contentHash: declaration.contentHash,
    generatedAt: declaration.generatedAt,
    confirmedAt: declaration.confirmedAt,
    voidedAt: declaration.voidedAt,
    createdAt: declaration.createdAt,
    updatedAt: declaration.updatedAt,
  };
}

export async function GET(
  req: NextRequest,
  { params }: RouteContext,
) {
  const auth = await requireAuth(req);

  if (!auth || auth instanceof NextResponse) {
    return fail("No autorizado.", 401);
  }

  try {
    const { id } = params;

    const declaration = (await getTaxDeclarationByIdForUser({
      id,
      userId: auth.user.id,
    })) as TaxDeclarationRecord | null;

    if (!declaration) {
      return fail("Declaración no encontrada.", 404);
    }

    return ok(
      {
        declaration: serializeDeclaration(declaration),
      },
      "Declaración obtenida correctamente.",
    );
  } catch (error) {
    return serverError(error);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: RouteContext,
) {
  const csrfResponse = enforceCsrfProtection(req);

  if (csrfResponse) {
    return csrfResponse;
  }

  const auth = await requireAuth(req);

  if (!auth || auth instanceof NextResponse) {
    return fail("No autorizado.", 401);
  }

  try {
    const { id } = params;
    const body = (await req.json()) as { status?: string };

    const status = normalizeStatus(body.status);

    if (!status) {
      return fail("Estado inválido.", 400);
    }

    const existing = (await getTaxDeclarationByIdForUser({
      id,
      userId: auth.user.id,
    })) as TaxDeclarationRecord | null;

    if (!existing) {
      return fail("Declaración no encontrada.", 404);
    }

    if (existing.status === "VOIDED") {
      return fail("La declaración ya fue anulada.", 409);
    }

    if (existing.status === "EXPORTED" && status !== "VOIDED") {
      return fail(
        "La declaracion exportada esta congelada. Solo se permite anulacion controlada.",
        409,
      );
    }

    if (existing.status === status) {
      return fail("La declaración ya posee ese estado.", 409);
    }

    const result = await updateTaxDeclarationStatus({
      id,
      userId: auth.user.id,
      status,
    });

    if (result.count === 0) {
      return fail("No fue posible actualizar la declaración.", 500);
    }

    const action = resolveAuditAction(status);
    const requestMetadata = resolveRequestMetadata(req);

    if (action) {
      await createTaxDeclarationAuditLog({
        userId: auth.user.id,
        declarationId: existing.id,
        action,
        actorId: auth.user.id,
        actorEmail: auth.user.email,
        taxYear: existing.taxYear,
        declarationType: existing.declarationType,
        statusFrom: existing.status,
        statusTo: status,
        contentHash: existing.contentHash,
        ipAddress: requestMetadata.ipAddress,
        userAgent: requestMetadata.userAgent,
        metadata: {
          declarationId: existing.id,
          updatedStatus: status,
        },
      });
    }

    return ok(
      {
        id,
        status,
      },
      "Declaración actualizada correctamente.",
    );
  } catch (error) {
    return serverError(error);
  }
}
