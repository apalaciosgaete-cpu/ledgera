import { NextRequest, NextResponse } from "next/server";

import { requireAuth } from "@/shared";
import { fail, ok, serverError } from "@/shared/apiResponse";
import { requireFeatureAccess } from "@/modules/subscription/application/requireFeatureAccess";
import { Feature } from "@/modules/subscription/domain/planFeatures";
import { requireProfessionalClientAccess } from "@/modules/professional/application/requireProfessionalClientAccess";
import { ProfessionalPermission } from "@/modules/professional/domain/clientAccess";
import { getUserById } from "@/modules/identity/infrastructure/userRepository";
import {
  createAdminAuditLog,
  getAuditRequestContext,
} from "@/modules/admin/infrastructure/adminAuditLogRepository";
import { getAllTaxCasesExpert } from "@/modules/tax-cases/application/buildTaxCases";

// Force dynamic rendering because routes use request.headers/cookies
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth || auth instanceof NextResponse) {
    return fail("No autorizado.", 401);
  }

  const featureAccess = requireFeatureAccess(auth.user, Feature.EXPERT_MODE);
  if (!featureAccess.ok) return featureAccess.response;

  try {
    const { searchParams } = new URL(request.url);
    const requestedUserId = searchParams.get("userId") ?? auth.user.id;

    const clientAccess = await requireProfessionalClientAccess(
      auth.user,
      requestedUserId,
      ProfessionalPermission.VIEW_TAX_DATA,
    );
    if (!clientAccess.ok) return clientAccess.response;

    const filters = {
      status: searchParams.get("status") ?? undefined,
      priority: searchParams.get("priority") ?? undefined,
      userId: requestedUserId,
    };

    const summary = await getAllTaxCasesExpert(filters);

    if (requestedUserId !== auth.user.id) {
      const targetUser = await getUserById(requestedUserId);

      await createAdminAuditLog({
        action: "PROFESSIONAL_CLIENT_DATA_ACCESSED",
        actorId: auth.user.id,
        actorEmail: auth.user.email,
        targetUserId: requestedUserId,
        targetUserEmail: targetUser?.email ?? null,
        ...getAuditRequestContext(request),
        metadata: {
          resource: "tax_cases",
          accessScope: clientAccess.scope,
          mandateId: clientAccess.mandateId ?? null,
          filters,
          resultCount: summary.items.length,
        },
      });
    }

    return ok(
      {
        ...summary,
        accessScope: clientAccess.scope,
        items: summary.items.map((item) => ({
          ...item,
          createdAt: item.createdAt.toISOString(),
          updatedAt: item.updatedAt.toISOString(),
        })),
      },
      "Casos obtenidos (vista experto).",
    );
  } catch (error) {
    return serverError(error);
  }
}
