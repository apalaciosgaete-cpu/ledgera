import { NextRequest, NextResponse } from "next/server";

import { requireAuth } from "@/shared";
import { calculateTaxRiskScore } from "@/modules/risk/application/calculateTaxRiskScore";


// Force dynamic rendering because routes use request.headers/cookies
export const dynamic = 'force-dynamic';
export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth || auth instanceof NextResponse) {
    return NextResponse.json(
      { ok: false, message: "No autorizado.", data: null },
      { status: 401 },
    );
  }

  try {
    const result = await calculateTaxRiskScore(auth.user.id);

    if (!result.ok) {
      return NextResponse.json(
        { ok: false, message: result.message, data: null },
        { status: 400 },
      );
    }

    return NextResponse.json({
      ok: true,
      message: "Score de riesgo tributario calculado.",
      data: {
        score: result.score,
        level: result.level,
        breakdown: result.breakdown,
      },
    });
  } catch (error) {
    console.error("[risk/evaluate POST]", error);

    return NextResponse.json(
      { ok: false, message: "Error al evaluar riesgo tributario.", data: null },
      { status: 500 },
    );
  }
}
