import { NextRequest } from "next/server";
import { fail, ok, serverError } from "@/shared/apiResponse";
import { verifyStagingDecision } from "@/modules/staging/application/verifyStagingDecision";
import { StagingError } from "@/modules/staging/domain/StagingError";


// Force dynamic rendering because routes use request.headers/cookies
export const dynamic = 'force-dynamic';
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ validationCode: string }> },
) {
  try {
    const { validationCode } = await params;
    if (!validationCode?.trim()) return fail("Código de validación inválido.", 400);

    const result = await verifyStagingDecision(validationCode.trim());
    return ok(result, "Decisión verificada.");
  } catch (error) {
    if (error instanceof StagingError && error.code === "NOT_FOUND") {
      return fail("Código de validación no encontrado.", 404);
    }
    return serverError(error);
  }
}
