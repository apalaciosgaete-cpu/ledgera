import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/shared";
import { fail, ok, serverError } from "@/shared/apiResponse";
import { enforceCsrfProtection } from "@/modules/security/application/csrfProtection";
import { findConnectionByUser, setSyncReset } from "@/modules/integrations/binance/infrastructure/exchangeConnectionRepository";
import { logBinanceAuditEvent } from "@/modules/integrations/binance/application/logBinanceAuditEvent";

export async function POST(request: NextRequest) {
  const csrf = enforceCsrfProtection(request);
  if (csrf) return csrf;

  const auth = await requireAuth(request);
  if (!auth || auth instanceof NextResponse) return fail("No autorizado.", 401);

  try {
    const conn = await findConnectionByUser(auth.user.id, "BINANCE");
    if (!conn) return fail("No hay conexión con Binance configurada.", 404);

    await setSyncReset(conn.id);

    await logBinanceAuditEvent(request, "BINANCE_SYNC_FAILED", auth.user.id, auth.user.email, {
      provider:     "BINANCE",
      status:       "FAILED",
      connectionId: conn.id,
      error:        "Sync reiniciado manualmente por el usuario",
    });

    return ok({ syncStatus: "IDLE" }, "Sincronización reiniciada. Ya puedes volver a sincronizar.");
  } catch (error) {
    return serverError(error);
  }
}
