import { NextRequest, NextResponse } from "next/server";

import { requireAuth } from "@/shared";
import { fail, serverError } from "@/shared/apiResponse";
import { requireFeatureAccess } from "@/modules/subscription/application/requireFeatureAccess";
import { Feature } from "@/modules/subscription/domain/planFeatures";
import { enforceCsrfProtection } from "@/modules/security/application/csrfProtection";
import { getUserById } from "@/modules/identity/infrastructure/userRepository";
import { revokeProfessionalClientAccess } from "@/modules/professional/infrastructure/professionalClientAccessRepository";
import {
  createAdminAuditLog,
  getAuditRequestContext,
} from "@/modules/admin/infrastructure/adminAuditLogRepository";

export const dynamic = "force-dynamic";

type RouteContext = { params: { clientId: string } };

export async function DELETE(
  request: NextRequest,
  { params }: RouteContext,
) {
  const csrfResponse = enforceCsrfProtection(request);
  if (csrfResponse) return csrfResponse;

  const auth = await requireAuth(request);
  if (!auth || auth instanceof NextResponse) return fail("No autorizado.", 401);

  const featureAccess = requireFeatureAccess(auth.user, Feature.EXPERT_MODE);
  if (!featureAccess.ok) return featureAccess.response;

  if (!auth.user.twoFactorEnabled && auth.user.role !== "admin") {
    return fail(
      "Debes activar la autenticación de dos factores para administrar clientes.",
      403,
    );
  }

  try {
    const client = await getUserById(params.clientId);
    if (!client) return fail("Cliente no encontrado.", 404);

    const result = await revokeProfessionalClientAccess({
      professionalUserId: auth.user.id,
      clientUserId: params.clientId,
    });

    if (result.count === 0) {
      return fail("No existe una invitación o mandato activo para este cliente.", 404);
    }

    await createAdminAuditLog({
      action: "PROFESSIONAL_CLIENT_ACCESS_REVOKED",
      actorId: auth.user.id,
      actorEmail: auth.user.email,
      targetUserId: client.id,
      targetUserEmail: client.email,
      ...getAuditRequestContext(request),
      metadata: {
        source: "professional",
      },
    });

    return NextResponse.json({
      ok: true,
      message: "Acceso profesional revocado y cupo liberado.",
      data: { clientUserId: client.id },
    });
  } catch (error) {
    return serverError(error);
  }
}
