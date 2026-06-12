// src/app/api/metrics/activation/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/modules/identity/application/sessionToken";

export async function GET(req: NextRequest) {
  const auth = await getSessionFromRequest(req);

  if (!auth) {
    return NextResponse.json(
      { ok: false, message: "No autenticado", data: null },
      { status: 401 },
    );
  }

  if (auth.user.role !== "admin") {
    return NextResponse.json(
      { ok: false, message: "Sin permisos", data: null },
      { status: 403 },
    );
  }

  try {
    const [registeredUsers, usersWithData, upgradedUsers] = await Promise.all([
      prisma.users.count(),
      prisma.users.count({
        where: {
          OR: [
            { portfolioMovements: { some: { deletedAt: null } } },
            { exchangeConnections: { some: { status: "CONNECTED" } } },
            { bankFileUploads: { some: {} } },
          ],
        },
      }),
      prisma.users.count({
        where: {
          OR: [
            { subscription_plan: { not: "BASICO" } },
            { subscription_expires_at: { gt: new Date() } },
          ],
        },
      }),
    ]);

    return NextResponse.json({
      ok: true,
      message: "Métricas de activación obtenidas correctamente.",
      data: {
        registeredUsers,
        usersWithData,
        // Sin sistema de eventos persistentes aún; se dejan listos para analytics futuro.
        usersViewedMiSituacion: null,
        usersViewedUpgrade: null,
        usersUpgraded: upgradedUsers,
      },
    });
  } catch (error) {
    console.error("[metrics/activation GET]", error);

    return NextResponse.json(
      {
        ok: false,
        message: "Error al obtener métricas de activación.",
        data: null,
      },
      { status: 500 },
    );
  }
}
