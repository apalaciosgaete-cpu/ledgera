import { NextRequest, NextResponse } from "next/server";

import { getSessionFromRequest } from "@/modules/identity/application/sessionToken";
import { listAuditEvents } from "@/modules/audit/infrastructure/auditRepository";
import {
  isValidAuditCategory,
  isValidAuditResult,
  isValidAuditSeverity,
} from "@/modules/audit/domain/audit";

export async function GET(req: NextRequest) {
  const auth = await getSessionFromRequest(req);

  if (!auth) {
    return NextResponse.json(
      { ok: false, message: "No autenticado", data: null },
      { status: 401 },
    );
  }

  try {
    const { searchParams } = new URL(req.url);

    const category = searchParams.get("category") ?? "";
    const severity = searchParams.get("severity") ?? "";
    const result = searchParams.get("result") ?? "";
    const userId = searchParams.get("userId") ?? "";
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");

    const isAdmin = auth.user.role === "admin";
    const requestedUserId = userId || (isAdmin ? undefined : auth.user.id);

    if (userId && !isAdmin && userId !== auth.user.id) {
      return NextResponse.json(
        { ok: false, message: "Sin permisos", data: null },
        { status: 403 },
      );
    }

    const events = await listAuditEvents({
      category: isValidAuditCategory(category) ? category : undefined,
      severity: isValidAuditSeverity(severity) ? severity : undefined,
      result: isValidAuditResult(result) ? result : undefined,
      userId: requestedUserId,
      dateFrom: dateFrom ? new Date(dateFrom) : undefined,
      dateTo: dateTo ? new Date(dateTo) : undefined,
      limit: 100,
    });

    return NextResponse.json({
      ok: true,
      message: "Eventos de auditoría obtenidos.",
      data: events.map((event) => ({
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
        createdAt: event.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("[audit/events GET]", error);

    return NextResponse.json(
      { ok: false, message: "Error al obtener eventos de auditoría.", data: null },
      { status: 500 },
    );
  }
}
