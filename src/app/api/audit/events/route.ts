import { NextRequest, NextResponse } from "next/server";

import {
  createAdminAuditLog,
  getAuditRequestContext,
} from "@/modules/admin/infrastructure/adminAuditLogRepository";
import {
  isValidAuditCategory,
  isValidAuditResult,
  isValidAuditSeverity,
} from "@/modules/audit/domain/audit";
import { listAuditEvents } from "@/modules/audit/infrastructure/auditRepository";
import { requireProfessionalClientAccess } from "@/modules/professional/application/requireProfessionalClientAccess";
import { ProfessionalPermission } from "@/modules/professional/domain/clientAccess";
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
    const requestedUserId = userId || (isAdmin ? undefined : auth.user.id);
    let accessScope: "OWNER" | "ADMIN" | "ADMIN_ALL" | "MANDATE" = isAdmin && !requestedUserId
      ? "ADMIN_ALL"
      : "OWNER";
    let mandateId: string | undefined;

    if (requestedUserId) {
      const access = await requireProfessionalClientAccess(
        auth.user,
        requestedUserId,
        ProfessionalPermission.VIEW_AUDIT,
      );
      if (!access.ok) return access.response;

      accessScope = access.scope;
      if (access.scope === "MANDATE") {
        mandateId = access.mandateId;
      }
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

    if (accessScope === "MANDATE" && requestedUserId && mandateId) {
      await createAdminAuditLog({
        action: "PROFESSIONAL_CLIENT_DATA_ACCESSED",
        actorId: auth.user.id,
        actorEmail: auth.user.email,
        targetUserId: requestedUserId,
        ...getAuditRequestContext(req),
        metadata: {
          source: "api/audit/events",
          mandateId,
          permission: ProfessionalPermission.VIEW_AUDIT,
        },
      });
    }

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
