import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/shared";
import { fail, ok, serverError } from "@/shared/apiResponse";
import { enforceCsrfProtection } from "@/modules/security/application/csrfProtection";
import { findConnectionByUser } from "@/modules/integrations/binance/infrastructure/exchangeConnectionRepository";
import { decryptSecret } from "@/modules/integrations/binance/application/encryptCredentials";
import { syncBinance } from "@/modules/integrations/binance/application/syncBinance";
import { logBinanceAuditEvent } from "@/modules/integrations/binance/application/logBinanceAuditEvent";

export async function POST(request: NextRequest) {
  const csrf = enforceCsrfProtection(request);
  if (csrf) return csrf;

  const auth = await requireAuth(request);
  if (!auth || auth instanceof NextResponse) return fail("No autorizado.", 401);

  try {
    const conn = await findConnectionByUser(auth.user.id, "BINANCE");
    if (!conn) return fail("No hay conexión con Binance configurada.", 404);
    if (conn.status === "REVOKED") return fail("La conexión ha sido revocada.", 403);

    await logBinanceAuditEvent(request, "BINANCE_SYNC_STARTED", auth.user.id, auth.user.email, {
      provider:     "BINANCE",
      status:       "SUCCESS",
      connectionId: conn.id,
    });

    const apiKey    = decryptSecret(conn.apiKey);
    const apiSecret = decryptSecret(conn.apiSecret);

    let result;
    try {
      result = await syncBinance(
        auth.user.id,
        conn.id,
        apiKey,
        apiSecret,
        conn.syncCheckpoint,
      );
    } catch (e) {
      await logBinanceAuditEvent(request, "BINANCE_SYNC_FAILED", auth.user.id, auth.user.email, {
        provider:     "BINANCE",
        status:       "FAILED",
        connectionId: conn.id,
        error:        e instanceof Error ? e.message : "Error desconocido",
      });
      throw e;
    }

    const hasFailed = result.errors.length > 0;

    await logBinanceAuditEvent(
      request,
      hasFailed ? "BINANCE_SYNC_FAILED" : "BINANCE_SYNC_COMPLETED",
      auth.user.id,
      auth.user.email,
      {
        provider:     "BINANCE",
        status:       hasFailed ? "FAILED" : "SUCCESS",
        connectionId: conn.id,
        stats: {
          imported: result.imported,
          skipped:  result.skipped,
          errors:   result.errors.length,
        },
        ...(hasFailed ? { error: result.errors.slice(0, 3).join(" | ") } : {}),
      },
    );

    const message = hasFailed
      ? `Sincronización parcial: ${result.imported} nuevos, ${result.errors.length} errores.`
      : `Sincronización completada: ${result.imported} nuevos, ${result.skipped} ya existentes.`;

    return ok(result, message);
  } catch (error) {
    return serverError(error);
  }
}
