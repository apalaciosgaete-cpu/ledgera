// src/modules/identity/application/sessionToken.ts

import { randomBytes } from "crypto";
import { cookies } from "next/headers";
import { getSessionByToken } from "@/modules/identity/infrastructure/sessionRepository";
import { getUserById } from "@/modules/identity/infrastructure/userRepository";

export function generateSessionToken(): string {
  return randomBytes(32).toString("hex");
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

    const session = await getSessionByToken(token);
    if (!session) return null;

    if (session.expiresAt && new Date(session.expiresAt) < new Date()) {
      return null;
    }

    const user = await getUserById(session.userId);
    if (!user) return null;

    return {
      user: {
        id:                    user.id,
        email:                 user.email,
        role:                  user.role,
        status:                user.status,
        subscriptionPlan:      user.subscriptionPlan,
        subscriptionExpiresAt: user.subscriptionExpiresAt,
      },
      session: {
        id:        session.id,
        token:     session.token,
        expiresAt: session.expiresAt,
      },
    };
  } catch (error) {
    console.error("getSessionFromRequest error:", error);
    return null;
  }
}