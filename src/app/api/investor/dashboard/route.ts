import { NextRequest, NextResponse } from "next/server";

import { getInvestorDashboard } from "@/modules/investor/application/getInvestorDashboard";
import { fail, ok, serverError } from "@/shared/apiResponse";
import { requireAuth } from "@/shared";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);

  if (!auth || auth instanceof NextResponse) {
    return fail("No autorizado.", 401);
  }

  try {
    const dashboard = await getInvestorDashboard(auth.user);
    return ok(dashboard, "Dashboard de inversionista obtenido correctamente.");
  } catch (error) {
    return serverError(error);
  }
}
