import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/shared";
import { fail, ok, serverError } from "@/shared/apiResponse";
import { rejectBankMatch } from "@/modules/banking/application/rejectBankMatch";

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth || auth instanceof NextResponse) return fail("No autorizado.", 401);

  try {
    const body = await request.json() as { bankMovementId: string };

    if (!body.bankMovementId) {
      return fail("bankMovementId es requerido.", 400);
    }

    await rejectBankMatch(auth.user.id, body.bankMovementId);

    return ok({}, "Movimiento marcado como ignorado.");
  } catch (error) {
    return serverError(error);
  }
}
