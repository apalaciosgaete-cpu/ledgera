import { NextRequest, NextResponse } from "next/server";

import { requireAuth } from "@/shared";
import { getLatestTaxRiskScore } from "@/modules/risk/application/getLatestTaxRiskScore";


// Force dynamic rendering because routes use request.headers/cookies
export const dynamic = 'force-dynamic';
export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth || auth instanceof NextResponse) {
    return NextResponse.json(
      { ok: false, message: "No autorizado.", data: null },
      { status: 401 },
    );
  }

  try {
    const score = await getLatestTaxRiskScore(auth.user.id);

    if (!score) {
      return NextResponse.json(
        { ok: false, message: "No se pudo calcular el riesgo tributario.", data: null },
        { status: 400 },
      );
    }

    return NextResponse.json({
      ok: true,
      message: "Score de riesgo tributario obtenido.",
      data: {
        score: score.score,
        level: score.level,
        breakdown: score.breakdown,
        evaluatedAt: score.evaluatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("[risk/score GET]", error);

    return NextResponse.json(
      { ok: false, message: "Error al obtener score de riesgo.", data: null },
      { status: 500 },
    );
  }
}
