import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/modules/identity/application/sessionToken";
import { getUserById } from "@/modules/identity/infrastructure/userRepository";

// Force dynamic rendering because routes use request.headers/cookies
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json(
        { ok: false, enabled: false },
        { status: 401 },
      );
    }

    const user = await getUserById(session.user.id);
    const enabled = Boolean(user?.twoFactorEnabled && user.twoFactorSecret);

    return NextResponse.json(
      { ok: true, enabled },
      { headers: { "Cache-Control": "no-store, max-age=0" } },
    );
  } catch {
    return NextResponse.json(
      { ok: false, enabled: false },
      { status: 500 },
    );
  }
}
