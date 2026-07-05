import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/shared";


// Force dynamic rendering because routes use request.headers/cookies
export const dynamic = 'force-dynamic';
export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);

  if (!auth || auth instanceof NextResponse) {
    return NextResponse.json({ ok: false, message: "No autorizado" }, { status: 401 });
  }

  try {
    const events = await prisma.stagingEvent.findMany({
      where: {
        userId: auth.user.id,
      },
      orderBy: {
        occurredAt: "desc",
      },
      take: 100,
      select: {
        id: true,
        source: true,
        provider: true,
        status: true,
        normalizedType: true,
        title: true,
        subtitle: true,
        amountLabel: true,
        occurredAt: true,
        linkedMovementId: true,
        createdAt: true,
      },
    });

    const pending = events.filter((event) => event.status === "PENDING");
    const ready = events.filter((event) => event.status === "READY" || event.status === "REVIEWED");
    const observed = events.filter((event) => event.status === "OBSERVED" || event.status === "REJECTED");

    return NextResponse.json({
      ok: true,
      message: "Eventos de revision cargados correctamente.",
      data: {
        summary: {
          total: events.length,
          pending: pending.length,
          ready: ready.length,
          observed: observed.length,
        },
        events,
      },
    });
  } catch (error) {
    console.error("REVISION_EVENTS_ERROR", error);

    return NextResponse.json(
      { ok: false, message: "No fue posible cargar la bandeja de revision." },
      { status: 500 },
    );
  }
}
