import { NextResponse } from "next/server";


// Force dynamic rendering because routes use request.headers/cookies
export const dynamic = 'force-dynamic';
export async function POST() {
  return NextResponse.json(
    { ok: false, message: "Ruta retirada. Usa el flujo principal de LEDGERA." },
    { status: 410 },
  );
}
