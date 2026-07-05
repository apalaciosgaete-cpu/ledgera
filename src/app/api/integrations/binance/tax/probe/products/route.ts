import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/shared";
import { fail, ok, serverError } from "@/shared/apiResponse";
import { findConnectionByUser } from "@/modules/integrations/binance/infrastructure/exchangeConnectionRepository";
import { decryptSecret } from "@/modules/security/application/encryption";
import { probeAllProducts } from "@/modules/integrations/binance/infrastructure/binanceTaxClient";
import { BINANCE_TAX_PROVIDER } from "@/modules/integrations/binance/domain/binanceProviders";


// Force dynamic rendering because routes use request.headers/cookies
export const dynamic = 'force-dynamic';
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

    const products = await probeAllProducts(apiKey, apiSecret);

    const accessibleCount = products.filter(p => p.accessible).length;
    const withDataCount   = products.filter(p => p.hasData).length;

    const message = withDataCount > 0
      ? `${withDataCount} producto${withDataCount !== 1 ? "s" : ""} con datos encontrados (${accessibleCount} endpoints accesibles).`
      : accessibleCount > 0
        ? `${accessibleCount} endpoint${accessibleCount !== 1 ? "s" : ""} accesibles, sin datos en el periodo de muestra.`
        : "Ningún endpoint respondió — revisar permisos de la API Key.";

    return ok(
      {
        provider: BINANCE_TAX_PROVIDER,
        connected: true,
        products,
      },
      message,
    );
  } catch (error) {
    return serverError(error);
  }
}
