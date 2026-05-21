import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/shared";
import { fail, ok, serverError } from "@/shared/apiResponse";
import { enforceCsrfProtection } from "@/modules/security/application/csrfProtection";
import { findConnectionByUser } from "@/modules/integrations/binance/infrastructure/exchangeConnectionRepository";
import { decryptSecret } from "@/modules/integrations/binance/application/encryptCredentials";
import { fetchAccountInfo } from "@/modules/integrations/binance/infrastructure/binanceClient";

export async function POST(request: NextRequest) {
  const csrf = enforceCsrfProtection(request);
  if (csrf) return csrf;

  const auth = await requireAuth(request);
  if (!auth || auth instanceof NextResponse) return fail("No autorizado.", 401);

  try {
    const conn = await findConnectionByUser(auth.user.id, "BINANCE");
    if (!conn) return fail("No hay conexión con Binance configurada.", 404);

    const apiKey    = decryptSecret(conn.apiKey);
    const apiSecret = decryptSecret(conn.apiSecret);

    const account = await fetchAccountInfo(apiKey, apiSecret);

    return ok(
      {
        canTrade:    account.canTrade,
        canDeposit:  account.canDeposit,
        accountType: account.accountType,
        permissions: account.permissions,
        balancesCount: account.balances.filter(b => parseFloat(b.free) > 0).length,
      },
      "Conexión con Binance verificada correctamente.",
    );
  } catch (error) {
    return serverError(error);
  }
}
