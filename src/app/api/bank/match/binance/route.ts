import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/shared";
import { fail, ok, serverError } from "@/shared/apiResponse";
import { suggestBankBinanceMatches } from "@/modules/banking/application/suggestBankBinanceMatches";

export const maxDuration = 60;

type FilterBody = {
  minConfidence?: number;
  source?:        string;
  type?:          string;
};

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth || auth instanceof NextResponse) return fail("No autorizado.", 401);

  try {
    let body: FilterBody = {};
    try { body = (await request.json()) as FilterBody; } catch { /* body vacío */ }

    const minConfidence = body.minConfidence !== undefined
      ? Number(body.minConfidence)
      : undefined;

    if (minConfidence !== undefined && (!Number.isFinite(minConfidence) || minConfidence < 0 || minConfidence > 1)) {
      return fail("minConfidence debe estar entre 0 y 1.", 400);
    }

    const suggestions = await suggestBankBinanceMatches(auth.user.id, {
      minConfidence,
      source: body.source?.trim() || undefined,
      type:   body.type?.trim()   || undefined,
    });

    return ok(
      { suggestions, total: suggestions.length },
      `${suggestions.length} sugerencias de conciliación encontradas.`,
    );
  } catch (error) {
    return serverError(error);
  }
}
