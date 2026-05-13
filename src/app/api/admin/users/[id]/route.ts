// src/app/api/admin/users/[id]/route.ts
import { createAdminAuditLog } from "@/modules/admin/infrastructure/adminAuditLogRepository";
import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/modules/identity/application/sessionToken";
import { deleteUser, getUserById } from "@/modules/identity/infrastructure/userRepository";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await getSessionFromRequest(req);
  if (!auth) {
    return NextResponse.json({ ok: false, message: "No autenticado" }, { status: 401 });
  }
  if (auth.user.role !== "admin") {
    return NextResponse.json({ ok: false, message: "Sin permisos" }, { status: 403 });
  }

  const { id } = await params;

  if (id === auth.user.id) {
    return NextResponse.json(
      { ok: false, message: "No puedes eliminar tu propia cuenta" },
      { status: 400 },
    );
  }

  try {
    const user = await getUserById(id);
    if (!user) {
      return NextResponse.json(
        { ok: false, message: "Usuario no encontrado" },
        { status: 404 },
      );
    }

    if (user.role === "admin") {
      return NextResponse.json(
        { ok: false, message: "No puedes eliminar una cuenta admin" },
        { status: 400 },
      );
    }

    const deleted = await deleteUser(id);
    if (!deleted) {
      return NextResponse.json(
        { ok: false, message: "No se pudo eliminar el usuario" },
        { status: 500 },
      );
    }
await createAdminAuditLog({
  action: "USER_DELETED",
  actorId: auth.user.id,
  actorEmail: auth.user.email,
  targetUserId: user.id,
  targetUserEmail: user.email,
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
    });
  } catch (error) {
    console.error("[admin/users DELETE]", error);
    return NextResponse.json(
      { ok: false, message: "Error al eliminar usuario" },
      { status: 500 },
    );
  }
}