import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/shared";
import { fail, ok, serverError } from "@/shared/apiResponse";
import { enforceCsrfProtection } from "@/modules/security/application/csrfProtection";
import { findConnectionByUser } from "@/modules/integrations/binance/infrastructure/exchangeConnectionRepository";
import { decryptSecret } from "@/modules/security/application/encryption";
import { validateBinanceTaxCredentials } from "@/modules/integrations/binance/infrastructure/binanceTaxClient";
import { logBinanceAuditEvent } from "@/modules/integrations/binance/application/logBinanceAuditEvent";
import { BINANCE_TAX_PROVIDER } from "@/modules/integrations/binance/domain/binanceProviders";


// Force dynamic rendering because routes use request.headers/cookies
export const dynamic = 'force-dynamic';
export async function POST(request: NextRequest) {
  const csrf = enforceCsrfProtection(request);
  if (csrf) return csrf;

  const auth = await requireAuth(request);
  if (!auth || auth instanceof NextResponse) return fail("No autorizado.", 401);

  try {
    const conn = await findConnectionByUser(auth.user.id, BINANCE_TAX_PROVIDER);
    if (!conn) return fail("No hay conexión Tax API configurada.", 404);

    const apiKey    = decryptSecret(conn.apiKeyEncrypted);
    const apiSecret = decryptSecret(conn.apiSecretEncrypted);

    try {
      await validateBinanceTaxCredentials(apiKey, apiSecret);
    } catch (e) {
      await logBinanceAuditEvent(request, "BINANCE_TAX_CONNECTION_TESTED", auth.user.id, auth.user.email, {
        provider:     BINANCE_TAX_PROVIDER,
        status:       "FAILED",
        connectionId: conn.id,
        error:        e instanceof Error ? e.message : "Error desconocido",
      });
      throw e;
    }

    await logBinanceAuditEvent(request, "BINANCE_TAX_CONNECTION_TESTED", auth.user.id, auth.user.email, {
      provider:     BINANCE_TAX_PROVIDER,
      status:       "SUCCESS",
      connectionId: conn.id,
    });

    return ok({ validated: true }, "Conexión con Tax API verificada correctamente.");
  } catch (error) {
    return serverError(error);
  }
}
