import { NextRequest, NextResponse } from "next/server";

import { requireAuth } from "@/shared";
import { fail, ok, serverError } from "@/shared/apiResponse";
import { isValidSimulationScenarioType, type SimulationInput } from "@/modules/simulation/domain/simulation";
import { runSimulationEngine } from "@/modules/simulation/application/simulationEngine";
import { prisma } from "@/lib/prisma";


// Force dynamic rendering because routes use request.headers/cookies
export const dynamic = 'force-dynamic';
export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth || auth instanceof NextResponse) {
    return fail("No autorizado.", 401);
  }

  try {
    const body = (await request.json()) as Partial<SimulationInput>;
    const scenarioType = String(body.scenarioType ?? "");

    if (!isValidSimulationScenarioType(scenarioType)) {
      return fail("Escenario inválido.", 400);
    }

    const [risk, score] = await Promise.all([
      prisma.taxRiskScore.findFirst({ where: { userId: auth.user.id }, orderBy: { evaluatedAt: "desc" } }),
      prisma.smartTaxScore.findFirst({ where: { userId: auth.user.id }, orderBy: { evaluatedAt: "desc" } }),
    ]);

    const input: SimulationInput = {
      scenarioType,
      payload: body.payload && typeof body.payload === "object" ? body.payload : {},
    };

    const result = runSimulationEngine(input, risk?.score ?? 50, score?.score ?? 50);

    return ok({ input, result }, "Simulación ejecutada.");
  } catch (error) {
    return serverError(error);
  }
}
