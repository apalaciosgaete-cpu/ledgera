// Force dynamic rendering because routes use request.headers/cookies
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/modules/identity/application/sessionToken";
import {
  buildCheckoutReturnUrl,
  getCheckoutPlanConfig,
  normalizeBillingInterval,
  normalizeCheckoutPlan,
  resolveBillingProvider,
} from "@/modules/billing/domain/checkout";
import {
  BILLING_UNAVAILABLE_MESSAGE,
  isLiveBillingEnabled,
} from "@/modules/billing/domain/billingAvailability";
import { createExternalGatewayCheckout } from "@/modules/billing/infrastructure/externalGateway";

export async function POST(request: NextRequest) {
  try {
    if (!isLiveBillingEnabled()) {
      return NextResponse.json(
        { ok: false, message: BILLING_UNAVAILABLE_MESSAGE, data: null },
        { status: 503 },
      );
    }

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
      interval?: string;
    };

    const plan = normalizeCheckoutPlan(body.plan);

    if (!plan) {
      return NextResponse.json(
        { ok: false, message: "Plan inválido.", data: null },
        { status: 400 },
      );
    }

    const interval = normalizeBillingInterval(body.interval);
    const provider = resolveBillingProvider(
      process.env.BILLING_PROVIDER ?? body.provider,
    );
    const config = getCheckoutPlanConfig(plan, interval);
    const origin = request.nextUrl.origin;

    console.info("[commercial]", {
      event: "upgrade_started",
      userId: auth.user.id,
      plan,
      interval,
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
        description: `Suscripción ${config.label} ${interval === "ANNUAL" ? "anual" : "mensual"}`,
        metadata: JSON.stringify({
          checkoutVersion: "5.0.0",
          event: "upgrade_started",
          plan,
          provider,
          targetSubscriptionPlan: config.targetSubscriptionPlan,
          interval,
          amount: config.amount,
          netAmount: config.netAmount,
          taxAmount: config.taxAmount,
        }),
      },
    });

    const successUrl = buildCheckoutReturnUrl({
      origin,
      paymentId: payment.id,
      status: "success",
    });
    const cancelUrl = buildCheckoutReturnUrl({
      origin,
      paymentId: payment.id,
      status: "error",
    });
    const webhookUrl = new URL("/api/billing/webhook", origin);
    webhookUrl.searchParams.set(
      "token",
      process.env.BILLING_WEBHOOK_SECRET ?? "",
    );

    try {
      const gateway = await createExternalGatewayCheckout({
        provider,
        paymentId: payment.id,
        plan,
        interval,
        amount: config.amount,
        netAmount: config.netAmount,
        taxAmount: config.taxAmount,
        currency: config.currency,
        description: payment.description,
        customer: {
          id: auth.user.id,
          email: auth.user.email,
        },
        successUrl,
        cancelUrl,
        webhookUrl: webhookUrl.toString(),
      });

      const updatedPayment = await prisma.billingPayment.update({
        where: { id: payment.id },
        data: {
          checkoutId: gateway.checkoutId,
          providerPaymentId: gateway.providerPaymentId,
          paymentUrl: gateway.paymentUrl,
          metadata: JSON.stringify({
            previousMetadata: payment.metadata,
            checkoutVersion: "5.0.0",
            event: "gateway_checkout_created",
            plan,
            provider,
            targetSubscriptionPlan: config.targetSubscriptionPlan,
            interval,
            gatewayResponse: gateway.raw,
          }),
        },
      });

      return NextResponse.json({
        ok: true,
        message: "Checkout externo iniciado.",
        data: {
          paymentId: updatedPayment.id,
          checkoutId: updatedPayment.checkoutId,
          url: gateway.paymentUrl,
        },
      });
    } catch (gatewayError) {
      await prisma.billingPayment.update({
        where: { id: payment.id },
        data: {
          status: "FAILED",
          failedAt: new Date(),
          metadata: JSON.stringify({
            previousMetadata: payment.metadata,
            checkoutVersion: "5.0.0",
            event: "gateway_checkout_failed",
            plan,
            provider,
            interval,
            error:
              gatewayError instanceof Error
                ? gatewayError.message
                : "Error inesperado en la pasarela externa.",
          }),
        },
      });

      throw gatewayError;
    }
  } catch (error) {
    console.error("[billing/checkout POST]", error);

    const message =
      error instanceof Error
        ? error.message
        : "No fue posible iniciar el checkout.";

    return NextResponse.json(
      { ok: false, message, data: null },
      { status: 500 },
    );
  }
}
