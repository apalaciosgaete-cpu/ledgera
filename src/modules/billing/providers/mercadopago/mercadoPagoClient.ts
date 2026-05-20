type MercadoPagoPreferenceItem = {
  id: string;
  title: string;
  description?: string;
  quantity: number;
  unit_price: number;
  currency_id: string;
};

type MercadoPagoPreferenceInput = {
  externalReference: string;
  notificationUrl: string;
  successUrl: string;
  failureUrl: string;
  pendingUrl: string;
  payerEmail: string;
  items: MercadoPagoPreferenceItem[];
  metadata?: Record<string, unknown>;
};

type MercadoPagoPreferenceResponse = {
  id: string;
  init_point?: string;
  sandbox_init_point?: string;
};

export type MercadoPagoPaymentResponse = {
  id: number | string;
  status?: string;
  status_detail?: string;
  external_reference?: string;
  transaction_amount?: number;
  currency_id?: string;
  metadata?: Record<string, unknown>;
};

function getMercadoPagoAccessToken(): string {
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN;

  if (!token) {
    throw new Error("MERCADOPAGO_ACCESS_TOKEN no está configurado.");
  }

  return token;
}

async function mercadoPagoRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getMercadoPagoAccessToken();

  const response = await fetch(`https://api.mercadopago.com${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
    cache: "no-store",
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      `Mercado Pago API error ${response.status}: ${JSON.stringify(payload)}`,
    );
  }

  return payload as T;
}

export async function createMercadoPagoPreference(
  input: MercadoPagoPreferenceInput,
): Promise<MercadoPagoPreferenceResponse> {
  return mercadoPagoRequest<MercadoPagoPreferenceResponse>("/checkout/preferences", {
    method: "POST",
    body: JSON.stringify({
      external_reference: input.externalReference,
      notification_url: input.notificationUrl,
      back_urls: {
        success: input.successUrl,
        failure: input.failureUrl,
        pending: input.pendingUrl,
      },
      auto_return: "approved",
      payer: {
        email: input.payerEmail,
      },
      items: input.items.map((item) => ({
        id: item.id,
        title: item.title,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        currency_id: item.currency_id,
      })),
      metadata: input.metadata ?? {},
    }),
  });
}

export async function getMercadoPagoPayment(
  paymentId: string,
): Promise<MercadoPagoPaymentResponse> {
  return mercadoPagoRequest<MercadoPagoPaymentResponse>(
    `/v1/payments/${encodeURIComponent(paymentId)}`,
    {
      method: "GET",
    },
  );
}