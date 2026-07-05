import { NextRequest, NextResponse } from "next/server";

import { getSessionFromRequest } from "@/modules/identity/application/sessionToken";
import { listTaxRiskScores } from "@/modules/risk/infrastructure/taxRiskScoreRepository";
import { isValidTaxRiskLevel, type TaxRiskLevel } from "@/modules/risk/domain/risk";


// Force dynamic rendering because routes use request.headers/cookies
export const dynamic = 'force-dynamic';
export async function GET(req: NextRequest) {
  const auth = await getSessionFromRequest(req);

  if (!auth) {
    return NextResponse.json(
      { ok: false, message: "No autenticado", data: null },
      { status: 401 },
    );
  }

  if (auth.user.role !== "admin") {
    return NextResponse.json(
      { ok: false, message: "Sin permisos", data: null },
      { status: 403 },
    );
  }

  try {
    const { searchParams } = new URL(req.url);
    const level = searchParams.get("level") ?? "";

    const scores = await listTaxRiskScores({
      level: isValidTaxRiskLevel(level) ? level : undefined,
      limit: 50,
    });

    return NextResponse.json({
      ok: true,
      message: "Scores de riesgo obtenidos.",
      data: scores.map((score) => ({
        id: score.id,
        userId: score.userId,
        score: score.score,
        level: score.level,
        evaluatedAt: score.evaluatedAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("[risk/scores GET]", error);

    return NextResponse.json(
      { ok: false, message: "Error al obtener scores de riesgo.", data: null },
      { status: 500 },
    );
  }
}
