import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendPushToAdmin } from "@/modules/chat/pushAdmin";

export async function POST(req: NextRequest) {
  try {
    const sessionId = req.cookies.get("chat_session")?.value;
    if (!sessionId) return NextResponse.json({ ok: false, message: "Sin sesión" }, { status: 401 });

    const { content } = await req.json() as { content: string };
    if (!content?.trim()) return NextResponse.json({ ok: false, message: "Mensaje vacío" }, { status: 400 });

    const conversation = await prisma.chatConversation.findUnique({ where: { sessionId } });
    if (!conversation) return NextResponse.json({ ok: false, message: "Conversación no encontrada" }, { status: 404 });

    const message = await prisma.chatMessage.create({
      data: { conversationId: conversation.id, sender: "USER", content: content.trim() },
    });

    await prisma.chatConversation.update({
      where: { id: conversation.id },
      data: { updatedAt: new Date() },
    });

    void sendPushToAdmin(
      `💬 Nuevo mensaje`,
      content.trim().slice(0, 100),
    ).catch(() => {});

    return NextResponse.json({ ok: true, data: { message } });
  } catch (err) {
    console.error("[chat/send]", err);
    return NextResponse.json({ ok: false, message: "Error al enviar mensaje" }, { status: 500 });
  }
}
