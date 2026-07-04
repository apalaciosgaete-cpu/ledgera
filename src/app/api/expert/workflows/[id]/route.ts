import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    { ok: false, message: "Ruta retirada. Usa el flujo principal de LEDGERA." },
    { status: 410 },
  );
}
