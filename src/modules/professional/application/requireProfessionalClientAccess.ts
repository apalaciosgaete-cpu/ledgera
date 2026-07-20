import { NextResponse } from "next/server";

import { requireFeatureAccess } from "@/modules/subscription/application/requireFeatureAccess";
import { Feature } from "@/modules/subscription/domain/planFeatures";
import {
  normalizeProfessionalPermissions,
  type ProfessionalPermission,
} from "@/modules/professional/domain/clientAccess";
import { getActiveProfessionalClientAccess } from "@/modules/professional/infrastructure/professionalClientAccessRepository";

type ProfessionalUser = {
  id: string;
  role?: string | null;
  status?: string | null;
  subscriptionPlan?: string | null;
  subscriptionExpiresAt?: Date | string | null;
  twoFactorEnabled?: boolean | null;
};

type ProfessionalClientAccessResult =
  | {
      ok: true;
      scope: "OWNER" | "ADMIN" | "MANDATE";
      mandateId?: string;
    }
  | {
      ok: false;
      response: NextResponse;
    };

export async function requireProfessionalClientAccess(
  user: ProfessionalUser,
  clientUserId: string,
  permission?: ProfessionalPermission,
): Promise<ProfessionalClientAccessResult> {
  if (user.id === clientUserId) {
    return { ok: true, scope: "OWNER" };
  }

  if (user.role === "admin") {
    return { ok: true, scope: "ADMIN" };
  }

  const featureAccess = requireFeatureAccess(user, Feature.EXPERT_MODE);
  if (!featureAccess.ok) return featureAccess;

  if (!user.twoFactorEnabled) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          ok: false,
          message: "Debes activar la autenticación de dos factores para acceder a clientes.",
          data: { code: "TWO_FACTOR_REQUIRED" },
        },
        { status: 403 },
      ),
    };
  }

  const mandate = await getActiveProfessionalClientAccess({
    professionalUserId: user.id,
    clientUserId,
  });

  if (!mandate) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          ok: false,
          message: "El contribuyente no ha autorizado este acceso profesional.",
          data: { code: "PROFESSIONAL_MANDATE_REQUIRED" },
        },
        { status: 403 },
      ),
    };
  }

  const permissions = normalizeProfessionalPermissions(mandate.permissions);

  if (permission && !permissions.includes(permission)) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          ok: false,
          message: "El mandato no autoriza esta operación.",
          data: {
            code: "PROFESSIONAL_PERMISSION_REQUIRED",
            permission,
          },
        },
        { status: 403 },
      ),
    };
  }

  return {
    ok: true,
    scope: "MANDATE",
    mandateId: mandate.id,
  };
}
