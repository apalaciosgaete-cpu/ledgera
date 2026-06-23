import { NextResponse } from "next/server";

import { getSessionFromRequest } from "@/modules/identity/application/sessionToken";
import type { SubscriptionPlan, UserRole, UserStatus } from "@/modules/identity/domain/user";

export type ApiActor = {
  id: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  subscriptionPlan: SubscriptionPlan;
  subscriptionExpiresAt: Date | null;
  twoFactorEnabled: boolean;
};

export class ApiAuthError extends Error {
  status: number;
  code: string;

  constructor(status: number, message: string, code: string) {
    super(message);
    this.name = "ApiAuthError";
    this.status = status;
    this.code = code;
  }
}

export function isApiAuthError(error: unknown): error is ApiAuthError {
  return error instanceof ApiAuthError;
}

export function apiAuthErrorResponse(error: ApiAuthError) {
  return NextResponse.json(
    {
      ok: false,
      message: error.message,
      data: { code: error.code },
    },
    { status: error.status },
  );
}

export async function requireApiUser(request: Request): Promise<ApiActor> {
  const auth = await getSessionFromRequest(request);

  if (!auth?.user) {
    throw new ApiAuthError(401, "Sesión requerida.", "AUTH_REQUIRED");
  }

  if (auth.user.status !== "active") {
    throw new ApiAuthError(403, "La cuenta no está activa.", "ACCOUNT_NOT_ACTIVE");
  }

  return {
    id: auth.user.id,
    email: auth.user.email,
    role: auth.user.role,
    status: auth.user.status,
    subscriptionPlan: auth.user.subscriptionPlan,
    subscriptionExpiresAt: auth.user.subscriptionExpiresAt,
    twoFactorEnabled: auth.user.twoFactorEnabled,
  };
}

export async function requireAdmin(request: Request): Promise<ApiActor> {
  const actor = await requireApiUser(request);

  if (actor.role !== "admin") {
    throw new ApiAuthError(403, "Permisos de administrador requeridos.", "ADMIN_REQUIRED");
  }

  return actor;
}

export async function requireSelfOrAdmin(
  request: Request,
  targetUserId: string,
): Promise<ApiActor> {
  const actor = await requireApiUser(request);

  if (actor.role !== "admin" && actor.id !== targetUserId) {
    throw new ApiAuthError(403, "No tienes permisos para operar sobre este usuario.", "SELF_OR_ADMIN_REQUIRED");
  }

  return actor;
}
