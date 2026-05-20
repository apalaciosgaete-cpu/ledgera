import { NextRequest, NextResponse } from "next/server";

import type { BillingPaymentStatus } from "@/modules/billing/domain/billing";
import { activateSubscriptionFromPayment } from "@/modules/billing/application/activateSubscription";
import {
  createBillingWebhookEvent,
  getBillingPaymentByCheckoutId,
  updateBillingWebhookEvent,
} from "@/modules/billing/infrastructure/billingRepository";
import {
  getKhipuPayment,
  verifyKhipuNotificationToken,
} from "@/modules/billing/providers/khipu/khipuClient";

type KhipuWebhookPayload = {
  payment_id?: string;
  notification_token?: string;
  api_version?: string;
};

function mapKhipuStatus(status?: string): BillingPaymentStatus {
  switch (status) {
    case "done":
    case "verifying":
      return "APPROVED";

    case "rejected_by_payer":
    case "rejected_by_receiver":
    case "error":
      return "REJECTED";

    case "cancelled":
    case "canceled":
      return "CANCELED";

    case "pending":
    default:
      return "PENDING";
  }
}

async function readWebhookPayload(
  request: NextRequest,
): Promise<KhipuWebhookPayload> {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    return (await request.json().catch(() => ({}))) as KhipuWebhookPayload;
  }

  const form = await request.formData().catch(() => null);

  if (!form) {
    return {};
  }

  return {
    payment_id: String(form.get("payment_id") ?? ""),
    notification_token: String(form.get("notification_token") ?? ""),
    api_version: String(form.get("api_version") ?? ""),
  };
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    message: "Khipu webhook activo.",
  });
}

export async function POST(request: NextRequest) {
  let webhookEventId: string | null = null;

  try {
    const payload = await readWebhookPayload(request);
    const providerPaymentId = payload.payment_id ?? null;

    const webhookEvent = await createBillingWebhookEvent({
      provider: "KHIPU",
      providerEventId: providerPaymentId,
      eventType: "payment.notification",
      status: "RECEIVED",
      payload: JSON.stringify(payload),
    });

    webhookEventId = webhookEvent.id;

    if (!providerPaymentId) {
      await updateBillingWebhookEvent({
        id: webhookEvent.id,
        status: "IGNORED",
        processedAt: new Date(),
        errorMessage: "Webhook Khipu sin payment_id.",
      });

      return NextResponse.json({
        ok: true,
        message: "Webhook ignorado: sin payment_id.",
      });
    }

    const tokenIsValid = verifyKhipuNotificationToken({
      paymentId: providerPaymentId,
      notificationToken: payload.notification_token,
    });

    if (!tokenIsValid) {
      await updateBillingWebhookEvent({
        id: webhookEvent.id,
        status: "FAILED",
        processedAt: new Date(),
        errorMessage: "notification_token inválido.",
      });

      return NextResponse.json(
        {
          ok: false,
          message: "notification_token inválido.",
        },
        { status: 401 },
      );
    }

    const khipuPayment = await getKhipuPayment(providerPaymentId);

    const localPaymentId =
      khipuPayment.transaction_id ??
      (
        await getBillingPaymentByCheckoutId({
          provider: "KHIPU",
          checkoutId: providerPaymentId,
        })
      )?.id;

    if (!localPaymentId) {
      await updateBillingWebhookEvent({
        id: webhookEvent.id,
        status: "IGNORED",
        processedAt: new Date(),
        errorMessage: "No se encontró pago local asociado.",
      });

      return NextResponse.json({
        ok: true,
        message: "Webhook ignorado: sin pago local asociado.",
      });
    }

    await activateSubscriptionFromPayment({
      paymentId: localPaymentId,
      providerPaymentId,
      status: mapKhipuStatus(khipuPayment.status),
      metadata: {
        provider: "KHIPU",
        khipuPayment,
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
      message: "Webhook Khipu procesado correctamente.",
    });
  } catch (error) {
    console.error("[billing/khipu/webhook]", error);

    if (webhookEventId) {
      await updateBillingWebhookEvent({
        id: webhookEventId,
        status: "FAILED",
        processedAt: new Date(),
        errorMessage:
          error instanceof Error
            ? error.message
            : "Error desconocido procesando webhook Khipu.",
      });
    }

    return NextResponse.json(
      {
        ok: false,
        message: "No fue posible procesar webhook Khipu.",
      },
      { status: 500 },
    );
  }
}
