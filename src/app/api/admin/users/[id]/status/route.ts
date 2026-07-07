// src/app/api/admin/users/[id]/status/route.ts
import { NextRequest, NextResponse } from "next/server";

// Force dynamic rendering because routes use request.headers/cookies
export const dynamic = 'force-dynamic';

import {
  createAdminAuditLog,
  getAuditRequestContext,
} from "@/modules/admin/infrastructure/adminAuditLogRepository";
import { getSessionFromRequest } from "@/modules/identity/application/sessionToken";
import {
  getUserById,
  updateUserStatus,
} from "@/modules/identity/infrastructure/userRepository";
import { enforceCsrfProtection } from "@/modules/security/application/csrfProtection";

const VALID_STATUSES = ["active", "inactive", "suspended"] as const;
type ValidStatus = (typeof VALID_STATUSES)[number];
type RouteContext = { params: { id: string } };

export async function PATCH(
  req: NextRequest,
  { params }: RouteContext,
) {
  const csrfResponse = enforceCsrfProtection(req);

  if (csrfResponse) {
    return csrfResponse;
  }

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
        message: "No puedes cambiar el estado de tu propia cuenta",
        data: null,
      },
      { status: 400 },
    );
  }

  let body: { status?: string };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, message: "Body inválido", data: null },
      { status: 400 },
    );
  }

  const { status } = body;

  if (!status || !VALID_STATUSES.includes(status as ValidStatus)) {
    return NextResponse.json(
      {
        ok: false,
        message: `Estado inválido. Valores permitidos: ${VALID_STATUSES.join(", ")}`,
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
          message: "No puedes modificar una cuenta admin",
          data: null,
        },
        { status: 400 },
      );
    }

    const updated = await updateUserStatus(id, status as ValidStatus);

    if (!updated) {
      return NextResponse.json(
        {
          ok: false,
          message: "No se pudo actualizar el estado",
          data: null,
        },
        { status: 500 },
      );
    }

    await createAdminAuditLog({
      action: status === "suspended" ? "USER_SUSPENDED" : "USER_REACTIVATED",
      actorId: auth.user.id,
      actorEmail: auth.user.email,
      targetUserId: user.id,
      targetUserEmail: user.email,
      ...getAuditRequestContext(req),
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
        id: updated.id,
        email: updated.email,
        status: updated.status,
      },
    });
  } catch (error) {
    console.error("[admin/users/status PATCH]", error);

    return NextResponse.json(
      {
        ok: false,
        message: "Error al actualizar estado",
        data: null,
      },
      { status: 500 },
    );
  }
}
