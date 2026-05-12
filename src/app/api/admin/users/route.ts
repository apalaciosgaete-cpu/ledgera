import { NextRequest, NextResponse } from "next/server";

import { requireAuth } from "@/shared";
import {
  getUserById,
  updateUserSubscription,
} from "@/modules/identity/infrastructure/userRepository";
import { sanitizeUser } from "@/modules/identity/application/sanitizeUser";
import type { SubscriptionPlan } from "@/modules/identity/domain/user";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

const VALID_PLANS: SubscriptionPlan[] = ["BASICO", "PROFESIONAL", "EMPRESA"];

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

function isValidPlan(value: unknown): value is SubscriptionPlan {
  return typeof value === "string" && VALID_PLANS.includes(value as SubscriptionPlan);
}

function resolveExpiresAt(daysToAdd: number): Date {
  const safeDays = Number.isFinite(daysToAdd) && daysToAdd > 0 ? daysToAdd : 30;
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + safeDays);
  return expiresAt;
}

export async function PATCH(req: NextRequest, context: RouteContext) {
  try {
    const auth = await requireAuth(req);

    if (auth instanceof NextResponse) {
      return auth;
    }

    if (!auth || auth.user.role !== "admin") {
      return forbidden();
    }

    const { id } = await context.params;
    const body = await req.json();

    const plan = body?.plan;
    const daysToAdd = Number(body?.daysToAdd ?? 30);

    if (!id) {
      return NextResponse.json(
        {
          ok: false,
          message: "ID de usuario requerido.",
          data: null,
        },
        { status: 400 },
      );
    }

    if (!isValidPlan(plan)) {
      return NextResponse.json(
        {
          ok: false,
          message: "Plan inválido.",
          data: null,
        },
        { status: 400 },
      );
    }

    const targetUser = await getUserById(id);

    if (!targetUser) {
      return NextResponse.json(
        {
          ok: false,
          message: "Usuario no encontrado.",
          data: null,
        },
        { status: 404 },
      );
    }

    if (targetUser.role === "admin") {
      return NextResponse.json(
        {
          ok: false,
          message: "No se puede modificar la suscripción de un administrador.",
          data: null,
        },
        { status: 400 },
      );
    }

    const updatedUser = await updateUserSubscription({
      userId: id,
      plan,
      expiresAt: resolveExpiresAt(daysToAdd),
    });

    if (!updatedUser) {
      return NextResponse.json(
        {
          ok: false,
          message: "No se pudo actualizar la suscripción.",
          data: null,
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      ok: true,
      message: "Suscripción actualizada correctamente.",
      data: sanitizeUser(updatedUser),
    });
  } catch (error) {
    console.error("[api/admin/users/[id]/subscription][PATCH]", error);

    return NextResponse.json(
      {
        ok: false,
        message: "Error al actualizar suscripción.",
        data: null,
      },
      { status: 500 },
    );
  }
}