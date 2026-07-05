import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { fail, ok, serverError } from "@/shared/apiResponse";


// Force dynamic rendering because routes use request.headers/cookies
export const dynamic = 'force-dynamic';
type Params = {
  params: Promise<{
    code: string;
  }>;
};

export async function GET(_request: NextRequest, context: Params) {
  try {
    const { code } = await context.params;
    const validationCode = code.trim().toUpperCase();

    if (!validationCode) {
      return fail("Código de verificación requerido.", 400);
    }

    const validation = await prisma.bankReconciliationReportValidation.findUnique({
      where: {
        validationCode,
      },
    });

    if (!validation) {
      return fail("Documento no encontrado o código inválido.", 404);
    }

    return ok(
      {
        valid: true,
        reportType:     validation.reportType,
        validationCode: validation.validationCode,
        contentHash:    validation.contentHash,
        createdAt:      validation.createdAt.toISOString(),
        metadata:       validation.metadata ? JSON.parse(validation.metadata) : null,
      },
      "Documento verificado correctamente.",
    );
  } catch (error) {
    return serverError(error);
  }
}
