import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/shared";
import { fail, ok, serverError } from "@/shared/apiResponse";
import { enforceCsrfProtection } from "@/modules/security/application/csrfProtection";
import { findConnectionByUser } from "@/modules/integrations/binance/infrastructure/exchangeConnectionRepository";
import { decryptSecret } from "@/modules/security/application/encryption";
import { importBinanceTaxTransfers } from "@/modules/integrations/binance/application/importBinanceTaxTransfers";
import { BINANCE_TAX_PROVIDER } from "@/modules/integrations/binance/domain/binanceProviders";


// Force dynamic rendering because routes use request.headers/cookies
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const csrf = enforceCsrfProtection(request);
  if (csrf) return csrf;

  const auth = await requireAuth(request);
  if (!auth || auth instanceof NextResponse) return fail("No autorizado.", 401);

  try {
    const body = (await request.json()) as { year?: unknown; month?: unknown };

    const year  = Number(body.year);
    const month = Number(body.month);

    if (!Number.isInteger(year) || year < 2017 || year > 2100) {
      return fail("year inválido.", 400);
    }
    if (!Number.isInteger(month) || month < 1 || month > 12) {
      return fail("month inválido.", 400);
    }

    const conn = await findConnectionByUser(auth.user.id, BINANCE_TAX_PROVIDER);
    if (!conn)                    return fail("No hay conexión BINANCE_TAX configurada.", 404);
    if (conn.status === "REVOKED") return fail("La conexión BINANCE_TAX ha sido revocada.", 403);

    const apiKey    = decryptSecret(conn.apiKeyEncrypted);
    const apiSecret = decryptSecret(conn.apiSecretEncrypted);

    const result = await importBinanceTaxTransfers(
      auth.user.id,
      conn.id,
      BINANCE_TAX_PROVIDER,
      apiKey,
      apiSecret,
      year,
      month,
    );

    const message = result.imported > 0
      ? `${result.imported} registros importados (${result.deposits} depósitos, ${result.withdrawals} retiros). ${result.skipped} duplicados omitidos.`
      : `Sin registros nuevos. ${result.skipped} ya existían.`;

    return ok({ year, month, ...result }, message);
  } catch (error) {
    return serverError(error);
  }
}
