import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/shared";
import { fail, ok, serverError } from "@/shared/apiResponse";
import { listPendingImports } from "@/modules/integrations/binance/infrastructure/exchangeImportRepository";

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth || auth instanceof NextResponse) return fail("No autorizado.", 401);

  try {
    const records = await listPendingImports(auth.user.id, "BINANCE");
    return ok(records, `${records.length} registros pendientes de confirmación.`);
  } catch (error) {
    return serverError(error);
  }
}
