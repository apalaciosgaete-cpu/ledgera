import { NextRequest, NextResponse } from "next/server";

import { requireAuth } from "@/shared";
import { getUsers } from "@/modules/identity/infrastructure/userRepository";
import { sanitizeUser } from "@/modules/identity/application/sanitizeUser";

function forbidden() {
  return NextResponse.json(
    {
      ok: false,
      message: "Acceso denegado. Se requiere rol administrador.",
      data: null,
    },
    { status: 403 },
  );
}

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req);

    if (auth instanceof NextResponse) {
      return auth;
    }

    if (!auth || auth.user.role !== "admin") {
      return forbidden();
    }

    const users = await getUsers();
    const nonAdminUsers = users.filter((user) => user.role !== "admin");

    return NextResponse.json({
      ok: true,
      message: "Usuarios obtenidos correctamente.",
      data: nonAdminUsers.map(sanitizeUser),
    });
  } catch (error) {
    console.error("[api/admin/users][GET]", error);

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