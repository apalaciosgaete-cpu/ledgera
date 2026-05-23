import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/shared";
import { fail, ok, serverError } from "@/shared/apiResponse";
import { matchBinanceMovements } from "@/modules/banking/application/matchBinanceMovements";

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth || auth instanceof NextResponse) return fail("No autorizado.", 401);

  try {
    const body          = await request.json().catch(() => ({})) as { onlyUnmatched?: boolean };
    const onlyUnmatched = body.onlyUnmatched !== false; // default true

    const suggestions = await matchBinanceMovements(auth.user.id, onlyUnmatched);

    return ok(
      { suggestions },
      suggestions.length > 0
        ? `${suggestions.length} sugerencias de conciliación encontradas.`
        : "No se encontraron coincidencias para los egresos bancarios.",
    );
  } catch (error) {
    return serverError(error);
  }
}
