import { NextRequest, NextResponse } from "next/server";

import { getSessionFromRequest } from "@/modules/identity/application/sessionToken";
import { upsertBillingCustomer, updateBillingPayment } from "@/modules/billing/infrastructure/billingRepository";
import { createPendingPayment } from "@/modules/billing/application/createPendingPayment";
import {
  assertPaidBillingPlan,
  isValidBillingPlan,
} from "@/modules/billing/application/billingPlans";
import { createMercadoPagoPreference } from "@/modules/billing/providers/mercadopago/mercadoPagoClient";

type CheckoutRequestBody = {
  plan?: unknown;
};

function resolveAppUrl(request: NextRequest): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? request.nextUrl.origin;
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getSessionFromRequest(request);

    if (!auth) {
      return NextResponse.json(
        {
          ok: false,
          message: "No autorizado.",
          data: null,
        },
        { status: 401 },
      );
    }

    const body = (await request.json()) as CheckoutRequestBody;
    const plan = body.plan;

    if (!isValidBillingPlan(plan)) {
      return NextResponse.json(
        {
          ok: false,
          message: "Plan inválido.",
          data: null,
        },
        { status: 400 },
      );
    }

    const planConfig = assertPaidBillingPlan(plan);
    const appUrl = resolveAppUrl(request);

    await upsertBillingCustomer({
      userId: auth.user.id,
      provider: "MERCADOPAGO",
      providerCustomerId: null,
      email: auth.user.email,
      fullName: null,
      metadata: JSON.stringify({
        source: "mercadopago.checkout",
      }),
    });

    const pendingPayment = await createPendingPayment({
      userId: auth.user.id,
      provider: "MERCADOPAGO",
      plan,
      description: `LEDGERA ${planConfig.name}`,
      metadata: {
        source: "mercadopago.checkout",
        plan,
      },
    });

    const preference = await createMercadoPagoPreference({
      externalReference: pendingPayment.id,
      payerEmail: auth.user.email,
      notificationUrl: `${appUrl}/api/billing/mercadopago/webhook`,
      successUrl: `${appUrl}/planes?payment=success`,
      failureUrl: `${appUrl}/planes?payment=failure`,
      pendingUrl: `${appUrl}/planes?payment=pending`,
      items: [
        {
          id: plan,
          title: `LEDGERA ${planConfig.name}`,
          description: planConfig.description,
          quantity: 1,
          unit_price: planConfig.amount,
          currency_id: planConfig.currency,
        },
      ],
      metadata: {
        userId: auth.user.id,
        paymentId: pendingPayment.id,
        plan,
        provider: "MERCADOPAGO",
      },
    });

    const paymentUrl =
      preference.init_point ?? preference.sandbox_init_point ?? null;

    await updateBillingPayment({
      id: pendingPayment.id,
      checkoutId: preference.id,
      paymentUrl,
      metadata: JSON.stringify({
        source: "mercadopago.checkout",
        preferenceId: preference.id,
        plan,
      }),
    });

    return NextResponse.json({
      ok: true,
      message: "Checkout Mercado Pago creado correctamente.",
      data: {
        provider: "MERCADOPAGO",
        paymentId: pendingPayment.id,
        checkoutId: preference.id,
        url: paymentUrl,
      },
    });
  } catch (error) {
    console.error("[billing/mercadopago/checkout]", error);

    return NextResponse.json(
      {
        ok: false,
        message: "No fue posible crear el checkout de Mercado Pago.",
        data: null,
      },
      { status: 500 },
    );
  }
}