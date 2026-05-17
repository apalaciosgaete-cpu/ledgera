import { NextRequest, NextResponse } from "next/server";

import { requireAuth } from "@/shared";
import { fail, ok, serverError } from "@/shared/apiResponse";
import {
  createTaxDeclarationAuditLog,
  getTaxDeclarationByIdForUser,
} from "@/modules/tax-dj/infrastructure/declarationRepository";
import { verifyDeclarationHash } from "@/modules/tax-dj/application/verifyDeclarationHash";

type TaxDeclarationVerifyRecord = {
  id: string;
  taxYear: number;
  declarationType: string;
  status: string;
  contentHash: string;
  payloadJson: string;
  generatedAt: Date;
};

function parsePayloadJson(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
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

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAuth(req);

  if (!auth || auth instanceof NextResponse) {
    return fail("No autorizado.", 401);
  }

  try {
    const { id } = await params;

    const declaration = (await getTaxDeclarationByIdForUser({
      id,
      userId: auth.user.id,
    })) as TaxDeclarationVerifyRecord | null;

    if (!declaration) {
      return fail("Declaración no encontrada.", 404);
    }

    const payloadJson = parsePayloadJson(declaration.payloadJson);

    const verification = verifyDeclarationHash({
      payloadJson,
      expectedHash: declaration.contentHash,
    });

    const requestMetadata = resolveRequestMetadata(req);

    await createTaxDeclarationAuditLog({
      userId: auth.user.id,
      declarationId: declaration.id,
      action: "DECLARATION_INTEGRITY_VERIFIED",
      actorId: auth.user.id,
      actorEmail: auth.user.email,
      taxYear: declaration.taxYear,
      declarationType: declaration.declarationType,
      statusFrom: declaration.status,
      statusTo: declaration.status,
      contentHash: declaration.contentHash,
      ipAddress: requestMetadata.ipAddress,
      userAgent: requestMetadata.userAgent,
      metadata: {
        verificationValid: verification.valid,
        computedHash: verification.computedHash,
        expectedHash: verification.expectedHash,
      },
    });

    return ok(
      {
        declaration: {
          id: declaration.id,
          taxYear: declaration.taxYear,
          declarationType: declaration.declarationType,
          status: declaration.status,
          generatedAt: declaration.generatedAt,
        },
        verification,
      },
      verification.valid
        ? "Hash verificado correctamente."
        : "La declaración presenta inconsistencias de integridad.",
    );
  } catch (error) {
    return serverError(error);
  }
}
