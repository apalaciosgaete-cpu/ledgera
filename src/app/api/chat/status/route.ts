import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";


// Force dynamic rendering because routes use request.headers/cookies
export const dynamic = 'force-dynamic';
export async function GET() {
  try {
    const setting = await prisma.systemSetting.findUnique({
      where: { key: "chat_admin_last_seen" },
    });

    if (!setting) return NextResponse.json({ ok: true, adminOnline: false });

    const lastSeen = new Date(setting.value);
    const diffMs = Date.now() - lastSeen.getTime();
    const adminOnline = diffMs < 2 * 60 * 1000; // 2 minutos

    return NextResponse.json({ ok: true, adminOnline });
  } catch {
    return NextResponse.json({ ok: true, adminOnline: false });
  }
}
