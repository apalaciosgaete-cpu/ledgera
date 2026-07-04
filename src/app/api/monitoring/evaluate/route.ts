import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { ok: false, message: "Ruta retirada.", data: null },
    { status: 410 },
  );
}
