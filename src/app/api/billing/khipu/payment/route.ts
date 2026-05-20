import { NextRequest, NextResponse } from "next/server";

import { getSessionFromRequest } from "@/modules/identity/application/sessionToken";
import { upsertBillingCustomer, updateBillingPayment } from "@/modules/billing/infrastructure/billingRepository";
import { createPendingPayment } from "@/modules/billing/application/createPendingPayment";
import {
  assertPaidBillingPlan,
  isValidBillingPlan,
} from "@/modules/billing/application/billingPlans";
import { createKhipuPayment } from "@/modules/billing/providers/khipu/khipuClient";

type KhipuPaymentRequestBody = {
  plan?: unknown;
};

function resolveAppUrl(request: NextRequest): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? request.nextUrl.origin;
}

function resolveKhipuPaymentUrl(input: {
  payment_url?: string;
  simplified_transfer_url?: string;
  transfer_url?: string;
  app_url?: string;
}): string | null {
  return (
    input.payment_url ??
    input.simplified_transfer_url ??
    input.transfer_url ??
    input.app_url ??
    null
  );
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

    const body = (await request.json()) as KhipuPaymentRequestBody;
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
      provider: "KHIPU",
      providerCustomerId: null,
      email: auth.user.email,
      fullName: null,
      metadata: JSON.stringify({
        source: "khipu.payment",
      }),
    });

    const pendingPayment = await createPendingPayment({
      userId: auth.user.id,
      provider: "KHIPU",
      plan,
      description: `LEDGERA ${planConfig.name}`,
      metadata: {
        source: "khipu.payment",
        plan,
      },
    });

    const khipuPayment = await createKhipuPayment({
      subject: `LEDGERA ${planConfig.name}`,
      amount: planConfig.amount,
      currency: planConfig.currency,
      transactionId: pendingPayment.id,
      returnUrl: `${appUrl}/planes?payment=success`,
      cancelUrl: `${appUrl}/planes?payment=failure`,
      notifyUrl: `${appUrl}/api/billing/khipu/webhook`,
      payerEmail: auth.user.email,
    });

    const paymentUrl = resolveKhipuPaymentUrl(khipuPayment);

    await updateBillingPayment({
      id: pendingPayment.id,
      providerPaymentId: khipuPayment.payment_id ?? null,
      checkoutId: khipuPayment.payment_id ?? null,
      paymentUrl,
      metadata: JSON.stringify({
        source: "khipu.payment",
        khipuPayment,
        plan,
      }),
    });

    return NextResponse.json({
      ok: true,
      message: "Pago Khipu creado correctamente.",
      data: {
        provider: "KHIPU",
        paymentId: pendingPayment.id,
        providerPaymentId: khipuPayment.payment_id ?? null,
        url: paymentUrl,
      },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[billing/khipu/payment] ERROR:", msg);

    return NextResponse.json(
      {
        ok: false,
        message: msg || "No fue posible crear el pago Khipu.",
        data: null,
      },
      { status: 500 },
    );
  }
}
