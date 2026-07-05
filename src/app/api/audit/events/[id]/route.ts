import { NextRequest, NextResponse } from "next/server";

import { getSessionFromRequest } from "@/modules/identity/application/sessionToken";
import { getAuditEventById } from "@/modules/audit/infrastructure/auditRepository";


// Force dynamic rendering because routes use request.headers/cookies
export const dynamic = 'force-dynamic';
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const auth = await getSessionFromRequest(req);

  if (!auth) {
    return NextResponse.json(
      { ok: false, message: "No autenticado", data: null },
      { status: 401 },
    );
  }

  try {
    const event = await getAuditEventById(params.id);

    if (!event) {
      return NextResponse.json(
        { ok: false, message: "Evento no encontrado.", data: null },
        { status: 404 },
      );
    }

    const isAdmin = auth.user.role === "admin";
    const isOwner = event.userId === auth.user.id || event.actorId === auth.user.id;

    if (!isAdmin && !isOwner) {
      return NextResponse.json(
        { ok: false, message: "Sin permisos", data: null },
        { status: 403 },
      );
    }

    return NextResponse.json({
      ok: true,
      message: "Evento de auditoría obtenido.",
      data: {
        id: event.id,
        userId: event.userId,
        actorId: event.actorId,
        category: event.category,
        severity: event.severity,
        event: event.event,
        description: event.description,
        result: event.result,
        entityType: event.entityType,
        entityId: event.entityId,
        metadata: event.metadata,
        ipAddress: event.ipAddress,
        userAgent: event.userAgent,
        createdAt: event.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("[audit/events/[id] GET]", error);

    return NextResponse.json(
      { ok: false, message: "Error al obtener evento de auditoría.", data: null },
      { status: 500 },
    );
  }
}
