import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/shared";
import { fail, ok, serverError } from "@/shared/apiResponse";
import { enforceCsrfProtection } from "@/modules/security/application/csrfProtection";
import { findConnectionByUser } from "@/modules/integrations/binance/infrastructure/exchangeConnectionRepository";
import { decryptSecret } from "@/modules/integrations/binance/application/encryptCredentials";
import { fetchAccountInfo } from "@/modules/integrations/binance/infrastructure/binanceClient";
import { logBinanceAuditEvent } from "@/modules/integrations/binance/application/logBinanceAuditEvent";

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

    let account;
    try {
      account = await fetchAccountInfo(apiKey, apiSecret);
    } catch (e) {
      await logBinanceAuditEvent(request, "BINANCE_CONNECTION_TESTED", auth.user.id, auth.user.email, {
        provider:     "BINANCE",
        status:       "FAILED",
        connectionId: conn.id,
        error:        e instanceof Error ? e.message : "Error desconocido",
      });
      throw e;
    }

    const balancesWithFunds = account.balances.filter(b => parseFloat(b.free) > 0).length;

    await logBinanceAuditEvent(request, "BINANCE_CONNECTION_TESTED", auth.user.id, auth.user.email, {
      provider:          "BINANCE",
      status:            "SUCCESS",
      connectionId:      conn.id,
      accountType:       account.accountType,
      canTrade:          account.canTrade,
      permissionsCount:  account.permissions.length,
      balancesWithFunds,
    });

    return ok(
      {
        canTrade:      account.canTrade,
        canDeposit:    account.canDeposit,
        accountType:   account.accountType,
        permissions:   account.permissions,
        balancesCount: balancesWithFunds,
      },
      "Conexión con Binance verificada correctamente.",
    );
  } catch (error) {
    return serverError(error);
  }
}
