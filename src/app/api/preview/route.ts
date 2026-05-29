import { NextRequest, NextResponse } from "next/server";

const PREVIEW_TOKEN = process.env.PREVIEW_BYPASS_TOKEN ?? "ledgera-preview-2026";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");

  if (token !== PREVIEW_TOKEN) {
    return NextResponse.json({ ok: false }, { status: 403 });
  }

  const response = NextResponse.redirect(new URL("/", req.url));

  response.cookies.set("ledgera_preview", "1", {
    httpOnly: false,
    secure: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30, // 30 días
    path: "/",
  });

  return response;
}
