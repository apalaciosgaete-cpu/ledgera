import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/modules/identity/application/sessionToken";


// Force dynamic rendering because routes use request.headers/cookies
export const dynamic = 'force-dynamic';
async function guard(req: NextRequest) {
  const auth = await getSessionFromRequest(req);
  if (!auth || auth.user.role !== "admin") return NextResponse.json({ ok: false }, { status: 403 });
  return null;
}

export async function POST(req: NextRequest) {
  const block = await guard(req);
  if (block) return block;

  const { conversationId, content } = await req.json() as { conversationId: string; content: string };
  if (!content?.trim()) return NextResponse.json({ ok: false, message: "Mensaje vacío" }, { status: 400 });

  const message = await prisma.chatMessage.create({
    data: { conversationId, sender: "ADMIN", content: content.trim() },
  });

  await prisma.chatConversation.update({ where: { id: conversationId }, data: { updatedAt: new Date() } });

  await prisma.chatMessage.updateMany({
    where: { conversationId, sender: "USER", readAt: null },
    data: { readAt: new Date() },
  });

  return NextResponse.json({ ok: true, data: { message } });
}

export async function GET(req: NextRequest) {
  const block = await guard(req);
  if (block) return block;

  const conversationId = req.nextUrl.searchParams.get("conversationId");
  if (!conversationId) return NextResponse.json({ ok: false }, { status: 400 });

  const messages = await prisma.chatMessage.findMany({
    where: { conversationId },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ ok: true, data: { messages } });
}
