import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import {
  buildCheckoutReturnUrl,
  resolveBillingProvider,
} from "@/modules/billing/domain/checkout";
import {
  BILLING_UNAVAILABLE_MESSAGE,
  isLiveBillingEnabled,
} from "@/modules/billing/domain/billingAvailability";
import { createExternalGatewayCheckout } from "@/modules/billing/infrastructure/externalGateway";
import {
  PROFESSIONAL_EXTRA_CLIENT_PRODUCT,
  professionalExtraClientPrice,
} from "@/modules/professional/domain/professionalSeatBilling";
import { enforceCsrfProtection } from "@/modules/security/application/csrfProtection";
import { requireFeatureAccess } from "@/modules/subscription/application/requireFeatureAccess";
import { Feature } from "@/modules/subscription/domain/planFeatures";
import { fail, serverError } from "@/shared/apiResponse";
import { requireAuth } from "@/shared";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const csrfResponse = enforceCsrfProtection(request);
  if (csrfResponse) return csrfResponse;

  if (!isLiveBillingEnabled()) {
    return fail(BILLING_UNAVAILABLE_MESSAGE, 503);
  }

  const auth = await requireAuth(request);
  if (!auth || auth instanceof NextResponse) return fail("No autorizado.", 401);

  const access = requireFeatureAccess(auth.user, Feature.EXPERT_MODE);
  if (!access.ok) return access.response;

  if (!auth.user.twoFactorEnabled && auth.user.role !== "admin") {
    return fail("Debes habilitar 2FA antes de contratar cupos adicionales.", 403, {
      code: "TWO_FACTOR_REQUIRED",
    });
  }

  try {
    const provider = resolveBillingProvider(process.env.BILLING_PROVIDER);
    const origin = request.nextUrl.origin;

    const payment = await prisma.billingPayment.create({
      data: {
        userId: auth.user.id,
        provider,
        status: "PENDING",
        amount: professionalExtraClientPrice.amount,
        currency: professionalExtraClientPrice.currency,
        description: professionalExtraClientPrice.label,
        metadata: JSON.stringify({
          checkoutVersion: "5.1.0",
          event: "professional_extra_client_started",
          product: PROFESSIONAL_EXTRA_CLIENT_PRODUCT,
          quantity: 1,
          interval: professionalExtraClientPrice.interval,
          amount: professionalExtraClientPrice.amount,
          netAmount: professionalExtraClientPrice.netAmount,
          taxAmount: professionalExtraClientPrice.taxAmount,
        }),
      },
    });

    const successUrl = new URL(
      buildCheckoutReturnUrl({
        origin,
        paymentId: payment.id,
        status: "success",
      }),
    );
    successUrl.searchParams.set("product", PROFESSIONAL_EXTRA_CLIENT_PRODUCT);

    const cancelUrl = new URL(
      buildCheckoutReturnUrl({
        origin,
        paymentId: payment.id,
        status: "error",
      }),
    );
    cancelUrl.searchParams.set("product", PROFESSIONAL_EXTRA_CLIENT_PRODUCT);

    const webhookUrl = new URL("/api/billing/webhook", origin);
    webhookUrl.searchParams.set(
      "token",
      process.env.BILLING_WEBHOOK_SECRET ?? "",
    );

    try {
      const gateway = await createExternalGatewayCheckout({
        provider,
        paymentId: payment.id,
        plan: PROFESSIONAL_EXTRA_CLIENT_PRODUCT,
        interval: professionalExtraClientPrice.interval,
        amount: professionalExtraClientPrice.amount,
        netAmount: professionalExtraClientPrice.netAmount,
        taxAmount: professionalExtraClientPrice.taxAmount,
        currency: professionalExtraClientPrice.currency,
        description: payment.description,
        customer: {
          id: auth.user.id,
          email: auth.user.email,
        },
        successUrl: successUrl.toString(),
        cancelUrl: cancelUrl.toString(),
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
            checkoutVersion: "5.1.0",
            event: "professional_extra_client_gateway_created",
            product: PROFESSIONAL_EXTRA_CLIENT_PRODUCT,
            quantity: 1,
            interval: professionalExtraClientPrice.interval,
            gatewayResponse: gateway.raw,
          }),
        },
      });

      return NextResponse.json({
        ok: true,
        message: "Checkout para cliente adicional iniciado.",
        data: {
          paymentId: updatedPayment.id,
          checkoutId: updatedPayment.checkoutId,
          url: gateway.paymentUrl,
          price: professionalExtraClientPrice,
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
            checkoutVersion: "5.1.0",
            event: "professional_extra_client_gateway_failed",
            product: PROFESSIONAL_EXTRA_CLIENT_PRODUCT,
            error: gatewayError instanceof Error
              ? gatewayError.message
              : "Error inesperado en la pasarela externa.",
          }),
        },
      });

      throw gatewayError;
    }
  } catch (error) {
    return serverError(error);
  }
}
