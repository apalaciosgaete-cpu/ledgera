import { randomUUID } from "crypto";

import { db } from "@/infrastructure/db/client";
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
  const sessionId = randomUUID();

  const result = await db.query(
    `
      insert into sessions (
        id,
        user_id,
        token,
        expires_at,
        created_at,
        updated_at
      )
      values ($1, $2, $3, $4, now(), now())
      returning
        id,
        user_id,
        token,
        expires_at,
        created_at
    `,
    [sessionId, input.userId, input.token, input.expiresAt],
  );

  return mapRowToSession(result.rows[0]);
}

export async function getSessionByToken(token: string): Promise<Session | null> {
  const result = await db.query(
    `
      select
        id,
        user_id,
        token,
        expires_at,
        created_at
      from sessions
      where token = $1
      limit 1
    `,
    [token],
  );

  if (result.rows.length === 0) {
    return null;
  }

  return mapRowToSession(result.rows[0]);
}

export async function listSessionsByUserId(userId: string): Promise<Session[]> {
  const result = await db.query(
    `
      select
        id,
        user_id,
        token,
        expires_at,
        created_at
      from sessions
      where user_id = $1
        and expires_at > now()
      order by created_at desc
    `,
    [userId],
  );

  return result.rows.map(mapRowToSession);
}

export async function deleteSessionByToken(token: string): Promise<boolean> {
  const result = await db.query(
    `
      delete from sessions
      where token = $1
    `,
    [token],
  );

  return (result.rowCount ?? 0) > 0;
}

export async function deleteSessionByIdForUser(input: {
  sessionId: string;
  userId: string;
}): Promise<boolean> {
  const result = await db.query(
    `
      delete from sessions
      where id = $1
        and user_id = $2
    `,
    [input.sessionId, input.userId],
  );

  return (result.rowCount ?? 0) > 0;
}

export async function deleteOtherSessionsForUser(input: {
  userId: string;
  currentSessionId: string;
}): Promise<number> {
  const result = await db.query(
    `
      delete from sessions
      where user_id = $1
        and id <> $2
    `,
    [input.userId, input.currentSessionId],
  );

  return result.rowCount ?? 0;
}

export async function deleteSessionsByUserId(userId: string): Promise<number> {
  const result = await db.query(
    `
      delete from sessions
      where user_id = $1
    `,
    [userId],
  );

  return result.rowCount ?? 0;
}

export async function rotateSessionForUser(input: CreateSessionInput): Promise<Session> {
  await deleteSessionsByUserId(input.userId);

  return createSession(input);
}

export async function deleteExpiredSessions(): Promise<number> {
  const result = await db.query(
    `
      delete from sessions
      where expires_at <= now()
    `,
  );

  return result.rowCount ?? 0;
}