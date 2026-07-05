import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

import { requireAuth } from "@/shared";
import type { MovementDto, TaxEventDto } from "@/shared";

import { buildUserScopeWhere } from "@/modules/identity/domain/accessPolicy";


// Force dynamic rendering because routes use request.headers/cookies
export const dynamic = 'force-dynamic';
export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);

  if (!auth || auth instanceof NextResponse) {
    return NextResponse.json(
      {
        ok: false,
        message: "No autorizado",
      },
      {
        status: 401,
      },
    );
  }

  try {
    const scope = buildUserScopeWhere(auth.user);

    const movements =
      (await prisma.portfolioMovement.findMany({
        where: {
          deletedAt: null,
          ...scope,
        },
      })) as MovementDto[];

    const taxEvents =
      (await prisma.taxEvent.findMany({
        where: {
          ...scope,
        },
      })) as TaxEventDto[];

    const sellMovements = movements.filter(
      (movement) => movement.type === "SELL",
    );

    const eventMovementIds = new Set(
      taxEvents.map((event) => event.movementId),
    );

    const movementIds = new Set(
      movements.map((movement) => movement.id),
    );

    const sellWithoutEvent = sellMovements.filter(
      (movement) => !eventMovementIds.has(movement.id),
    );

    const orphanEvents = taxEvents.filter(
      (event) => !movementIds.has(event.movementId),
    );

    return NextResponse.json({
      ok: true,

      data: {
        summary: {
          totalMovements: movements.length,
          totalSellMovements: sellMovements.length,
          totalTaxEvents: taxEvents.length,
          sellWithoutEvent: sellWithoutEvent.length,
          orphanEvents: orphanEvents.length,
        },

        details: {
          sellWithoutEventIds: sellWithoutEvent.map(
            (movement) => movement.id,
          ),

          orphanEventIds: orphanEvents.map(
            (event) => event.id,
          ),
        },
      },
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        ok: false,
        message:
          "Error al validar integridad de eventos tributarios",
      },
      {
        status: 500,
      },
    );
  }
}