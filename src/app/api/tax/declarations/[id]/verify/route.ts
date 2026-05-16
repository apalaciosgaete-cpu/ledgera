import { NextRequest, NextResponse } from "next/server";

import { requireAuth } from "@/shared";
import { fail, ok, serverError } from "@/shared/apiResponse";
import { getTaxDeclarationByIdForUser } from "@/modules/tax-dj/infrastructure/declarationRepository";
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