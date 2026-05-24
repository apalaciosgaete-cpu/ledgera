import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/shared";
import { fail, ok, serverError } from "@/shared/apiResponse";
import { enforceCsrfProtection } from "@/modules/security/application/csrfProtection";
import { encryptSecret } from "@/modules/security/application/encryption";
import {
  findConnectionByUser,
  upsertConnection,
} from "@/modules/integrations/binance/infrastructure/exchangeConnectionRepository";
import { logBinanceAuditEvent } from "@/modules/integrations/binance/application/logBinanceAuditEvent";
import { validateBinanceTaxCredentials } from "@/modules/integrations/binance/infrastructure/binanceTaxClient";
import { BINANCE_TAX_PROVIDER } from "@/modules/integrations/binance/domain/binanceProviders";

type ConnectBody = {
  apiKey?:    string;
  apiSecret?: string;
};

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth || auth instanceof NextResponse) return fail("No autorizado.", 401);

  try {
    const conn = await findConnectionByUser(auth.user.id, BINANCE_TAX_PROVIDER);

    if (!conn) {
      return ok({ connected: false }, "Sin API tributaria Binance configurada.");
    }

    return ok(
      {
        connected:  true,
        status:     conn.status,
        lastSyncAt: conn.lastSyncAt,
        apiKeyHint: conn.apiKeyEncrypted.slice(-8),
      },
      "API tributaria Binance encontrada.",
    );
  } catch (error) {
    return serverError(error);
  }
}

export async function POST(request: NextRequest) {
  const csrf = enforceCsrfProtection(request);
  if (csrf) return csrf;

  const auth = await requireAuth(request);
  if (!auth || auth instanceof NextResponse) return fail("No autorizado.", 401);

  try {
    const body      = (await request.json()) as ConnectBody;
    const apiKey    = body.apiKey?.trim()    ?? "";
    const apiSecret = body.apiSecret?.trim() ?? "";

    if (!apiKey || !apiSecret) {
      return fail("API Key y Secret de Tax Report API son obligatorios.", 400);
    }

    try {
      await validateBinanceTaxCredentials(apiKey, apiSecret);
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);

      await logBinanceAuditEvent(request, "BINANCE_TAX_CONNECTED", auth.user.id, auth.user.email, {
        provider: BINANCE_TAX_PROVIDER,
        status:   "FAILED",
        error:    detail,
      });

      return fail(
        `Credenciales inválidas o sin permisos de lectura para Binance Tax Report API. Detalle: ${detail}`,
        422,
      );
    }

    const connection = await upsertConnection({
      userId:    auth.user.id,
      provider:  BINANCE_TAX_PROVIDER,
      apiKey:    encryptSecret(apiKey),
      apiSecret: encryptSecret(apiSecret),
    });

    await logBinanceAuditEvent(request, "BINANCE_TAX_CONNECTED", auth.user.id, auth.user.email, {
      provider:     BINANCE_TAX_PROVIDER,
      status:       "SUCCESS",
      connectionId: connection.id,
      apiKeyHint:   apiKey.slice(-4),
    });

    return ok(
      {
        connectionId: connection.id,
        provider:     BINANCE_TAX_PROVIDER,
        status:       connection.status,
      },
      "API tributaria Binance conectada correctamente.",
      201,
    );
  } catch (error) {
    return serverError(error);
  }
}
