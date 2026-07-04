import { NextRequest, NextResponse } from "next/server";
import { requireEnv } from "@/lib/env";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  const expectedToken = requireEnv("PREVIEW_BYPASS_TOKEN");

  if (token !== expectedToken) {
    return NextResponse.json({ ok: false }, { status: 403 });
  }

  const response = NextResponse.redirect(new URL("/", req.url));

  response.cookies.set("ledgera_preview", "1", {
    httpOnly: false,
    secure: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });

  return response;
}
