import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/shared";
import { fail, serverError } from "@/shared/apiResponse";
import { enforceCsrfProtection } from "@/modules/security/application/csrfProtection";
import { getUserById } from "@/modules/identity/infrastructure/userRepository";
import { requireFeatureAccess } from "@/modules/subscription/application/requireFeatureAccess";
import { Feature } from "@/modules/subscription/domain/planFeatures";
import {
  ProfessionalAccessStatus,
  normalizeProfessionalPermissions,
} from "@/modules/professional/domain/clientAccess";
import {
  acceptProfessionalInvitation,
  declineProfessionalInvitation,
} from "@/modules/professional/infrastructure/professionalClientAccessRepository";
import {
  createAdminAuditLog,
  getAuditRequestContext,
} from "@/modules/admin/infrastructure/adminAuditLogRepository";

export const dynamic = "force-dynamic";

type RouteContext = { params: { id: string } };

export async function POST(
  request: NextRequest,
  { params }: RouteContext,
) {
  const csrfResponse = enforceCsrfProtection(request);
  if (csrfResponse) return csrfResponse;

  const auth = await requireAuth(request);
  if (!auth || auth instanceof NextResponse) return fail("No autorizado.", 401);

  const actionBody = await request.json().catch(() => null);
  const action = String(actionBody?.action ?? "").trim().toUpperCase();

  if (action !== "ACCEPT" && action !== "DECLINE") {
    return fail("Acción inválida. Usa ACCEPT o DECLINE.", 400);
  }

  try {
    const invitation = await prisma.professionalClientAccess.findFirst({
      where: {
        id: params.id,
        clientUserId: auth.user.id,
        status: ProfessionalAccessStatus.PENDING,
      },
      select: {
        id: true,
        professionalUserId: true,
        permissions: true,
        professional: {
          select: {
            email: true,
          },
        },
      },
    });

    if (!invitation) {
      return fail("La invitación no existe o ya fue respondida.", 404);
    }

    if (action === "ACCEPT") {
      const professional = await getUserById(invitation.professionalUserId);
      if (!professional) return fail("La cuenta profesional ya no existe.", 404);

      const featureAccess = requireFeatureAccess(
        professional,
        Feature.EXPERT_MODE,
      );
      if (!featureAccess.ok) {
        return fail(
          "La suscripción del profesional no permite activar nuevos clientes.",
          409,
        );
      }

      if (!professional.twoFactorEnabled && professional.role !== "admin") {
        return fail(
          "El profesional debe activar la autenticación de dos factores antes de recibir acceso.",
          409,
        );
      }

      const result = await acceptProfessionalInvitation({
        id: invitation.id,
        clientUserId: auth.user.id,
      });

      if (result.count === 0) {
        return fail("No fue posible aceptar la invitación.", 409);
      }
    } else {
      const result = await declineProfessionalInvitation({
        id: invitation.id,
        clientUserId: auth.user.id,
      });

      if (result.count === 0) {
        return fail("No fue posible rechazar la invitación.", 409);
      }
    }

    const auditAction = action === "ACCEPT"
      ? "PROFESSIONAL_CLIENT_ACCESS_ACCEPTED"
      : "PROFESSIONAL_CLIENT_ACCESS_DECLINED";

    await createAdminAuditLog({
      action: auditAction,
      actorId: auth.user.id,
      actorEmail: auth.user.email,
      targetUserId: invitation.professionalUserId,
      targetUserEmail: invitation.professional.email,
      ...getAuditRequestContext(request),
      metadata: {
        mandateId: invitation.id,
        permissions: normalizeProfessionalPermissions(invitation.permissions),
      },
    });

    return NextResponse.json({
      ok: true,
      message: action === "ACCEPT"
        ? "Acceso profesional autorizado."
        : "Invitación profesional rechazada.",
      data: {
        id: invitation.id,
        status: action === "ACCEPT"
          ? ProfessionalAccessStatus.ACTIVE
          : ProfessionalAccessStatus.DECLINED,
      },
    });
  } catch (error) {
    return serverError(error);
  }
}
