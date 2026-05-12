import { NextRequest, NextResponse } from "next/server";

import { deleteSessionByToken } from "@/modules/identity/infrastructure/sessionRepository";

function extractToken(req: NextRequest): string | null {
  const authHeader = req.headers.get("authorization");

  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.replace("Bearer ", "").trim();
  }

  return req.cookies.get("session_token")?.value ?? null;
}

export async function POST(req: NextRequest) {
  try {
    const token = extractToken(req);

    if (token) {
      await deleteSessionByToken(token);
    }

    const response = NextResponse.json({
      ok: true,
      message: "Sesión cerrada correctamente.",
      data: null,
    });

    response.cookies.set("session_token", "", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 0,
    });

    return response;
  } catch (error) {
    console.error("[api/logout][POST]", error);

    return NextResponse.json(
      {
        ok: false,
        message: "No fue posible cerrar sesión.",
        data: null,
      },
      { status: 500 },
    );
  }
}