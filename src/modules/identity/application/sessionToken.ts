// src/modules/identity/application/sessionToken.ts

import { randomBytes } from "crypto";
import { cookies } from "next/headers";
import { getSessionWithUserByToken } from "@/modules/identity/infrastructure/sessionRepository";

export function generateSessionToken(): string {
  return randomBytes(32).toString("hex");
}

export function buildSessionExpirationDate(days = 7): Date {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + days);
  return expiresAt;
}

async function resolveTokenFromRequest(request: Request): Promise<string | null> {
  const cookieStore = await cookies();
  const cookieToken = cookieStore.get("session_token")?.value;

  if (cookieToken) return cookieToken;

  const authHeader = request.headers.get("authorization");
  if (!authHeader) return null;

  const [type, token] = authHeader.split(" ");
  if (type !== "Bearer" || !token) return null;

  return token;
}

export async function getSessionFromRequest(request: Request) {
  try {
    const token = await resolveTokenFromRequest(request);
    if (!token) return null;

    const auth = await getSessionWithUserByToken(token);
    if (!auth) return null;

    const { session, user } = auth;

    if (session.expiresAt && new Date(session.expiresAt) < new Date()) {
      return null;
    }

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        status: user.status,
        subscriptionPlan: user.subscriptionPlan,
        subscriptionExpiresAt: user.subscriptionExpiresAt,
        twoFactorEnabled: user.twoFactorEnabled,
        needsOnboarding: !user.onboardingCompleted,
      },
      session: {
        id: session.id,
        token: session.token,
        expiresAt: session.expiresAt,
      },
    };
  } catch (error) {
    console.error("getSessionFromRequest error:", error);
    return null;
  }
}
