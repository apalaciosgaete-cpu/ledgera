import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/modules/identity/application/sessionToken";
import { createDigitalSystemEvent, getDigitalOperatingSnapshot } from "@/modules/digital-operating-system";


// Force dynamic rendering because routes use request.headers/cookies
export const dynamic = 'force-dynamic';
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
  return ok(snapshot.events);
}

export async function POST(req: NextRequest) {
  const auth = await getSessionFromRequest(req);
  if (!auth) return fail("No autorizado.", 401);
  const body = await req.json().catch(() => null) as { eventType?: string; description?: string; metadata?: unknown } | null;
  if (!body?.eventType || !body?.description) return fail("eventType y description son obligatorios.", 400);
  const event = await createDigitalSystemEvent({ userId: auth.user.id, eventType: body.eventType, description: body.description, metadata: body.metadata ?? {} });
  return ok(event, 201);
}
