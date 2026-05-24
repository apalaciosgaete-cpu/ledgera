import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/shared";
import { fail, ok, serverError } from "@/shared/apiResponse";
import { findConnectionByUser } from "@/modules/integrations/binance/infrastructure/exchangeConnectionRepository";
import { decryptSecret } from "@/modules/security/application/encryption";
import { probeBinanceTaxApi } from "@/modules/integrations/binance/infrastructure/binanceTaxClient";
import { BINANCE_TAX_PROVIDER } from "@/modules/integrations/binance/domain/binanceProviders";

export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth || auth instanceof NextResponse) return fail("No autorizado.", 401);

  try {
    const conn = await findConnectionByUser(auth.user.id, BINANCE_TAX_PROVIDER);

    if (!conn) {
      return fail("No hay conexión BINANCE_TAX configurada.", 404);
    }
    if (conn.status === "REVOKED") {
      return fail("La conexión BINANCE_TAX ha sido revocada.", 403);
    }

    const apiKey    = decryptSecret(conn.apiKeyEncrypted);
    const apiSecret = decryptSecret(conn.apiSecretEncrypted);

    const probes = await probeBinanceTaxApi(apiKey, apiSecret);

    const successCount = probes.filter(p => p.ok).length;
    const message = successCount > 0
      ? `${successCount} endpoint${successCount !== 1 ? "s" : ""} respondieron correctamente.`
      : "Ningún endpoint respondió con éxito — revisar errores para identificar rutas válidas.";

    return ok(
      {
        provider:  BINANCE_TAX_PROVIDER,
        connected: true,
        probes,
      },
      message,
    );
  } catch (error) {
    return serverError(error);
  }
}
