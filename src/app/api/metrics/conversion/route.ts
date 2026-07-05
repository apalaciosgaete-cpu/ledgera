// src/app/api/metrics/conversion/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/modules/identity/application/sessionToken";
import { DB_PLAN_VALUE } from "@/modules/subscription/domain/planFeatures";


// Force dynamic rendering because routes use request.headers/cookies
export const dynamic = 'force-dynamic';
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
    const [freeUsers, personalUsers, proUsers, pendingPayments] = await Promise.all([
      prisma.users.count({ where: { subscription_plan: DB_PLAN_VALUE.FREE } }),
      prisma.users.count({ where: { subscription_plan: DB_PLAN_VALUE.PERSONAL } }),
      prisma.users.count({ where: { subscription_plan: DB_PLAN_VALUE.PRO } }),
      prisma.billingPayment.count({
        where: {
          userId: auth.user.id,
          status: "PENDING",
        },
      }),
    ]);

    return NextResponse.json({
      ok: true,
      message: "Métricas de conversión obtenidas correctamente.",
      data: {
        freeUsers,
        personalUsers,
        proUsers,
        // Sin eventos persistentes aún; listos para analytics futuro.
        upgradePromptsViewed: null,
        upgradeClicks: null,
        upgradeStarted: null,
        upgradeCompleted: null,
        ctrUpgrade: null,
        conversionFreeToPersonal: null,
        conversionPersonalToPro: null,
        pendingPaymentsForCurrentUser: pendingPayments,
      },
    });
  } catch (error) {
    console.error("[metrics/conversion GET]", error);

    return NextResponse.json(
      {
        ok: false,
        message: "Error al obtener métricas de conversión.",
        data: null,
      },
      { status: 500 },
    );
  }
}
