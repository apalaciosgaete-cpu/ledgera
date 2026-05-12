// src/app/api/admin/users/[id]/subscription/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/modules/identity/application/sessionToken";
import { updateUserSubscription } from "@/modules/identity/infrastructure/userRepository";
import type { SubscriptionPlan } from "@/modules/identity/domain/user";
import { PLAN_TO_ROLE } from "@/modules/identity/domain/user";

const VALID_PLANS: SubscriptionPlan[] = ["BASICO", "PROFESIONAL", "EMPRESA"];

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

  let body: { plan?: string; daysToAdd?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, message: "Body inválido" },
      { status: 400 },
    );
  }

  const { plan, daysToAdd = 30 } = body;

  if (!plan || !VALID_PLANS.includes(plan as SubscriptionPlan)) {
    return NextResponse.json(
      {
        ok: false,
        message: `Plan inválido. Valores permitidos: ${VALID_PLANS.join(", ")}`,
      },
      { status: 400 },
    );
  }

  if (typeof daysToAdd !== "number" || daysToAdd < 1 || daysToAdd > 365) {
    return NextResponse.json(
      { ok: false, message: "daysToAdd debe ser un número entre 1 y 365" },
      { status: 400 },
    );
  }

  try {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + daysToAdd);

    const updated = await updateUserSubscription({
      userId: id,
      plan:   plan as SubscriptionPlan,
      expiresAt,
    });

    if (!updated) {
      return NextResponse.json(
        { ok: false, message: "Usuario no encontrado" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      ok: true,
      message: `Suscripción actualizada. Plan: ${plan} → Rol: ${PLAN_TO_ROLE[plan as SubscriptionPlan]}`,
      data: {
        id:                    updated.id,
        email:                 updated.email,
        role:                  updated.role,
        subscriptionPlan:      updated.subscriptionPlan,
        subscriptionExpiresAt: updated.subscriptionExpiresAt,
      },
    });
  } catch (error) {
    console.error("[admin/users/subscription PATCH]", error);
    return NextResponse.json(
      { ok: false, message: "Error al actualizar suscripción" },
      { status: 500 },
    );
  }
}