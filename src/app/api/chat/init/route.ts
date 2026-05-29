import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const existingSessionId = req.cookies.get("chat_session")?.value;
    const body = await req.json().catch(() => ({}));
    const { guestName, guestEmail } = body as { guestName?: string; guestEmail?: string };

    if (existingSessionId) {
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
    }

    const sessionId = crypto.randomUUID();

    const conversation = await prisma.chatConversation.create({
      data: {
        sessionId,
        guestName: guestName ?? null,
        guestEmail: guestEmail ?? null,
        status: "OPEN",
      },
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
  } catch (err) {
    console.error("[chat/init]", err);
    return NextResponse.json({ ok: false, message: "Error al iniciar chat" }, { status: 500 });
  }
}
