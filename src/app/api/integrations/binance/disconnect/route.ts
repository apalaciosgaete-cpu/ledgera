import { NextRequest } from "next/server";
import { getSessionFromRequest } from "@/modules/identity/application/sessionToken";
import { disconnectBinanceConnection } from "@/modules/integrations/binance/infrastructure/connectionRepository";
import { fail, ok, serverError } from "@/shared/apiResponse";

export async function POST(request: NextRequest) {
  try {
    const auth = await getSessionFromRequest(request);

    if (!auth) {
      return fail("No autorizado.", 401);
    }

    const connection = await disconnectBinanceConnection(auth.user.id);

    return ok(
      {
        connected: false,
        connection,
      },
      connection
        ? "Binance fue desconectado correctamente."
        : "Binance no tenía una conexión activa.",
    );
  } catch (error) {
    return serverError(error);
  }
}
