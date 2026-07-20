import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  isPlatformAuth,
  requirePlatformRole,
} from "@/modules/identity/application/requirePlatformRole";
import { enforceCsrfProtection } from "@/modules/security/application/csrfProtection";

// Force dynamic rendering because routes use request.headers/cookies
export const dynamic = "force-dynamic";

async function requireChatAccess(req: NextRequest) {
  return requirePlatformRole(req, ["admin", "support"]);
}

export async function POST(req: NextRequest) {
  const csrfResponse = enforceCsrfProtection(req);
  if (csrfResponse) return csrfResponse;

  const auth = await requireChatAccess(req);
  if (!isPlatformAuth(auth)) return auth;

  const { conversationId, content } = await req.json() as {
    conversationId: string;
    content: string;
  };

  if (!conversationId) {
    return NextResponse.json(
      { ok: false, message: "Conversación requerida" },
      { status: 400 },
    );
  }

  if (!content?.trim()) {
    return NextResponse.json(
      { ok: false, message: "Mensaje vacío" },
      { status: 400 },
    );
  }

  const conversation = await prisma.chatConversation.findUnique({
    where: { id: conversationId },
    select: { id: true },
  });

  if (!conversation) {
    return NextResponse.json(
      { ok: false, message: "Conversación no encontrada" },
      { status: 404 },
    );
  }

  const message = await prisma.chatMessage.create({
    data: {
      conversationId,
      sender: "ADMIN",
      content: content.trim(),
    },
  });

  await prisma.chatConversation.update({
    where: { id: conversationId },
    data: { updatedAt: new Date() },
  });

  await prisma.chatMessage.updateMany({
    where: { conversationId, sender: "USER", readAt: null },
    data: { readAt: new Date() },
  });

  return NextResponse.json({
    ok: true,
    data: {
      message,
      handledBy: {
        userId: auth.user.id,
        role: auth.user.role,
      },
    },
  });
}

export async function GET(req: NextRequest) {
  const auth = await requireChatAccess(req);
  if (!isPlatformAuth(auth)) return auth;

  const conversationId = req.nextUrl.searchParams.get("conversationId");
  if (!conversationId) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const messages = await prisma.chatMessage.findMany({
    where: { conversationId },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({
    ok: true,
    data: {
      messages,
      access: {
        role: auth.user.role,
        scope: "SUPPORT_CHAT_ONLY",
      },
    },
  });
}
