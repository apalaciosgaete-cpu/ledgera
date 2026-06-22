import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const sessionId = req.cookies.get("chat_session")?.value;
    if (!sessionId) return NextResponse.json({ ok: false, message: "Sin sesión" }, { status: 401 });

    const since = req.nextUrl.searchParams.get("since");
    const sinceDate = since ? new Date(since) : new Date(0);

    const conversation = await prisma.chatConversation.findUnique({ where: { sessionId } });
    if (!conversation) return NextResponse.json({ ok: true, data: { messages: [] } });

    const messages = await prisma.chatMessage.findMany({
      where: { conversationId: conversation.id, createdAt: { gt: sinceDate } },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ ok: true, data: { messages } });
  } catch (err) {
    console.error("[chat/poll]", err);
    return NextResponse.json({ ok: false, message: "Error" }, { status: 500 });
  }
}
