import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/modules/identity/application/sessionToken";


// Force dynamic rendering because routes use request.headers/cookies
export const dynamic = 'force-dynamic';
export async function POST(req: NextRequest) {
  const auth = await getSessionFromRequest(req);
  if (!auth || auth.user.role !== "admin") {
    return NextResponse.json({ ok: false }, { status: 403 });
  }

  await prisma.systemSetting.upsert({
    where: { key: "chat_admin_last_seen" },
    create: { key: "chat_admin_last_seen", value: new Date().toISOString(), category: "chat" },
    update: { value: new Date().toISOString() },
  });

  return NextResponse.json({ ok: true });
}
