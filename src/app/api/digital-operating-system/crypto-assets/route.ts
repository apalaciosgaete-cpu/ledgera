import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/modules/identity/application/sessionToken";
import { createCryptoAsset, getDigitalOperatingSnapshot } from "@/modules/digital-operating-system";

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
  return ok(snapshot.cryptoAssets);
}

export async function POST(req: NextRequest) {
  const auth = await getSessionFromRequest(req);
  if (!auth) return fail("No autorizado.", 401);

  const body = await req.json().catch(() => null) as { symbol?: string; name?: string; quantity?: number } | null;
  if (!body?.symbol || !body?.name) return fail("symbol y name son obligatorios.", 400);

  const asset = await createCryptoAsset({ userId: auth.user.id, symbol: body.symbol, name: body.name, quantity: body.quantity ?? null });
  return ok(asset, 201);
}
