import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  isPlatformAuth,
  requirePlatformRole,
} from "@/modules/identity/application/requirePlatformRole";

// Force dynamic rendering because routes use request.headers/cookies
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = await requirePlatformRole(req, ["admin", "support"]);
  if (!isPlatformAuth(auth)) return auth;

  const conversations = await prisma.chatConversation.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
      user: { select: { email: true, full_name: true } },
    },
  });

  const data = conversations.map((conversation) => ({
    id: conversation.id,
    sessionId: conversation.sessionId,
    status: conversation.status,
    guestName: conversation.guestName ?? conversation.user?.full_name ?? "Anónimo",
    guestEmail: conversation.guestEmail ?? conversation.user?.email ?? null,
    lastMessage: conversation.messages[0] ?? null,
    updatedAt: conversation.updatedAt,
    createdAt: conversation.createdAt,
  }));

  return NextResponse.json({
    ok: true,
    data,
    access: {
      role: auth.user.role,
      scope: "SUPPORT_CHAT_ONLY",
    },
  });
}
