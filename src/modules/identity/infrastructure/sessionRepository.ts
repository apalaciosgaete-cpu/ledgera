import { prisma } from "@/lib/prisma";
import type { Session } from "@/modules/identity/domain/session";
import type { User } from "@/modules/identity/domain/user";

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

const sessionUserSelect = {
  id:                      true,
  email:                   true,
  full_name:               true,
  password_hash:           true,
  status:                  true,
  role:                    true,
  email_verified_at:       true,
  created_at:              true,
  updated_at:              true,
  subscription_plan:       true,
  subscription_expires_at: true,
  twoFactorSecret:         true,
  twoFactorEnabled:        true,
  onboardingCompleted:     true,
  rut:                     true,
  phone:                   true,
  address:                 true,
  commune:                 true,
  country:                 true,
} as const;

type SessionUserRow = {
  id:                      string;
  email:                   string;
  full_name:               string;
  password_hash:           string;
  status:                  string;
  role:                    string;
  email_verified_at:       Date | null;
  created_at:              Date;
  updated_at:              Date;
  subscription_plan:       string;
  subscription_expires_at: Date | null;
  twoFactorSecret:         string | null;
  twoFactorEnabled:        boolean;
  onboardingCompleted:     boolean;
  rut:                     string | null;
  phone:                   string | null;
  address:                 string | null;
  commune:                 string | null;
  country:                 string | null;
};

export type SessionUser = User & {
  onboardingCompleted: boolean;
};

export type SessionWithUser = {
  session: Session;
  user: SessionUser;
};

function mapRowToSessionUser(row: SessionUserRow): SessionUser {
  return {
    id:                    row.id,
    email:                 row.email,
    fullName:              row.full_name,
    passwordHash:          row.password_hash,
    status:                row.status as User["status"],
    role:                  row.role as User["role"],
    emailVerifiedAt:       row.email_verified_at,
    createdAt:             row.created_at,
    updatedAt:             row.updated_at,
    subscriptionPlan:      (row.subscription_plan ?? "BASICO") as User["subscriptionPlan"],
    subscriptionExpiresAt: row.subscription_expires_at,
    twoFactorSecret:       row.twoFactorSecret,
    twoFactorEnabled:      row.twoFactorEnabled,
    rut:                   row.rut ?? null,
    phone:                 row.phone ?? null,
    address:               row.address ?? null,
    commune:               row.commune ?? null,
    country:               row.country ?? "Chile",
    onboardingCompleted:   row.onboardingCompleted,
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
  const session = await prisma.sessions.findUnique({ where: { token } });
  if (!session) return null;
  return mapRowToSession(session);
}

export async function getSessionWithUserByToken(token: string): Promise<SessionWithUser | null> {
  const session = await prisma.sessions.findUnique({
    where: { token },
    include: {
      users: {
        select: sessionUserSelect,
      },
    },
  });

  if (!session) return null;

  return {
    session: mapRowToSession(session),
    user: mapRowToSessionUser(session.users),
  };
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
