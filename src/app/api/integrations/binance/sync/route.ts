import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/shared";
import { fail, ok, serverError } from "@/shared/apiResponse";
import { enforceCsrfProtection } from "@/modules/security/application/csrfProtection";
import { findConnectionByUser } from "@/modules/integrations/binance/infrastructure/exchangeConnectionRepository";
import { decryptSecret } from "@/modules/integrations/binance/application/encryptCredentials";
import { syncBinance } from "@/modules/integrations/binance/application/syncBinance";

export async function POST(request: NextRequest) {
  const csrf = enforceCsrfProtection(request);
  if (csrf) return csrf;

  const auth = await requireAuth(request);
  if (!auth || auth instanceof NextResponse) return fail("No autorizado.", 401);

  try {
    const conn = await findConnectionByUser(auth.user.id, "BINANCE");
    if (!conn) return fail("No hay conexión con Binance configurada.", 404);
    if (conn.status === "REVOKED") return fail("La conexión ha sido revocada.", 403);

    const apiKey    = decryptSecret(conn.apiKey);
    const apiSecret = decryptSecret(conn.apiSecret);

    const result = await syncBinance(
      auth.user.id,
      conn.id,
      apiKey,
      apiSecret,
      conn.syncCheckpoint,
    );

    const message = result.errors.length === 0
      ? `Sincronización completada: ${result.imported} nuevos, ${result.skipped} ya existentes.`
      : `Sincronización parcial: ${result.imported} nuevos, ${result.errors.length} errores.`;

    return ok(result, message);
  } catch (error) {
    return serverError(error);
  }
}
