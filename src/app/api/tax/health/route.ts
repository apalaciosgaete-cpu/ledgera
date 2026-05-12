// src/app/api/tax/health/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/shared";
import type { MovementDto, TaxEventDto } from "@/shared";

type TaxHealthStatus = "OK" | "REVIEW" | "RISK";

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth || auth instanceof NextResponse) {
    return NextResponse.json({ ok: false, message: "No autorizado" }, { status: 401 });
  }

  try {
    const movements = (await prisma.portfolioMovement.findMany({
      where: { deletedAt: null, userId: auth.user.id },
    })) as MovementDto[];

    const taxEvents = (await prisma.taxEvent.findMany({
      where: { userId: auth.user.id },
    })) as TaxEventDto[];

    const sellMovements    = movements.filter(m => m.type === "SELL");
    const eventMovementIds = new Set(taxEvents.map(e => e.movementId));
    const sellWithoutEvent = sellMovements.filter(m => !eventMovementIds.has(m.id));

    let status: TaxHealthStatus = "OK";
    if (sellWithoutEvent.length > 5) status = "RISK";
    else if (sellWithoutEvent.length > 0) status = "REVIEW";

    return NextResponse.json({
      ok:   true,
      data: {
        status,
        summary: {
          totalMovements:    movements.length,
          totalSellMovements: sellMovements.length,
          totalTaxEvents:    taxEvents.length,
          sellWithoutEvent:  sellWithoutEvent.length,
        },
        details: {
          sellWithoutEventIds: sellWithoutEvent.map(m => m.id),
        },
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ ok: false, message: "Error al evaluar salud tributaria" }, { status: 500 });
  }
}