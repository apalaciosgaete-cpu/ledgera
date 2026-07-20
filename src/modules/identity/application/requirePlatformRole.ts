import { NextResponse } from "next/server";

import { getSessionFromRequest } from "@/modules/identity/application/sessionToken";
import type { UserRole } from "@/modules/identity/domain/user";
import { fail } from "@/shared/apiResponse";

export type PlatformAuth = NonNullable<Awaited<ReturnType<typeof getSessionFromRequest>>>;

export async function requirePlatformRole(
  request: Request,
  allowedRoles: readonly UserRole[],
): Promise<PlatformAuth | NextResponse> {
  const auth = await getSessionFromRequest(request);

  if (!auth) {
    return fail("No autenticado.", 401);
  }

  if (!allowedRoles.includes(auth.user.role as UserRole)) {
    return fail("Sin permisos para realizar esta acción.", 403, {
      code: "PLATFORM_ROLE_REQUIRED",
      allowedRoles,
    });
  }

  return auth;
}

export function isPlatformAuth(
  value: PlatformAuth | NextResponse,
): value is PlatformAuth {
  return !(value instanceof NextResponse);
}
