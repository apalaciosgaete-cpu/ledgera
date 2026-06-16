import { NextRequest, NextResponse } from "next/server";

import { requireAuth } from "@/shared";
import { getLatestSmartTaxScore } from "@/modules/tax-score/application/getLatestSmartTaxScore";

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth || auth instanceof NextResponse) {
    return NextResponse.json(
      { ok: false, message: "No autorizado.", data: null },
      { status: 401 },
    );
  }

  try {
    const score = await getLatestSmartTaxScore(auth.user.id);

    if (!score) {
      return NextResponse.json(
        { ok: false, message: "No se pudo obtener el Smart Tax Score.", data: null },
        { status: 404 },
      );
    }

    return NextResponse.json({
      ok: true,
      message: "Smart Tax Score obtenido.",
      data: {
        id: score.id,
        score: score.score,
        level: score.level,
        breakdown: score.breakdown,
        evaluatedAt: score.evaluatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("[tax-score GET]", error);

    return NextResponse.json(
      { ok: false, message: "Error al obtener Smart Tax Score.", data: null },
      { status: 500 },
    );
  }
}
