import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/modules/identity/application/sessionToken";

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req).catch(() => null);
    const body = await req.json().catch(() => ({}));
    const { guestName, guestEmail } = body as { guestName?: string; guestEmail?: string };

    const existingSessionId = req.cookies.get("chat_session")?.value;

    if (existingSessionId) {
      const existing = await prisma.chatConversation.findUnique({
        where: { sessionId: existingSessionId },
        include: { messages: { orderBy: { createdAt: "asc" } } },
      });
      if (existing) {
        return NextResponse.json({ ok: true, data: { conversationId: existing.id, sessionId: existing.sessionId, messages: existing.messages } });
      }
    }

    const sessionId = session?.user.id ?? crypto.randomUUID();

    const conversation = await prisma.chatConversation.upsert({
      where: { sessionId },
      create: {
        sessionId,
        userId: session?.user.id ?? null,
        guestName: session ? null : (guestName ?? null),
        guestEmail: session ? session.user.email : (guestEmail ?? null),
        status: "OPEN",
      },
      update: {},
      include: { messages: { orderBy: { createdAt: "asc" } } },
    });

    const response = NextResponse.json({
      ok: true,
      data: { conversationId: conversation.id, sessionId, messages: conversation.messages },
    });

    if (!existingSessionId) {
      response.cookies.set("chat_session", sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 90,
        path: "/",
      });
    }

    return response;
  } catch (err) {
    console.error("[chat/init]", err);
    return NextResponse.json({ ok: false, message: "Error al iniciar chat" }, { status: 500 });
  }
}
