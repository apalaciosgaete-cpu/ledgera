import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/modules/identity/application/sessionToken";

export async function POST(req: NextRequest) {
  const auth = await getSessionFromRequest(req);
  if (!auth || auth.user.role !== "admin") {
    return NextResponse.json({ ok: false }, { status: 403 });
  }

  const results: string[] = [];

  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS chat_conversations (
        id           TEXT PRIMARY KEY,
        "userId"     TEXT,
        "sessionId"  TEXT UNIQUE NOT NULL,
        status       TEXT NOT NULL DEFAULT 'OPEN',
        "guestName"  TEXT,
        "guestEmail" TEXT,
        "createdAt"  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updatedAt"  TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    results.push("chat_conversations: OK");
  } catch (e) {
    results.push(`chat_conversations: ERROR ${String(e)}`);
  }

  try {
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS idx_chat_conv_session ON chat_conversations ("sessionId")
    `);
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS idx_chat_conv_status ON chat_conversations (status)
    `);
  } catch (e) {
    results.push(`chat_conversations indexes: ${String(e)}`);
  }

  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS chat_messages (
        id               TEXT PRIMARY KEY,
        "conversationId" TEXT NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
        sender           TEXT NOT NULL,
        content          TEXT NOT NULL,
        "createdAt"      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "readAt"         TIMESTAMPTZ
      )
    `);
    results.push("chat_messages: OK");
  } catch (e) {
    results.push(`chat_messages: ERROR ${String(e)}`);
  }

  try {
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS idx_chat_msg_conv ON chat_messages ("conversationId")
    `);
  } catch (e) {
    results.push(`chat_messages indexes: ${String(e)}`);
  }

  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS chat_push_subscriptions (
        id          TEXT PRIMARY KEY,
        endpoint    TEXT UNIQUE NOT NULL,
        p256dh      TEXT NOT NULL,
        auth        TEXT NOT NULL,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    results.push("chat_push_subscriptions: OK");
  } catch (e) {
    results.push(`chat_push_subscriptions: ERROR ${String(e)}`);
  }

  return NextResponse.json({ ok: true, results });
}
