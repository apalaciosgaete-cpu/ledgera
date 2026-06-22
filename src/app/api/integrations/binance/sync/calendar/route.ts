import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/shared";
import { fail, ok, serverError } from "@/shared/apiResponse";
import { getSyncCalendar } from "@/modules/integrations/binance/infrastructure/exchangeSyncPeriodRepository";

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth || auth instanceof NextResponse) return fail("No autorizado.", 401);

  try {
    const calendar = await getSyncCalendar(auth.user.id, "BINANCE");
    return ok(calendar, "Calendario de sincronización.");
  } catch (error) {
    return serverError(error);
  }
}
