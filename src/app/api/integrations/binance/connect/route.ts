import { NextRequest } from "next/server";

import { connectBinanceAccount } from "@/modules/integrations/binance/application/connectBinanceAccount";
import { getSessionFromRequest } from "@/modules/identity/application/sessionToken";
import { enforceCsrfProtection } from "@/modules/security/application/csrfProtection";
import { requireActiveSubscription } from "@/modules/subscription/application/requireActiveSubscription";
import { fail, ok, serverError } from "@/shared/apiResponse";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const csrfResponse = enforceCsrfProtection(request);
  if (csrfResponse) return csrfResponse;

  try {
    const auth = await getSessionFromRequest(request);

    if (!auth) {
      return fail("No autorizado.", 401);
    }

    const subscriptionCheck = requireActiveSubscription(auth.user);
    if (!subscriptionCheck.ok) return subscriptionCheck.response;

    const body = await request.json();

    const apiKey = String(body.apiKey ?? "").trim();
    const apiSecret = String(body.apiSecret ?? "").trim();

    const result = await connectBinanceAccount({
      userId: auth.user.id,
      apiKey,
      apiSecret,
    });

    if (!result.ok) {
      return fail(result.message, 400);
    }

    return ok(
      {
        status: result.status,
        connection: result.connection,
      },
      result.message,
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "";

    if (message.includes("LEDGERA_ENCRYPTION_KEY")) {
      return fail(
        "La clave de cifrado de LEDGERA no está configurada en el servidor. Revisa LEDGERA_ENCRYPTION_KEY en Vercel.",
        500,
      );
    }

    return serverError(error);
  }
}
