import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/modules/identity/application/sessionToken";

export async function GET(req: NextRequest) {
  const auth = await getSessionFromRequest(req);
  if (!auth || auth.user.role !== "admin") {
    return NextResponse.json({ ok: false, message: "No autorizado" }, { status: 403 });
  }

  const conversations = await prisma.chatConversation.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
      user: { select: { email: true, full_name: true } },
    },
  });

  const data = conversations.map((c) => ({
    id: c.id,
    sessionId: c.sessionId,
    status: c.status,
    guestName: c.guestName ?? c.user?.full_name ?? "Anónimo",
    guestEmail: c.guestEmail ?? c.user?.email ?? null,
    lastMessage: c.messages[0] ?? null,
    updatedAt: c.updatedAt,
    createdAt: c.createdAt,
  }));

  return NextResponse.json({ ok: true, data });
}
