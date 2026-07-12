// src/modules/identity/application/sessionToken.ts

import { randomBytes } from "crypto";
import { getSessionWithUserByToken } from "@/modules/identity/infrastructure/sessionRepository";

export function generateSessionToken(): string {
  return randomBytes(32).toString("hex");
}

export function buildSessionExpirationDate(days = 7): Date {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + days);
  return expiresAt;
}

function resolveCookieFromHeader(request: Request, name: string): string | null {
  const cookieHeader = request.headers.get("cookie");
  if (!cookieHeader) return null;

  for (const rawCookie of cookieHeader.split(";")) {
    const [rawName, ...rawValueParts] = rawCookie.trim().split("=");
    if (rawName !== name) continue;

    const rawValue = rawValueParts.join("=");
    if (!rawValue) return null;

    try {
      return decodeURIComponent(rawValue);
    } catch {
      return rawValue;
    }
  }

  return null;
}

function resolveTokenFromRequest(request: Request): string | null {
  const cookieToken = resolveCookieFromHeader(request, "session_token");
  if (cookieToken) return cookieToken;

  const authHeader = request.headers.get("authorization");
  if (!authHeader) return null;

  const [type, token] = authHeader.split(" ");
  if (type !== "Bearer" || !token) return null;

  return token;
}

export async function getSessionFromRequest(request: Request) {
  try {
    const token = resolveTokenFromRequest(request);
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
        emailVerifiedAt: user.emailVerifiedAt,
        role: user.role,
        status: user.status,
        subscriptionPlan: user.subscriptionPlan,
        subscriptionExpiresAt: user.subscriptionExpiresAt,
        twoFactorEnabled: Boolean(
          user.twoFactorEnabled && user.twoFactorSecret,
        ),
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
