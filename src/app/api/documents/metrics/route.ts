import { NextRequest, NextResponse } from "next/server";

import {
  createAdminAuditLog,
  getAuditRequestContext,
} from "@/modules/admin/infrastructure/adminAuditLogRepository";
import { getDocumentMetrics } from "@/modules/documents/application/getDocumentMetrics";
import { requireProfessionalClientAccess } from "@/modules/professional/application/requireProfessionalClientAccess";
import { ProfessionalPermission } from "@/modules/professional/domain/clientAccess";
import { requireAuth } from "@/shared";
import { ok, fail, serverError } from "@/shared/apiResponse";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth || auth instanceof NextResponse) {
    return fail("No autorizado.", 401);
  }

  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId") ?? auth.user.id;

    const access = await requireProfessionalClientAccess(
      auth.user,
      userId,
      ProfessionalPermission.VIEW_TAX_DATA,
    );
    if (!access.ok) return access.response;

    const result = await getDocumentMetrics(userId);

    if (!result.ok) {
      return fail(result.message, 400);
    }

    if (access.scope === "MANDATE") {
      await createAdminAuditLog({
        action: "PROFESSIONAL_CLIENT_DATA_ACCESSED",
        actorId: auth.user.id,
        actorEmail: auth.user.email,
        targetUserId: userId,
        ...getAuditRequestContext(request),
        metadata: {
          source: "api/documents/metrics",
          mandateId: access.mandateId,
          permission: ProfessionalPermission.VIEW_TAX_DATA,
        },
      });
    }

    return ok(
      {
        ...result.metrics,
        accessScope: access.scope,
      },
      "Métricas obtenidas.",
    );
  } catch (error) {
    return serverError(error);
  }
}
