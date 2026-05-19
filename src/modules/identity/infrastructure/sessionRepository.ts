import { prisma } from "@/lib/prisma";
import type { Session } from "@/modules/identity/domain/session";

interface CreateSessionInput {
  userId: string;
  token: string;
  expiresAt: Date;
}

function mapRowToSession(row: {
  id: string;
  user_id: string;
  token: string;
  expires_at: Date;
  created_at: Date;
}): Session {
  return {
    id: row.id,
    userId: row.user_id,
    token: row.token,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
  };
}

export async function createSession(input: CreateSessionInput): Promise<Session> {
  const session = await prisma.sessions.create({
    data: {
      user_id: input.userId,
      token: input.token,
      expires_at: input.expiresAt,
    },
  });
  return mapRowToSession(session);
}

export async function getSessionByToken(token: string): Promise<Session | null> {
  const session = await prisma.sessions.findFirst({ where: { token } });
  if (!session) return null;
  return mapRowToSession(session);
}

export async function listSessionsByUserId(userId: string): Promise<Session[]> {
  const sessions = await prisma.sessions.findMany({
    where: {
      user_id: userId,
      expires_at: { gt: new Date() },
    },
    orderBy: { created_at: "desc" },
  });
  return sessions.map(mapRowToSession);
}

export async function deleteSessionByToken(token: string): Promise<boolean> {
  const result = await prisma.sessions.deleteMany({ where: { token } });
  return result.count > 0;
}

export async function deleteSessionByIdForUser(input: {
  sessionId: string;
  userId: string;
}): Promise<boolean> {
  const result = await prisma.sessions.deleteMany({
    where: { id: input.sessionId, user_id: input.userId },
  });
  return result.count > 0;
}

export async function deleteOtherSessionsForUser(input: {
  userId: string;
  currentSessionId: string;
}): Promise<number> {
  const result = await prisma.sessions.deleteMany({
    where: {
      user_id: input.userId,
      NOT: { id: input.currentSessionId },
    },
  });
  return result.count;
}

export async function deleteSessionsByUserId(userId: string): Promise<number> {
  const result = await prisma.sessions.deleteMany({ where: { user_id: userId } });
  return result.count;
}

export async function rotateSessionForUser(input: CreateSessionInput): Promise<Session> {
  await deleteSessionsByUserId(input.userId);
  return createSession(input);
}

export async function deleteExpiredSessions(): Promise<number> {
  const result = await prisma.sessions.deleteMany({
    where: { expires_at: { lte: new Date() } },
  });
  return result.count;
}
