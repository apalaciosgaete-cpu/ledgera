// src/modules/identity/client/authClient.ts

import type {
  SubscriptionPlan,
  UserRole,
  UserStatus,
} from "@/modules/identity/domain/user";
import { httpClient } from "@/shared/http/httpClient";

export type AuthUser = {
  id: string;
  email: string;
  role: UserRole;
  status?: UserStatus;
  subscriptionPlan?: SubscriptionPlan;
  subscriptionExpiresAt?: string | null;
  twoFactorEnabled?: boolean;
  needsOnboarding?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

type LoginResponse = {
  ok?: boolean;
  message?: string;
  data?: {
    user: AuthUser;
    session: {
      token: string;
      expiresAt: string;
    };
  };
  user?: AuthUser;
  session?: {
    token: string;
    expiresAt: string;
  };
};

type MeResponse = {
  ok?: boolean;
  message?: string;
  data?: {
    user: AuthUser;
  };
  user?: AuthUser;
};

export async function loginRequest(email: string, password: string) {
  const response = await httpClient<LoginResponse>("/api/login", {
    method: "POST",
    body: { email, password },
  });

  const user = response.data?.user ?? response.user;
  const session = response.data?.session ?? response.session;

  if (!user || !session?.token) {
    throw new Error("Respuesta de login inválida");
  }

  return {
    user,
    token: session.token,
    expiresAt: session.expiresAt,
  };
}

export async function meRequest() {
  const response = await httpClient<MeResponse>("/api/me", {
    method: "GET",
    auth: true,
  });

  const user = response.data?.user ?? response.user;

  if (!user) {
    throw new Error("Respuesta de sesión inválida");
  }

  return user;
}

export async function logoutRequest() {
  await httpClient("/api/logout", {
    method: "POST",
    auth: true,
  });
}
