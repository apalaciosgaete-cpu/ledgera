import { NextRequest, NextResponse } from "next/server";

import { requireAuth } from "@/shared";
import { fail, ok, serverError } from "@/shared/apiResponse";
import { normalizeProfessionalPermissions } from "@/modules/professional/domain/clientAccess";
import { listClientProfessionalInvitations } from "@/modules/professional/infrastructure/professionalClientAccessRepository";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth || auth instanceof NextResponse) return fail("No autorizado.", 401);

  try {
    const invitations = await listClientProfessionalInvitations(auth.user.id);

    return ok({
      invitations: invitations.map((item) => ({
        id: item.id,
        professionalUserId: item.professionalUserId,
        status: item.status,
        permissions: normalizeProfessionalPermissions(item.permissions),
        invitedAt: item.invitedAt,
        acceptedAt: item.acceptedAt,
        revokedAt: item.revokedAt,
        updatedAt: item.updatedAt,
        professional: {
          id: item.professional.id,
          email: item.professional.email,
          fullName: item.professional.full_name,
          status: item.professional.status,
          twoFactorEnabled: item.professional.twoFactorEnabled,
        },
      })),
    });
  } catch (error) {
    return serverError(error);
  }
}
