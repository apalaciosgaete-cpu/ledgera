import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  isPlatformAuth,
  requirePlatformRole,
} from "@/modules/identity/application/requirePlatformRole";
import { enforceCsrfProtection } from "@/modules/security/application/csrfProtection";

// Force dynamic rendering because routes use request.headers/cookies
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const csrfResponse = enforceCsrfProtection(req);
  if (csrfResponse) return csrfResponse;

  const auth = await requirePlatformRole(req, ["admin", "support"]);
  if (!isPlatformAuth(auth)) return auth;

  await prisma.systemSetting.upsert({
    where: { key: "chat_admin_last_seen" },
    create: {
      key: "chat_admin_last_seen",
      value: new Date().toISOString(),
      category: "chat",
    },
    update: { value: new Date().toISOString() },
  });

  return NextResponse.json({
    ok: true,
    data: {
      role: auth.user.role,
      scope: "SUPPORT_CHAT_ONLY",
    },
  });
}
