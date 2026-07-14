// src/app/api/billing/payments/[id]/confirm/route.ts
// Confirmación simulada disponible exclusivamente para desarrollo controlado.

import { NextRequest, NextResponse } from "next/server";

import { activateSubscriptionFromPayment } from "@/modules/billing/application/activateSubscription";
import { isPlaceholderBillingEnabled } from "@/modules/billing/domain/billingAvailability";
import { getBillingPaymentById } from "@/modules/billing/infrastructure/billingRepository";
import { getSessionFromRequest } from "@/modules/identity/application/sessionToken";

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    if (!isPlaceholderBillingEnabled()) {
      return NextResponse.json(
        {
          ok: false,
          message: "La confirmación simulada de pagos no está disponible.",
          data: null,
        },
        { status: 403 },
      );
    }

    const auth = await getSessionFromRequest(request);

    if (!auth) {
      return NextResponse.json(
        { ok: false, message: "No autorizado.", data: null },
        { status: 401 },
      );
    }

    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { ok: false, message: "ID de pago requerido.", data: null },
        { status: 400 },
      );
    }

    const payment = await getBillingPaymentById(id);

    if (!payment) {
      return NextResponse.json(
        { ok: false, message: "Pago no encontrado.", data: null },
        { status: 404 },
      );
    }

    if (payment.userId !== auth.user.id) {
      return NextResponse.json(
        { ok: false, message: "No autorizado.", data: null },
        { status: 403 },
      );
    }

    if (payment.status !== "PENDING") {
      return NextResponse.json(
        {
          ok: false,
          message: `El pago ya fue procesado (estado: ${payment.status}).`,
          data: null,
        },
        { status: 409 },
      );
    }

    console.info("[commercial]", {
      event: "payment_confirmed_placeholder",
      userId: auth.user.id,
      paymentId: payment.id,
      source: "billing_payment_confirm",
      occurredAt: new Date().toISOString(),
    });

    const updatedPayment = await activateSubscriptionFromPayment({
      paymentId: payment.id,
      status: "APPROVED",
      providerPaymentId: `placeholder-${Date.now()}`,
      metadata: {
        source: "billing_payment_confirm",
        confirmedBy: auth.user.id,
        provider: payment.provider,
      },
    });

    return NextResponse.json({
      ok: true,
      message: "Pago simulado confirmado y suscripción activada.",
      data: {
        paymentId: updatedPayment.id,
        status: updatedPayment.status,
      },
    });
  } catch (error) {
    console.error("[billing/payments/[id]/confirm POST]", error);

    const message =
      error instanceof Error ? error.message : "Error al confirmar el pago.";

    return NextResponse.json(
      { ok: false, message, data: null },
      { status: 500 },
    );
  }
}
