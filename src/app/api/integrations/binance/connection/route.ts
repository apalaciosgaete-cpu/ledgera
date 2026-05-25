import { NextRequest } from "next/server";
import { getSessionFromRequest } from "@/modules/identity/application/sessionToken";
import { findBinanceConnection } from "@/modules/integrations/binance/infrastructure/connectionRepository";
import { fail, ok, serverError } from "@/shared/apiResponse";

export async function GET(request: NextRequest) {
  try {
    const auth = await getSessionFromRequest(request);

    if (!auth) {
      return fail("No autorizado.", 401);
    }

    const connection = await findBinanceConnection(auth.user.id);

    if (!connection) {
      return ok(
        {
          connected: false,
          connection: null,
        },
        "Binance no está conectado.",
      );
    }

    return ok(
      {
        connected: connection.status === "CONNECTED",
        connection: {
          id:          connection.id,
          exchange:    connection.exchange,
          status:      connection.status,
          permissions: connection.permissions,
          lastSyncAt:  connection.lastSyncAt,
          createdAt:   connection.createdAt,
          updatedAt:   connection.updatedAt,
        },
      },
      "Estado de conexión Binance obtenido correctamente.",
    );
  } catch (error) {
    return serverError(error);
  }
}
