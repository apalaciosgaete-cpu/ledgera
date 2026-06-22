// src/app/api/billing/payments/[id]/confirm/route.ts
// CAPA 4.3.01 — Confirmación simulada de pago (placeholder / testing).
//
// Permite aprobar un pago PENDING sin integrar una pasarela real. Útil para
// tests de regresión, entornos locales y demos de cierre de 4.3.01 antes de
// la integración real con Stripe/Flow/MercadoPago (4.5.03).
//
// En producción este endpoint debe reemplazarse por webhooks firmados del
// proveedor de pagos. Mientras tanto requiere sesión autenticada y solo
// permite confirmar pagos propios.

import { NextRequest, NextResponse } from "next/server";

import { getSessionFromRequest } from "@/modules/identity/application/sessionToken";
import { activateSubscriptionFromPayment } from "@/modules/billing/application/activateSubscription";
import { getBillingPaymentById } from "@/modules/billing/infrastructure/billingRepository";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
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
      message: "Pago confirmado y suscripción activada.",
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
