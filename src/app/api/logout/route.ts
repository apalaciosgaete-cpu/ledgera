import { NextRequest, NextResponse } from "next/server";

import { deleteSessionByToken } from "@/modules/identity/infrastructure/sessionRepository";

export async function POST(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get("session_token")?.value;

    if (sessionToken) {
      await deleteSessionByToken(sessionToken);
    }

    const response = NextResponse.json({
      ok: true,
      message: "Sesión cerrada correctamente.",
    });

    response.cookies.set("session_token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      expires: new Date(0),
    });

    return response;
  } catch (error) {
    console.error("[api/logout]", error);

    return NextResponse.json(
      {
        ok: false,
        message: "No fue posible cerrar sesión.",
      },
      { status: 500 },
    );
  }
}