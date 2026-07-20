import { NextRequest, NextResponse } from "next/server";

// Force dynamic rendering because routes use request.headers/cookies
export const dynamic = "force-dynamic";

import {
  createAdminAuditLog,
  getAuditRequestContext,
} from "@/modules/admin/infrastructure/adminAuditLogRepository";
import { getSessionFromRequest } from "@/modules/identity/application/sessionToken";
import {
  getUserById,
  updateUserSubscription,
} from "@/modules/identity/infrastructure/userRepository";
import type { SubscriptionPlan } from "@/modules/identity/domain/user";
import { enforceCsrfProtection } from "@/modules/security/application/csrfProtection";

const VALID_PLANS: SubscriptionPlan[] = ["BASICO", "PERSONAL", "PROFESIONAL"];
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

  if (!id) {
    return NextResponse.json(
      { ok: false, message: "ID de usuario requerido", data: null },
      { status: 400 },
    );
  }

  if (id === auth.user.id) {
    return NextResponse.json(
      {
        ok: false,
        message: "No puedes modificar la suscripción de tu propia cuenta admin",
        data: null,
      },
      { status: 400 },
    );
  }

  let body: { plan?: string; daysToAdd?: number };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, message: "Body inválido", data: null },
      { status: 400 },
    );
  }

  const { plan, daysToAdd = 30 } = body;

  if (!plan || !VALID_PLANS.includes(plan as SubscriptionPlan)) {
    return NextResponse.json(
      {
        ok: false,
        message: `Plan inválido. Valores permitidos: ${VALID_PLANS.join(", ")}`,
        data: null,
      },
      { status: 400 },
    );
  }

  if (typeof daysToAdd !== "number" || daysToAdd < 1 || daysToAdd > 365) {
    return NextResponse.json(
      {
        ok: false,
        message: "daysToAdd debe ser un número entre 1 y 365",
        data: null,
      },
      { status: 400 },
    );
  }

  try {
    const targetUser = await getUserById(id);

    if (!targetUser) {
      return NextResponse.json(
        { ok: false, message: "Usuario no encontrado", data: null },
        { status: 404 },
      );
    }

    if (targetUser.role === "admin") {
      return NextResponse.json(
        {
          ok: false,
          message: "No puedes modificar la suscripción de una cuenta admin",
          data: null,
        },
        { status: 400 },
      );
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + daysToAdd);

    const updated = await updateUserSubscription({
      userId: id,
      plan: plan as SubscriptionPlan,
      expiresAt,
    });

    if (!updated) {
      return NextResponse.json(
        {
          ok: false,
          message: "No se pudo actualizar la suscripción",
          data: null,
        },
        { status: 500 },
      );
    }

    await createAdminAuditLog({
      action: "USER_SUBSCRIPTION_UPDATED",
      actorId: auth.user.id,
      actorEmail: auth.user.email,
      targetUserId: targetUser.id,
      targetUserEmail: targetUser.email,
      ...getAuditRequestContext(req),
      metadata: {
        source: "api/admin/users/[id]/subscription",
        previousPlan: targetUser.subscriptionPlan,
        newPlan: updated.subscriptionPlan,
        accountRole: updated.role,
        previousExpiresAt: targetUser.subscriptionExpiresAt,
        subscriptionExpiresAt: updated.subscriptionExpiresAt,
      },
    });

    return NextResponse.json({
      ok: true,
      message: `Suscripción actualizada. Plan: ${plan}. El rol de cuenta se mantiene sin cambios.`,
      data: {
        id: updated.id,
        email: updated.email,
        role: updated.role,
        subscriptionPlan: updated.subscriptionPlan,
        subscriptionExpiresAt: updated.subscriptionExpiresAt,
      },
    });
  } catch (error) {
    console.error("[admin/users/subscription PATCH]", error);

    return NextResponse.json(
      {
        ok: false,
        message: "Error al actualizar suscripción",
        data: null,
      },
      { status: 500 },
    );
  }
}
