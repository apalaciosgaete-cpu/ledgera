// src/app/api/billing/checkout/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/modules/identity/application/sessionToken";
import { prisma } from "@/lib/prisma";

const VALID_PLANS = ["PERSONAL", "PROFESIONAL", "EMPRESA"] as const;
type CheckoutPlan = (typeof VALID_PLANS)[number];

function isValidPlan(plan: string): plan is CheckoutPlan {
  return VALID_PLANS.includes(plan as CheckoutPlan);
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getSessionFromRequest(request);

    if (!auth) {
      return NextResponse.json(
        { ok: false, message: "No autorizado.", data: null },
        { status: 401 },
      );
    }

    const body = (await request.json()) as { plan?: string };
    const plan = body.plan?.toUpperCase();

    if (!plan || !isValidPlan(plan)) {
      return NextResponse.json(
        { ok: false, message: "Plan inválido.", data: null },
        { status: 400 },
      );
    }

    console.info("[commercial]", {
      event: "upgrade_started",
      userId: auth.user.id,
      plan,
      source: "billing_checkout",
      occurredAt: new Date().toISOString(),
    });

    // Crear un registro de pago pendiente como preparación para integración real.
    const payment = await prisma.billingPayment.create({
      data: {
        userId: auth.user.id,
        provider: "placeholder",
        status: "PENDING",
        amount: 0,
        currency: "CLP",
        description: `Suscripción ${plan}`,
      },
    });

    // Al completarse la integración con Stripe / MercadoPago / Flow,
    // aquí se generará la URL real de checkout y se actualizará el payment.
    const placeholderUrl = `/configuracion/facturacion?payment=pending&paymentId=${payment.id}`;

    return NextResponse.json({
      ok: true,
      message: "Checkout preparado. Integración con proveedor de pago pendiente.",
      data: {
        paymentId: payment.id,
        checkoutId: null,
        url: placeholderUrl,
      },
    });
  } catch (error) {
    console.error("[billing/checkout POST]", error);

    return NextResponse.json(
      { ok: false, message: "No fue posible preparar el checkout.", data: null },
      { status: 500 },
    );
  }
}
