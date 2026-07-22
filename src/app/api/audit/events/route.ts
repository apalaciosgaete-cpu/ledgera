import { NextRequest, NextResponse } from "next/server";

import {
  isValidAuditCategory,
  isValidAuditResult,
  isValidAuditSeverity,
} from "@/modules/audit/domain/audit";
import { listAuditEvents } from "@/modules/audit/infrastructure/auditRepository";
import { requireAuth } from "@/shared";
import { fail, serverError } from "@/shared/apiResponse";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth || auth instanceof NextResponse) {
    return fail("No autenticado.", 401);
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
    if (!isAdmin && userId && userId !== auth.user.id) {
      return fail("No puedes consultar la auditoría de otra cuenta.", 403);
    }

    const requestedUserId = isAdmin
      ? userId || undefined
      : auth.user.id;
    const accessScope: "OWNER" | "ADMIN" | "ADMIN_ALL" = isAdmin && !requestedUserId
      ? "ADMIN_ALL"
      : isAdmin
        ? "ADMIN"
        : "OWNER";

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
      data: {
        accessScope,
        events: events.map((event) => ({
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
      },
    });
  } catch (error) {
    return serverError(error);
  }
}
