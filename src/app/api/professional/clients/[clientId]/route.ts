import { NextRequest, NextResponse } from "next/server";

import {
  createAdminAuditLog,
  getAuditRequestContext,
} from "@/modules/admin/infrastructure/adminAuditLogRepository";
import { getUserById } from "@/modules/identity/infrastructure/userRepository";
import {
  normalizeProfessionalWorkflowStatus,
} from "@/modules/professional/domain/clientAccess";
import {
  getActiveProfessionalClientAccess,
  revokeProfessionalClientAccess,
  updateProfessionalClientWorkflow,
} from "@/modules/professional/infrastructure/professionalClientAccessRepository";
import { enforceCsrfProtection } from "@/modules/security/application/csrfProtection";
import { requireFeatureAccess } from "@/modules/subscription/application/requireFeatureAccess";
import { Feature } from "@/modules/subscription/domain/planFeatures";
import { fail, serverError } from "@/shared/apiResponse";
import { requireAuth } from "@/shared";

export const dynamic = "force-dynamic";

type RouteContext = { params: { clientId: string } };

function requireProfessionalSecurity(user: {
  id: string;
  role?: string | null;
  status?: string | null;
  subscriptionPlan?: string | null;
  subscriptionExpiresAt?: Date | string | null;
  twoFactorEnabled?: boolean | null;
}) {
  const featureAccess = requireFeatureAccess(user, Feature.EXPERT_MODE);
  if (!featureAccess.ok) return featureAccess.response;

  if (!user.twoFactorEnabled && user.role !== "admin") {
    return fail(
      "Debes activar la autenticación de dos factores para administrar clientes.",
      403,
      { code: "TWO_FACTOR_REQUIRED" },
    );
  }

  return null;
}

export async function PATCH(
  request: NextRequest,
  { params }: RouteContext,
) {
  const csrfResponse = enforceCsrfProtection(request);
  if (csrfResponse) return csrfResponse;

  const auth = await requireAuth(request);
  if (!auth || auth instanceof NextResponse) return fail("No autorizado.", 401);

  const securityResponse = requireProfessionalSecurity(auth.user);
  if (securityResponse) return securityResponse;

  try {
    const body = await request.json();
    const workflowStatus = normalizeProfessionalWorkflowStatus(body.workflowStatus);
    const workflowNote = String(body.workflowNote ?? "").trim() || null;

    if (!workflowStatus) {
      return fail("Estado operativo inválido.", 400, {
        code: "INVALID_PROFESSIONAL_WORKFLOW_STATUS",
      });
    }

    if (workflowNote && workflowNote.length > 500) {
      return fail("La nota operativa no puede superar 500 caracteres.", 400, {
        code: "PROFESSIONAL_WORKFLOW_NOTE_TOO_LONG",
      });
    }

    const [client, access] = await Promise.all([
      getUserById(params.clientId),
      getActiveProfessionalClientAccess({
        professionalUserId: auth.user.id,
        clientUserId: params.clientId,
      }),
    ]);

    if (!client || !access) {
      return fail("No existe un mandato activo para este cliente.", 404);
    }

    const result = await updateProfessionalClientWorkflow({
      professionalUserId: auth.user.id,
      clientUserId: params.clientId,
      workflowStatus,
      workflowNote,
    });

    if (result.count === 0) {
      return fail("No fue posible actualizar el estado operativo.", 409);
    }

    await createAdminAuditLog({
      action: "PROFESSIONAL_CLIENT_WORKFLOW_UPDATED",
      actorId: auth.user.id,
      actorEmail: auth.user.email,
      targetUserId: client.id,
      targetUserEmail: client.email,
      ...getAuditRequestContext(request),
      metadata: {
        mandateId: access.id,
        previousWorkflowStatus: access.workflowStatus,
        newWorkflowStatus: workflowStatus,
        previousWorkflowNote: access.workflowNote,
        newWorkflowNote: workflowNote,
      },
    });

    return NextResponse.json({
      ok: true,
      message: "Estado operativo actualizado.",
      data: {
        clientUserId: client.id,
        workflowStatus,
        workflowNote,
        workflowUpdatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    return serverError(error);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: RouteContext,
) {
  const csrfResponse = enforceCsrfProtection(request);
  if (csrfResponse) return csrfResponse;

  const auth = await requireAuth(request);
  if (!auth || auth instanceof NextResponse) return fail("No autorizado.", 401);

  const securityResponse = requireProfessionalSecurity(auth.user);
  if (securityResponse) return securityResponse;

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
