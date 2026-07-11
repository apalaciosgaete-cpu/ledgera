import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/shared";
import { fail, ok, serverError } from "@/shared/apiResponse";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth || auth instanceof NextResponse) return fail("No autorizado.", 401);

  try {
    const connections = await prisma.exchangeConnection.findMany({
      where: {
        userId: auth.user.id,
        status: { in: ["CONNECTED", "ACTIVE"] },
      },
      select: {
        exchange: true,
        status: true,
        lastSyncAt: true,
      },
    });

    return ok(
      {
        connections: Object.fromEntries(
          connections.map((connection) => [
            connection.exchange,
            {
              connected: true,
              status: connection.status,
              lastSyncAt: connection.lastSyncAt,
            },
          ]),
        ),
      },
      "Estado de conexiones recuperado.",
    );
  } catch (error) {
    return serverError(error);
  }
}
