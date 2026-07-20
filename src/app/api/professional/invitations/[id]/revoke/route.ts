import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/shared";
import { fail, serverError } from "@/shared/apiResponse";
import { enforceCsrfProtection } from "@/modules/security/application/csrfProtection";
import { ProfessionalAccessStatus } from "@/modules/professional/domain/clientAccess";
import { revokeProfessionalAccessAsClient } from "@/modules/professional/infrastructure/professionalClientAccessRepository";
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

  try {
    const mandate = await prisma.professionalClientAccess.findFirst({
      where: {
        id: params.id,
        clientUserId: auth.user.id,
        status: ProfessionalAccessStatus.ACTIVE,
      },
      select: {
        id: true,
        professionalUserId: true,
        professional: {
          select: { email: true },
        },
      },
    });

    if (!mandate) return fail("No existe un mandato activo.", 404);

    const result = await revokeProfessionalAccessAsClient({
      id: mandate.id,
      clientUserId: auth.user.id,
    });

    if (result.count === 0) {
      return fail("No fue posible revocar el acceso profesional.", 409);
    }

    await createAdminAuditLog({
      action: "PROFESSIONAL_ACCESS_REVOKED_BY_CLIENT",
      actorId: auth.user.id,
      actorEmail: auth.user.email,
      targetUserId: mandate.professionalUserId,
      targetUserEmail: mandate.professional.email,
      ...getAuditRequestContext(request),
      metadata: {
        mandateId: mandate.id,
      },
    });

    return NextResponse.json({
      ok: true,
      message: "El acceso profesional fue revocado.",
      data: { id: mandate.id },
    });
  } catch (error) {
    return serverError(error);
  }
}
