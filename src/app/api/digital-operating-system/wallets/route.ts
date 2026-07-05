import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/modules/identity/application/sessionToken";
import { createWallet, getDigitalOperatingSnapshot } from "@/modules/digital-operating-system";


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
  return ok(snapshot.wallets);
}

export async function POST(req: NextRequest) {
  const auth = await getSessionFromRequest(req);
  if (!auth) return fail("No autorizado.", 401);
  const body = await req.json().catch(() => null) as { label?: string; network?: string; publicAddress?: string } | null;
  if (!body?.label || !body?.network || !body?.publicAddress) return fail("label, network y publicAddress son obligatorios.", 400);
  const wallet = await createWallet({ userId: auth.user.id, label: body.label, network: body.network, publicAddress: body.publicAddress });
  return ok(wallet, 201);
}
