import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/modules/identity/application/sessionToken";
import { createExchangeAccount, getDigitalOperatingSnapshot } from "@/modules/digital-operating-system";


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
  return ok(snapshot.exchangeAccounts);
}

export async function POST(req: NextRequest) {
  const auth = await getSessionFromRequest(req);
  if (!auth) return fail("No autorizado.", 401);

  const body = await req.json().catch(() => null) as { provider?: string; accountLabel?: string } | null;
  if (!body?.provider || !body?.accountLabel) return fail("provider y accountLabel son obligatorios.", 400);

  const exchange = await createExchangeAccount({ userId: auth.user.id, provider: body.provider, accountLabel: body.accountLabel });
  return ok(exchange, 201);
}
