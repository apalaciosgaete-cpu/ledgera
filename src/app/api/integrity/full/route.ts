import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/shared";
import { fail, ok, serverError } from "@/shared/apiResponse";
import { checkIntegrityChain } from "@/modules/audit/application/checkIntegrityChain";

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth || auth instanceof NextResponse) return fail("No autorizado.", 401);

  try {
    const result = await checkIntegrityChain(auth.user.id);
    return ok(result, result.ok ? "Integridad verificada." : `${result.issues.length} problema(s) detectado(s).`);
  } catch (error) {
    return serverError(error);
  }
}
