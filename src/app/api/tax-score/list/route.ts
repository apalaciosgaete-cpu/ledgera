import { NextRequest, NextResponse } from "next/server";

import { getSessionFromRequest } from "@/modules/identity/application/sessionToken";
import { listSmartTaxScores } from "@/modules/tax-score/infrastructure/smartTaxScoreRepository";
import { isValidSmartTaxScoreLevel } from "@/modules/tax-score/domain/smartTaxScore";


// Force dynamic rendering because routes use request.headers/cookies
export const dynamic = 'force-dynamic';
export async function GET(request: NextRequest) {
  try {
    const auth = await getSessionFromRequest(request);

    if (!auth) {
      return NextResponse.json(
        { ok: false, message: "No autenticado.", data: null },
        { status: 401 },
      );
    }

    if (auth.user.role !== "admin") {
      return NextResponse.json(
        { ok: false, message: "Sin permisos.", data: null },
        { status: 403 },
      );
    }

    const { searchParams } = new URL(request.url);
    const level = searchParams.get("level") ?? "";
    const minScore = Number(searchParams.get("minScore") ?? NaN);
    const maxScore = Number(searchParams.get("maxScore") ?? NaN);

    const scores = await listSmartTaxScores({
      level: isValidSmartTaxScoreLevel(level) ? level : undefined,
      minScore: Number.isFinite(minScore) ? minScore : undefined,
      maxScore: Number.isFinite(maxScore) ? maxScore : undefined,
      limit: 100,
    });

    return NextResponse.json({
      ok: true,
      message: "Scores obtenidos.",
      data: scores.map((s) => ({
        id: s.id,
        userId: s.userId,
        score: s.score,
        level: s.level,
        evaluatedAt: s.evaluatedAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("[tax-score/list GET]", error);

    return NextResponse.json(
      { ok: false, message: "Error al listar Smart Tax Scores.", data: null },
      { status: 500 },
    );
  }
}
