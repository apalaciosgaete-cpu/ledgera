// src/app/api/billing/checkout/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/modules/identity/application/sessionToken";
import { prisma } from "@/lib/prisma";
import {
  CHECKOUT_PLAN_CONFIG,
  buildCheckoutReturnUrl,
  normalizeCheckoutPlan,
  resolveBillingProvider,
} from "@/modules/billing/domain/checkout";

export async function POST(request: NextRequest) {
  try {
    const auth = await getSessionFromRequest(request);

    if (!auth) {
      return NextResponse.json(
        { ok: false, message: "No autorizado.", data: null },
        { status: 401 },
      );
    }

    const body = (await request.json()) as {
      plan?: string;
      provider?: string;
    };

    const plan = normalizeCheckoutPlan(body.plan);

    if (!plan) {
      return NextResponse.json(
        { ok: false, message: "Plan inválido.", data: null },
        { status: 400 },
      );
    }

    const provider = resolveBillingProvider(body.provider);
    const config = CHECKOUT_PLAN_CONFIG[plan];
    const origin = request.nextUrl.origin;

    console.info("[commercial]", {
      event: "upgrade_started",
      userId: auth.user.id,
      plan,
      provider,
      source: "billing_checkout",
      occurredAt: new Date().toISOString(),
    });

    const payment = await prisma.billingPayment.create({
      data: {
        userId: auth.user.id,
        provider,
        status: "PENDING",
        amount: config.amount,
        currency: config.currency,
        description: `Suscripción ${config.label}`,
        metadata: JSON.stringify({
          checkoutVersion: "4.2.09",
          event: "upgrade_started",
          plan,
          provider,
          targetSubscriptionPlan: config.targetSubscriptionPlan,
          interval: config.interval,
        }),
      },
    });

    // CAPA 4.2.09: esta URL conserva el flujo actual y deja listo el contrato
    // para sustituirla por Stripe Checkout, Flow o MercadoPago sin cambiar la UX.
    const checkoutUrl = buildCheckoutReturnUrl({
      origin,
      paymentId: payment.id,
      status: "pending",
    });

    return NextResponse.json({
      ok: true,
      message: "Checkout iniciado.",
      data: {
        paymentId: payment.id,
        checkoutId: payment.checkoutId,
        url: checkoutUrl,
      },
    });
  } catch (error) {
    console.error("[billing/checkout POST]", error);

    return NextResponse.json(
      { ok: false, message: "No fue posible iniciar el checkout.", data: null },
      { status: 500 },
    );
  }
}
