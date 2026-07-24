// src/app/api/admin/users/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";

import {
  createAdminAuditLog,
  getAuditRequestContext,
} from "@/modules/admin/infrastructure/adminAuditLogRepository";
import {
  isPlatformAuth,
  requirePlatformRole,
} from "@/modules/identity/application/requirePlatformRole";
import {
  deleteSessionsByUserId,
} from "@/modules/identity/infrastructure/sessionRepository";
import {
  deleteUser,
  getUserById,
} from "@/modules/identity/infrastructure/userRepository";
import { enforceCsrfProtection } from "@/modules/security/application/csrfProtection";

export const dynamic = "force-dynamic";

type RouteContext = { params: { id: string } };

export async function DELETE(
  req: NextRequest,
  { params }: RouteContext,
) {
  const csrfResponse = enforceCsrfProtection(req);
  if (csrfResponse) return csrfResponse;

  const auth = await requirePlatformRole(req, ["admin"]);
  if (!isPlatformAuth(auth)) return auth;

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

    const deletionResult = await deleteUser(id);

    if (deletionResult === "not_found") {
      return NextResponse.json(
        { ok: false, message: "Usuario no encontrado", data: null },
        { status: 404 },
      );
    }

    if (deletionResult === "failed") {
      return NextResponse.json(
        {
          ok: false,
          message: "No se pudo eliminar el usuario",
          data: null,
        },
        { status: 500 },
      );
    }

    const revokedSessions = await deleteSessionsByUserId(id).catch((error) => {
      console.error("[admin/users DELETE] session revocation failed", error);
      return 0;
    });

    await createAdminAuditLog({
      action: "USER_DELETED",
      actorId: auth.user.id,
      actorEmail: auth.user.email,
      targetUserId: user.id,
      targetUserEmail: user.email,
      ...getAuditRequestContext(req),
      metadata: {
        source: "api/admin/users/[id]",
        authorization: "admin_session",
        sessionId: auth.session.id,
        deletionMode: "anonymized",
        idempotentRetry: deletionResult === "already_deleted",
        revokedSessions,
        deletedRole: user.role,
        deletedStatus: user.status,
        deletedSubscriptionPlan: user.subscriptionPlan,
      },
    });

    return NextResponse.json({
      ok: true,
      message:
        deletionResult === "already_deleted"
          ? "La cuenta ya estaba eliminada."
          : `Usuario ${user.email} eliminado correctamente`,
      data: {
        id: user.id,
        email: user.email,
        deletionMode: "anonymized",
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
