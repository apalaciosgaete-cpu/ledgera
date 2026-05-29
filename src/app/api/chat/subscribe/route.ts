import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { endpoint, keys } = await req.json() as {
      endpoint: string;
      keys: { p256dh: string; auth: string };
    };

    await prisma.chatPushSubscription.upsert({
      where: { endpoint },
      create: { endpoint, p256dh: keys.p256dh, auth: keys.auth },
      update: { p256dh: keys.p256dh, auth: keys.auth },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[chat/subscribe]", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
