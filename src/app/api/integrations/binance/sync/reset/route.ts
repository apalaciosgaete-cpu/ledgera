import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/shared";
import { fail, ok, serverError } from "@/shared/apiResponse";
import { enforceCsrfProtection } from "@/modules/security/application/csrfProtection";
import { findConnectionByUser, setSyncReset } from "@/modules/integrations/binance/infrastructure/exchangeConnectionRepository";
import { ensurePeriodsExist, resetAllPeriods } from "@/modules/integrations/binance/infrastructure/exchangeSyncPeriodRepository";
import { logBinanceAuditEvent } from "@/modules/integrations/binance/application/logBinanceAuditEvent";


// Force dynamic rendering because routes use request.headers/cookies
export const dynamic = 'force-dynamic';
function getStartDate(): Date {
  const raw = process.env.BINANCE_SYNC_START_DATE ?? "2018-01-01";
  const d   = new Date(raw);
  return isNaN(d.getTime()) ? new Date("2018-01-01") : d;
}

export async function POST(request: NextRequest) {
  const csrf = enforceCsrfProtection(request);
  if (csrf) return csrf;

  const auth = await requireAuth(request);
  if (!auth || auth instanceof NextResponse) return fail("No autorizado.", 401);

  try {
    const conn = await findConnectionByUser(auth.user.id, "BINANCE");
    if (!conn) return fail("No hay conexión con Binance configurada.", 404);

    await setSyncReset(conn.id);
    await ensurePeriodsExist(auth.user.id, conn.id, "BINANCE", getStartDate(), new Date());
    const periodsReset = await resetAllPeriods(auth.user.id, "BINANCE");

    await logBinanceAuditEvent(request, "BINANCE_SYNC_FAILED", auth.user.id, auth.user.email, {
      provider:     "BINANCE",
      status:       "FAILED",
      connectionId: conn.id,
      error:        `Sync reiniciado manualmente por el usuario (${periodsReset} períodos a PENDING)`,
    });

    return ok({ syncStatus: "IDLE", periodsReset }, "Sincronización reiniciada. Todos los períodos vuelven a PENDING.");
  } catch (error) {
    return serverError(error);
  }
}
