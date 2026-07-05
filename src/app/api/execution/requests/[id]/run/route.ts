import { NextRequest, NextResponse } from "next/server";

import { requireAuth } from "@/shared";
import { fail, ok, serverError } from "@/shared/apiResponse";
import { runExecution } from "@/modules/execution-engine/application/runExecution";


// Force dynamic rendering because routes use request.headers/cookies
export const dynamic = 'force-dynamic';
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAuth(request);
  if (!auth || auth instanceof NextResponse) return fail("No autorizado.", 401);

  try {
    const result = await runExecution(params.id, auth.user.id);
    if (!result.ok) return fail(result.message, 400);
    return ok(result.execution, "Ejecución procesada.");
  } catch (error) {
    return serverError(error);
  }
}
