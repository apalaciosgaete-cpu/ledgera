import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/shared";
import { fail, ok, serverError } from "@/shared/apiResponse";
import { findConnectionByUser } from "@/modules/integrations/binance/infrastructure/exchangeConnectionRepository";
import { decryptSecret } from "@/modules/security/application/encryption";
import { scanBinanceTaxProductsByMonth } from "@/modules/integrations/binance/infrastructure/binanceTaxClient";
import { BINANCE_TAX_PROVIDER } from "@/modules/integrations/binance/domain/binanceProviders";


// Force dynamic rendering because routes use request.headers/cookies
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth || auth instanceof NextResponse) return fail("No autorizado.", 401);

  try {
    const { searchParams } = new URL(request.url);

    const year  = Number(searchParams.get("year"));
    const month = Number(searchParams.get("month"));

    if (!Number.isInteger(year) || year < 2017 || year > 2100) {
      return fail("year inválido.", 400);
    }
    if (!Number.isInteger(month) || month < 1 || month > 12) {
      return fail("month inválido.", 400);
    }

    const conn = await findConnectionByUser(auth.user.id, BINANCE_TAX_PROVIDER);

    if (!conn) {
      return fail("No hay conexión BINANCE_TAX configurada.", 404);
    }
    if (conn.status === "REVOKED") {
      return fail("La conexión BINANCE_TAX ha sido revocada.", 403);
    }

    const apiKey    = decryptSecret(conn.apiKeyEncrypted);
    const apiSecret = decryptSecret(conn.apiSecretEncrypted);

    const products = await scanBinanceTaxProductsByMonth(apiKey, apiSecret, year, month);

    const totalCount       = products.reduce((sum, p) => sum + p.count, 0);
    const productsWithData = products.filter(p => p.count > 0).length;

    return ok(
      {
        provider: BINANCE_TAX_PROVIDER,
        year,
        month,
        totalCount,
        productsWithData,
        products,
      },
      totalCount > 0
        ? `${totalCount} registros detectados en ${productsWithData} productos.`
        : "No se detectaron registros en el mes consultado.",
    );
  } catch (error) {
    return serverError(error);
  }
}
