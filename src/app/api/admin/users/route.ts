import { NextRequest, NextResponse } from "next/server";

import { getUsers } from "@/modules/identity/infrastructure/userRepository";
import { getSessionFromRequest } from "@/modules/identity/application/sessionToken";


// Force dynamic rendering because routes use request.headers/cookies
export const dynamic = 'force-dynamic';
export async function GET(req: NextRequest) {
  const auth = await getSessionFromRequest(req);

  if (!auth) {
    return NextResponse.json(
      { ok: false, message: "No autenticado", data: null },
      { status: 401 },
    );
  }

  if (auth.user.role !== "admin") {
    return NextResponse.json(
      { ok: false, message: "Sin permisos", data: null },
      { status: 403 },
    );
  }

  try {
    const users = await getUsers();

    return NextResponse.json({
      ok: true,
      message: "Usuarios obtenidos correctamente.",
      data: users.map((user) => ({
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        status: user.status,
        subscriptionPlan: user.subscriptionPlan,
        subscriptionExpiresAt: user.subscriptionExpiresAt,
        createdAt: user.createdAt,
      })),
    });
  } catch (error) {
    console.error("[admin/users GET]", error);

    return NextResponse.json(
      {
        ok: false,
        message: "Error al obtener usuarios.",
        data: null,
      },
      { status: 500 },
    );
  }
}