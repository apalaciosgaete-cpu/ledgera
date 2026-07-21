import { optionalEnv, requireEnv } from "@/lib/env";
import type {
  BillingInterval,
  BillingProvider,
} from "@/modules/billing/domain/checkout";

type ExternalGatewayCheckoutInput = {
  provider: BillingProvider;
  paymentId: string;
  plan: string;
  interval: BillingInterval;
  amount: number;
  netAmount: number;
  taxAmount: number;
  currency: "CLP";
  description: string;
  customer: {
    id: string;
    email: string;
  };
  successUrl: string;
  cancelUrl: string;
  webhookUrl: string;
};

export type ExternalGatewayCheckoutResult = {
  checkoutId: string | null;
  providerPaymentId: string | null;
  paymentUrl: string;
  raw: Record<string, unknown>;
};

function readString(
  payload: Record<string, unknown>,
  keys: string[],
): string | null {
  for (const key of keys) {
    const value = payload[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }

  return null;
}

function buildAuthorizationHeader(apiKey: string) {
  const scheme = optionalEnv("BILLING_GATEWAY_AUTH_SCHEME") ?? "Bearer";
  return scheme ? `${scheme} ${apiKey}` : apiKey;
}

export function isExternalGatewayConfigured() {
  return Boolean(
    optionalEnv("BILLING_GATEWAY_CHECKOUT_URL") &&
      optionalEnv("BILLING_GATEWAY_API_KEY") &&
      optionalEnv("BILLING_WEBHOOK_SECRET"),
  );
}

export async function createExternalGatewayCheckout(
  input: ExternalGatewayCheckoutInput,
): Promise<ExternalGatewayCheckoutResult> {
  const endpoint = requireEnv("BILLING_GATEWAY_CHECKOUT_URL");
  const apiKey = requireEnv("BILLING_GATEWAY_API_KEY");
  const webhookSecret = requireEnv("BILLING_WEBHOOK_SECRET");
  const authHeader = optionalEnv("BILLING_GATEWAY_AUTH_HEADER") ?? "authorization";

  const headers: Record<string, string> = {
    "content-type": "application/json",
    accept: "application/json",
    [authHeader]: buildAuthorizationHeader(apiKey),
  };

  const response = await fetch(endpoint, {
    method: "POST",
    headers,
    cache: "no-store",
    body: JSON.stringify({
      provider: input.provider,
      externalReference: input.paymentId,
      paymentId: input.paymentId,
      plan: input.plan,
      interval: input.interval,
      amount: input.amount,
      netAmount: input.netAmount,
      taxAmount: input.taxAmount,
      currency: input.currency,
      description: input.description,
      customer: input.customer,
      returnUrls: {
        success: input.successUrl,
        cancel: input.cancelUrl,
      },
      webhook: {
        url: input.webhookUrl,
        headers: {
          "x-ledgera-webhook-secret": webhookSecret,
        },
      },
      metadata: {
        ledgeraPaymentId: input.paymentId,
        plan: input.plan,
        interval: input.interval,
      },
    }),
  });

  const rawText = await response.text();
  let payload: Record<string, unknown> = {};

  if (rawText) {
    try {
      payload = JSON.parse(rawText) as Record<string, unknown>;
    } catch {
      payload = { rawText };
    }
  }

  if (!response.ok) {
    const gatewayMessage = readString(payload, ["message", "error", "detail"]);
    throw new Error(
      gatewayMessage ?? `La pasarela externa respondió con estado ${response.status}.`,
    );
  }

  const paymentUrl = readString(payload, [
    "paymentUrl",
    "checkoutUrl",
    "url",
    "redirectUrl",
    "initPoint",
    "init_point",
  ]);

  if (!paymentUrl) {
    throw new Error("La pasarela externa no devolvió una URL de pago válida.");
  }

  return {
    checkoutId: readString(payload, ["checkoutId", "sessionId", "id"]),
    providerPaymentId: readString(payload, [
      "providerPaymentId",
      "paymentId",
      "transactionId",
    ]),
    paymentUrl,
    raw: payload,
  };
}
