// src/app/api/admin/users/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";

import {

// Force dynamic rendering because routes use request.headers/cookies
export const dynamic = 'force-dynamic';
  createAdminAuditLog,
  getAuditRequestContext,
} from "@/modules/admin/infrastructure/adminAuditLogRepository";
import { getSessionFromRequest } from "@/modules/identity/application/sessionToken";
import {
  deleteUser,
  getUserById,
} from "@/modules/identity/infrastructure/userRepository";

type RouteContext = { params: { id: string } };

export async function DELETE(
  req: NextRequest,
  { params }: RouteContext,
) {
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

  const { id } = params;

  if (id === auth.user.id) {
    return NextResponse.json(
      {
        ok: false,
        message: "No puedes eliminar tu propia cuenta",
        data: null,
      },
      { status: 400 },
    );
  }

  try {
    const user = await getUserById(id);

    if (!user) {
      return NextResponse.json(
        { ok: false, message: "Usuario no encontrado", data: null },
        { status: 404 },
      );
    }

    if (user.role === "admin") {
      return NextResponse.json(
        {
          ok: false,
          message: "No puedes eliminar una cuenta admin",
          data: null,
        },
        { status: 400 },
      );
    }

    const deleted = await deleteUser(id);

    if (!deleted) {
      return NextResponse.json(
        {
          ok: false,
          message: "No se pudo eliminar el usuario",
          data: null,
        },
        { status: 500 },
      );
    }

    await createAdminAuditLog({
      action: "USER_DELETED",
      actorId: auth.user.id,
      actorEmail: auth.user.email,
      targetUserId: user.id,
      targetUserEmail: user.email,
      ...getAuditRequestContext(req),
      metadata: {
        source: "api/admin/users/[id]",
        deletedRole: user.role,
        deletedStatus: user.status,
        deletedSubscriptionPlan: user.subscriptionPlan,
      },
    });

    return NextResponse.json({
      ok: true,
      message: `Usuario ${user.email} eliminado correctamente`,
      data: {
        id: user.id,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("[admin/users DELETE]", error);

    return NextResponse.json(
      {
        ok: false,
        message: "Error al eliminar usuario",
        data: null,
      },
      { status: 500 },
    );
  }
}
