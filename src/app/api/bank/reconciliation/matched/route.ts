import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/shared";
import { fail, ok, serverError } from "@/shared/apiResponse";
import { getMatchedMovements } from "@/modules/banking/application/getMatchedMovements";

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth || auth instanceof NextResponse) return fail("No autorizado.", 401);

  try {
    const matches = await getMatchedMovements(auth.user.id);

    return ok(
      { matches, total: matches.length },
      `${matches.length} conciliaciones encontradas.`,
    );
  } catch (error) {
    return serverError(error);
  }
}
