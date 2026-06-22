import { NextRequest, NextResponse } from "next/server";

import { requireAuth } from "@/shared";
import { calculateSmartTaxScore } from "@/modules/tax-score/application/calculateSmartTaxScore";

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth || auth instanceof NextResponse) {
    return NextResponse.json(
      { ok: false, message: "No autorizado.", data: null },
      { status: 401 },
    );
  }

  try {
    const result = await calculateSmartTaxScore(auth.user.id);

    if (!result.ok) {
      return NextResponse.json(
        { ok: false, message: result.message, data: null },
        { status: 500 },
      );
    }

    return NextResponse.json({
      ok: true,
      message: "Smart Tax Score recalculado.",
      data: {
        score: result.score,
        level: result.level,
        breakdown: result.breakdown,
        evaluatedAt: result.evaluatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("[tax-score/evaluate POST]", error);

    return NextResponse.json(
      { ok: false, message: "Error al recalcular Smart Tax Score.", data: null },
      { status: 500 },
    );
  }
}
