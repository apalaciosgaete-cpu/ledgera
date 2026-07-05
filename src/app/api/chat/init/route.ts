import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";


// Force dynamic rendering because routes use request.headers/cookies
export const dynamic = 'force-dynamic';
async function ensureChatTables() {
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
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS chat_push_subscriptions (
      id          TEXT PRIMARY KEY,
      endpoint    TEXT UNIQUE NOT NULL,
      p256dh      TEXT NOT NULL,
      auth        TEXT NOT NULL,
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

export async function POST(req: NextRequest) {
  try {
    const existingSessionId = req.cookies.get("chat_session")?.value;
    const body = await req.json().catch(() => ({}));
    const { guestName, guestEmail } = body as { guestName?: string; guestEmail?: string };

    if (existingSessionId) {
      try {
        const existing = await prisma.chatConversation.findUnique({
          where: { sessionId: existingSessionId },
          include: { messages: { orderBy: { createdAt: "asc" } } },
        });
        if (existing) {
          return NextResponse.json({
            ok: true,
            data: { conversationId: existing.id, sessionId: existing.sessionId, messages: existing.messages },
          });
        }
      } catch {
        await ensureChatTables();
      }
    }

    try {
      const sessionId = crypto.randomUUID();
      const conversation = await prisma.chatConversation.create({
        data: { sessionId, guestName: guestName ?? null, guestEmail: guestEmail ?? null, status: "OPEN" },
        include: { messages: true },
      });

      const response = NextResponse.json({
        ok: true,
        data: { conversationId: conversation.id, sessionId, messages: [] },
      });
      response.cookies.set("chat_session", sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 90,
        path: "/",
      });
      return response;
    } catch {
      // Tablas no existen — crearlas y reintentar
      await ensureChatTables();

      const sessionId = crypto.randomUUID();
      const conversation = await prisma.chatConversation.create({
        data: { sessionId, guestName: guestName ?? null, guestEmail: guestEmail ?? null, status: "OPEN" },
        include: { messages: true },
      });

      const response = NextResponse.json({
        ok: true,
        data: { conversationId: conversation.id, sessionId, messages: [] },
      });
      response.cookies.set("chat_session", sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 90,
        path: "/",
      });
      return response;
    }
  } catch (err) {
    console.error("[chat/init]", err);
    return NextResponse.json({ ok: false, message: "Error al iniciar chat" }, { status: 500 });
  }
}
