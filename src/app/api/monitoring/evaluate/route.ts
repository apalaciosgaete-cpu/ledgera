import { NextRequest, NextResponse } from "next/server";

import { requireAuth } from "@/shared";
import { fail, ok, serverError } from "@/shared/apiResponse";
import { evaluateMonitoringSignals } from "@/modules/monitoring/application/evaluateMonitoringSignals";

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth || auth instanceof NextResponse) {
    return fail("No autorizado.", 401);
  }

  try {
    const summary = await evaluateMonitoringSignals(auth.user.id);
    return ok(
      {
        ...summary,
        generatedAt: summary.generatedAt.toISOString(),
        signals: summary.signals.map((signal) => ({
          ...signal,
          detectedAt: signal.detectedAt.toISOString(),
        })),
      },
      "Monitoreo actualizado.",
    );
  } catch (error) {
    return serverError(error);
  }
}
