import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/shared";
import { fail, ok, serverError } from "@/shared/apiResponse";
import { enforceCsrfProtection } from "@/modules/security/application/csrfProtection";
import { fetchAccountInfo } from "@/modules/integrations/binance/infrastructure/binanceClient";
import { encryptSecret } from "@/modules/integrations/binance/application/encryptCredentials";
import {
  findConnectionByUser,
  upsertConnection,
} from "@/modules/integrations/binance/infrastructure/exchangeConnectionRepository";
import { countPendingImports } from "@/modules/integrations/binance/infrastructure/exchangeImportRepository";
import { logBinanceAuditEvent } from "@/modules/integrations/binance/application/logBinanceAuditEvent";

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth || auth instanceof NextResponse) return fail("No autorizado.", 401);

  try {
    const conn = await findConnectionByUser(auth.user.id, "BINANCE");
    if (!conn) {
      return ok({ connected: false }, "Sin conexión configurada.");
    }

    const pending = await countPendingImports(auth.user.id);

    return ok({
      connected:      true,
      status:         conn.status,
      syncStatus:     conn.syncStatus,
      lastSyncAt:     conn.lastSyncAt,
      lastSyncStatus: conn.lastSyncStatus,
      lastSyncError:  conn.lastSyncError,
      pendingCount:   pending,
      apiKeyHint:     conn.apiKey.slice(-8),
    }, "Conexión encontrada.");
  } catch (error) {
    return serverError(error);
  }
}

type ConnectBody = { apiKey?: string; apiSecret?: string };

export async function POST(request: NextRequest) {
  const csrf = enforceCsrfProtection(request);
  if (csrf) return csrf;

  const auth = await requireAuth(request);
  if (!auth || auth instanceof NextResponse) return fail("No autorizado.", 401);

  try {
    const body = (await request.json()) as ConnectBody;
    const apiKey    = body.apiKey?.trim()    ?? "";
    const apiSecret = body.apiSecret?.trim() ?? "";

    if (!apiKey || !apiSecret) return fail("API Key y Secret son obligatorios.", 400);

    // Valida que ENCRYPTION_KEY esté configurada antes de llamar a Binance
    const encKey = process.env.ENCRYPTION_KEY;
    if (!encKey || encKey.length !== 64) {
      console.error("[binance/connect] ENCRYPTION_KEY ausente o inválida en entorno.");
      return fail("Error de configuración del servidor: ENCRYPTION_KEY no está configurada correctamente.", 500);
    }

    // Valida credenciales contra Binance antes de guardar
    try {
      await fetchAccountInfo(apiKey, apiSecret);
    } catch (binanceError) {
      const detail = binanceError instanceof Error ? binanceError.message : String(binanceError);
      console.error("[binance/connect] fetchAccountInfo failed:", detail);
      await logBinanceAuditEvent(request, "BINANCE_CONNECTED", auth.user.id, auth.user.email, {
        provider: "BINANCE",
        status:   "FAILED",
        error:    detail,
      });
      return fail(`Credenciales inválidas o sin permisos de lectura en Binance. Detalle: ${detail}`, 422);
    }

    const encryptedKey    = encryptSecret(apiKey);
    const encryptedSecret = encryptSecret(apiSecret);

    const connection = await upsertConnection({
      userId:    auth.user.id,
      provider:  "BINANCE",
      apiKey:    encryptedKey,
      apiSecret: encryptedSecret,
    });

    await logBinanceAuditEvent(request, "BINANCE_CONNECTED", auth.user.id, auth.user.email, {
      provider:     "BINANCE",
      status:       "SUCCESS",
      connectionId: connection.id,
      apiKeyHint:   apiKey.slice(-4),
    });

    return ok(
      { connectionId: connection.id, provider: "BINANCE", status: connection.status },
      "Conexión con Binance establecida correctamente.",
      201,
    );
  } catch (error) {
    return serverError(error);
  }
}
