// src/app/api/billing/webhook/route.ts

import { timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";

import { requireEnv } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { processBillingWebhook } from "@/modules/billing/application/processBillingWebhook";
import {
  BILLING_UNAVAILABLE_MESSAGE,
  isLiveBillingEnabled,
} from "@/modules/billing/domain/billingAvailability";
import { normalizeBillingWebhookPayload } from "@/modules/billing/domain/webhook";

export const dynamic = "force-dynamic";

function resolveWebhookSecret() {
  return requireEnv("BILLING_WEBHOOK_SECRET");
}

function secretsMatch(received: string | null, expected: string) {
  if (!received) return false;

  const receivedBuffer = Buffer.from(received);
  const expectedBuffer = Buffer.from(expected);

  return (
    receivedBuffer.length === expectedBuffer.length &&
    timingSafeEqual(receivedBuffer, expectedBuffer)
  );
}

function isAuthorizedWebhook(request: NextRequest) {
  const expectedSecret = resolveWebhookSecret();
  const headerSecret = request.headers
    .get("x-ledgera-webhook-secret")
    ?.trim() ?? null;
  const querySecret = request.nextUrl.searchParams.get("token")?.trim() ?? null;

  return (
    secretsMatch(headerSecret, expectedSecret) ||
    secretsMatch(querySecret, expectedSecret)
  );
}

export async function POST(request: NextRequest) {
  let payload: unknown = null;

  try {
    if (!isLiveBillingEnabled()) {
      return NextResponse.json(
        { ok: false, message: BILLING_UNAVAILABLE_MESSAGE, data: null },
        { status: 503 },
      );
    }

    if (!isAuthorizedWebhook(request)) {
      return NextResponse.json(
        {
          ok: false,
          message: "Webhook no autorizado.",
          data: null,
        },
        { status: 401 },
      );
    }

    payload = await request.json();

    const normalized = normalizeBillingWebhookPayload(payload);

    if (!normalized) {
      await prisma.billingWebhookEvent.create({
        data: {
          provider: "unknown",
          providerEventId: null,
          eventType: "invalid_payload",
          status: "FAILED",
          payload: JSON.stringify(payload),
          errorMessage: "Payload de webhook inválido o evento no soportado.",
        },
      });

      return NextResponse.json(
        {
          ok: false,
          message: "Payload inválido o evento no soportado.",
          data: null,
        },
        { status: 400 },
      );
    }

    const existingEvent = normalized.providerEventId
      ? await prisma.billingWebhookEvent.findFirst({
          where: {
            provider: normalized.provider,
            providerEventId: normalized.providerEventId,
          },
        })
      : null;

    if (existingEvent?.status === "PROCESSED") {
      return NextResponse.json({
        ok: true,
        message: "Evento duplicado ya procesado.",
        data: {
          status: "duplicate",
          webhookEventId: existingEvent.id,
        },
      });
    }

    const webhookEvent =
      existingEvent ??
      (await prisma.billingWebhookEvent.create({
        data: {
          provider: normalized.provider,
          providerEventId: normalized.providerEventId,
          eventType: normalized.eventType,
          status: "RECEIVED",
          payload: JSON.stringify(payload),
        },
      }));

    const result = await processBillingWebhook(normalized);

    await prisma.billingWebhookEvent.update({
      where: { id: webhookEvent.id },
      data: {
        status: result.status === "ignored" ? "IGNORED" : "PROCESSED",
        processedAt: new Date(),
        errorMessage: result.status === "ignored" ? result.message : null,
      },
    });

    return NextResponse.json({
      ok: true,
      message: result.message,
      data: result,
    });
  } catch (error) {
    console.error("[billing/webhook POST]", error);

    try {
      await prisma.billingWebhookEvent.create({
        data: {
          provider: "unknown",
          providerEventId: null,
          eventType: "processing_error",
          status: "FAILED",
          payload: JSON.stringify(payload),
          errorMessage:
            error instanceof Error ? error.message : "Error inesperado.",
        },
      });
    } catch (logError) {
      console.error("[billing/webhook POST logError]", logError);
    }

    const missingConfig =
      error instanceof Error &&
      error.message.includes("BILLING_WEBHOOK_SECRET");

    return NextResponse.json(
      {
        ok: false,
        message: missingConfig
          ? "BILLING_WEBHOOK_SECRET no está configurado. Webhook bloqueado."
          : "No fue posible procesar el webhook.",
        data: null,
      },
      { status: 500 },
    );
  }
}
