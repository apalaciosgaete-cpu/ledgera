import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/shared";
import { fail, ok, serverError } from "@/shared/apiResponse";
import { confirmBankMatch } from "@/modules/banking/application/confirmBankMatch";

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth || auth instanceof NextResponse) return fail("No autorizado.", 401);

  try {
    const body = await request.json() as {
      bankMovementId:      string;
      portfolioMovementId: string;
      confidence:          number;
      reason:              string;
    };

    if (!body.bankMovementId || !body.portfolioMovementId) {
      return fail("bankMovementId y portfolioMovementId son requeridos.", 400);
    }

    await confirmBankMatch(
      auth.user.id,
      body.bankMovementId,
      body.portfolioMovementId,
      body.confidence,
      body.reason,
    );

    return ok({}, "Conciliación confirmada.");
  } catch (error) {
    return serverError(error);
  }
}
