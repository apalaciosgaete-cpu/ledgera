import { NextRequest, NextResponse } from "next/server";

import { getInvestorStaking } from "@/modules/investor/application/getInvestorStaking";
import { fail, ok, serverError } from "@/shared/apiResponse";
import { requireAuth } from "@/shared";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);

  if (!auth || auth instanceof NextResponse) {
    return fail("No autorizado.", 401);
  }

  try {
    const staking = await getInvestorStaking(auth.user);
    return ok(staking, "Staking de inversionista obtenido correctamente.");
  } catch (error) {
    return serverError(error);
  }
}
