// src/app/api/admin/users/[id]/status/route.ts
import { createAdminAuditLog } from "@/modules/admin/infrastructure/adminAuditLogRepository";
import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/modules/identity/application/sessionToken";
import { updateUserStatus, getUserById } from "@/modules/identity/infrastructure/userRepository";

const VALID_STATUSES = ["active", "inactive", "suspended"] as const;
type ValidStatus = typeof VALID_STATUSES[number];

export async function PATCH(
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
      { ok: false, message: "No puedes cambiar el estado de tu propia cuenta" },
      { status: 400 },
    );
  }

  let body: { status?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, message: "Body inválido" },
      { status: 400 },
    );
  }

  const { status } = body;

  if (!status || !VALID_STATUSES.includes(status as ValidStatus)) {
    return NextResponse.json(
      {
        ok: false,
        message: `Estado inválido. Valores permitidos: ${VALID_STATUSES.join(", ")}`,
      },
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
        { ok: false, message: "No puedes modificar una cuenta admin" },
        { status: 400 },
      );
    }

    const updated = await updateUserStatus(id, status as ValidStatus);
    if (!updated) {
      return NextResponse.json(
        { ok: false, message: "No se pudo actualizar el estado" },
        { status: 500 },
      );
    }
await createAdminAuditLog({
  action: status === "suspended" ? "USER_SUSPENDED" : "USER_REACTIVATED",
  actorId: auth.user.id,
  actorEmail: auth.user.email,
  targetUserId: user.id,
  targetUserEmail: user.email,
  metadata: {
    source: "api/admin/users/[id]/status",
    previousStatus: user.status,
    newStatus: status,
  },
});
    return NextResponse.json({
      ok: true,
      message: `Estado actualizado a: ${status}`,
      data: {
        id:     updated.id,
        email:  updated.email,
        status: updated.status,
      },
    });
  } catch (error) {
    console.error("[admin/users/status PATCH]", error);
    return NextResponse.json(
      { ok: false, message: "Error al actualizar estado" },
      { status: 500 },
    );
  }
}