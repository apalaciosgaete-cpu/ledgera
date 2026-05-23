import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/shared";
import { fail, ok, serverError } from "@/shared/apiResponse";
import { suggestBankBinanceMatches } from "@/modules/banking/application/suggestBankBinanceMatches";

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth || auth instanceof NextResponse) return fail("No autorizado.", 401);

  try {
    const suggestions = await suggestBankBinanceMatches(auth.user.id);

    return ok(
      {
        suggestions,
        total: suggestions.length,
      },
      `${suggestions.length} sugerencias de conciliación encontradas.`,
    );
  } catch (error) {
    return serverError(error);
  }
}
