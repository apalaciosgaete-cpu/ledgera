import { NextRequest, NextResponse } from "next/server";

import { activateSubscriptionFromPayment } from "@/modules/billing/application/activateSubscription";
import type { BillingPaymentStatus } from "@/modules/billing/domain/billing";
import {
  createBillingWebhookEvent,
  updateBillingWebhookEvent,
} from "@/modules/billing/infrastructure/billingRepository";
import { getMercadoPagoPayment } from "@/modules/billing/providers/mercadopago/mercadoPagoClient";

type MercadoPagoWebhookBody = {
  id?: string | number;
  type?: string;
  action?: string;
  topic?: string;
  data?: {
    id?: string | number;
  };
};

function resolvePaymentId(
  request: NextRequest,
  body: MercadoPagoWebhookBody,
): string | null {
  const queryPaymentId =
    request.nextUrl.searchParams.get("data.id") ??
    request.nextUrl.searchParams.get("id");

  const bodyPaymentId = body.data?.id ?? body.id;
  const paymentId = queryPaymentId ?? bodyPaymentId;

  if (!paymentId) {
    return null;
  }

  return String(paymentId);
}

function resolveEventType(body: MercadoPagoWebhookBody): string {
  return body.action ?? body.type ?? body.topic ?? "unknown";
}

function mapMercadoPagoStatus(status?: string): BillingPaymentStatus {
  switch (status) {
    case "approved":
      return "APPROVED";

    case "authorized":
      return "AUTHORIZED";

    case "rejected":
      return "REJECTED";

    case "cancelled":
    case "canceled":
      return "CANCELED";

    case "refunded":
      return "REFUNDED";

    case "pending":
    case "in_process":
    default:
      return "PENDING";
  }
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    message: "Mercado Pago webhook activo.",
  });
}

export async function POST(request: NextRequest) {
  let webhookEventId: string | null = null;

  try {
    const body =
      (await request.json().catch(() => ({}))) as MercadoPagoWebhookBody;

    const providerPaymentId = resolvePaymentId(request, body);
    const eventType = resolveEventType(body);

    const webhookEvent = await createBillingWebhookEvent({
      provider: "MERCADOPAGO",
      providerEventId: providerPaymentId,
      eventType,
      status: "RECEIVED",
      payload: JSON.stringify({
        query: Object.fromEntries(request.nextUrl.searchParams.entries()),
        body,
      }),
    });

    webhookEventId = webhookEvent.id;

    if (!providerPaymentId) {
      await updateBillingWebhookEvent({
        id: webhookEvent.id,
        status: "IGNORED",
        processedAt: new Date(),
        errorMessage: "Webhook sin payment id.",
      });

      return NextResponse.json({
        ok: true,
        message: "Webhook ignorado: sin payment id.",
      });
    }

    const mercadoPagoPayment = await getMercadoPagoPayment(providerPaymentId);
    const localPaymentId = mercadoPagoPayment.external_reference;

    if (!localPaymentId) {
      await updateBillingWebhookEvent({
        id: webhookEvent.id,
        status: "IGNORED",
        processedAt: new Date(),
        errorMessage: "Pago Mercado Pago sin external_reference.",
      });

      return NextResponse.json({
        ok: true,
        message: "Webhook ignorado: sin external_reference.",
      });
    }

    await activateSubscriptionFromPayment({
      paymentId: localPaymentId,
      providerPaymentId,
      status: mapMercadoPagoStatus(mercadoPagoPayment.status),
      metadata: {
        provider: "MERCADOPAGO",
        mercadoPagoPayment,
      },
    });

    await updateBillingWebhookEvent({
      id: webhookEvent.id,
      status: "PROCESSED",
      processedAt: new Date(),
      errorMessage: null,
    });

    return NextResponse.json({
      ok: true,
      message: "Webhook Mercado Pago procesado correctamente.",
    });
  } catch (error) {
    console.error("[billing/mercadopago/webhook]", error);

    if (webhookEventId) {
      await updateBillingWebhookEvent({
        id: webhookEventId,
        status: "FAILED",
        processedAt: new Date(),
        errorMessage:
          error instanceof Error
            ? error.message
            : "Error desconocido procesando webhook Mercado Pago.",
      });
    }

    return NextResponse.json(
      {
        ok: false,
        message: "No fue posible procesar webhook Mercado Pago.",
      },
      { status: 500 },
    );
  }
}
