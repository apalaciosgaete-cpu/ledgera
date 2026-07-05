import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/modules/identity/application/sessionToken";
import { createDigitalDocument, getDigitalOperatingSnapshot } from "@/modules/digital-operating-system";


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
  return ok(snapshot.documents);
}

export async function POST(req: NextRequest) {
  const auth = await getSessionFromRequest(req);
  if (!auth) return fail("No autorizado.", 401);
  const body = await req.json().catch(() => null) as { name?: string; category?: string; relatedModule?: string; fileUrl?: string } | null;
  if (!body?.name || !body?.category || !body?.relatedModule) return fail("name, category y relatedModule son obligatorios.", 400);
  const document = await createDigitalDocument({ userId: auth.user.id, name: body.name, category: body.category, relatedModule: body.relatedModule, fileUrl: body.fileUrl ?? null });
  return ok(document, 201);
}
