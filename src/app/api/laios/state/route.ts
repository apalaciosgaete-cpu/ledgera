import { NextRequest, NextResponse } from "next/server";

import { requireAuth } from "@/shared";
import { fail, ok, serverError } from "@/shared/apiResponse";
import { getLatestLAIOSState, buildLAIOSState } from "@/modules/laios/application/buildLAIOSState";

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth || auth instanceof NextResponse) {
    return fail("No autorizado.", 401);
  }

  try {
    // Try to get cached state first, build fresh if not found
    let state = await getLatestLAIOSState(auth.user.id);
    if (!state) {
      state = await buildLAIOSState(auth.user.id);
    }

    return ok(
      {
        ...state,
        generatedAt: state.generatedAt.toISOString(),
      },
      "Estado LAIOS obtenido.",
    );
  } catch (error) {
    return serverError(error);
  }
}
