import { NextRequest, NextResponse } from "next/server";

import { requireAuth } from "@/shared";
import { fail, ok, serverError } from "@/shared/apiResponse";
import { runOperatingCycle } from "@/modules/laios/application/runOperatingCycle";

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth || auth instanceof NextResponse) {
    return fail("No autorizado.", 401);
  }

  try {
    const result = await runOperatingCycle(auth.user.id);

    if (!result.ok) {
      return ok({ ok: false, message: result.message }, result.message, 500);
    }

    if (!result.state) {
      return ok({ ok: false, message: "No se pudo generar el estado LAIOS." }, "Error", 500);
    }

    return ok(
      {
        ok: true,
        duration: result.duration,
        state: {
          ...result.state,
          generatedAt: result.state.generatedAt.toISOString(),
        },
      },
      `Ciclo operativo completado en ${result.duration}ms. Estado: ${result.state.operatingStatus}`,
    );
  } catch (error) {
    return serverError(error);
  }
}
