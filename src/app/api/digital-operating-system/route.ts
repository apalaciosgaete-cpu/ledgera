import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/modules/identity/application/sessionToken";
import { getDigitalOperatingSnapshot, ensureDigitalProfile } from "@/modules/digital-operating-system";

function ok(data: unknown, status = 200) {
  return NextResponse.json({ ok: true, data }, { status });
}

function fail(message: string, status = 400) {
  return NextResponse.json({ ok: false, message, data: null }, { status });
}

export async function GET(req: NextRequest) {
  const auth = await getSessionFromRequest(req);
  if (!auth) return fail("No autorizado.", 401);

  const snapshot = await getDigitalOperatingSnapshot(auth.user.id);
  return ok(snapshot);
}

export async function POST(req: NextRequest) {
  const auth = await getSessionFromRequest(req);
  if (!auth) return fail("No autorizado.", 401);

  const profile = await ensureDigitalProfile(auth.user.id);
  return ok({ profile }, 201);
}
