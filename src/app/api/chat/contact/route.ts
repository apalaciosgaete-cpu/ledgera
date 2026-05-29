import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { conversationId, name, email } = await req.json() as {
      conversationId: string;
      name: string;
      email: string;
    };

    if (!conversationId || !email) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    await prisma.chatConversation.update({
      where: { id: conversationId },
      data: {
        guestName: name ?? null,
        guestEmail: email,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[chat/contact]", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
