import crypto from "crypto";

type KhipuCreatePaymentInput = {
  subject: string;
  amount: number;
  currency: string;
  transactionId: string;
  returnUrl: string;
  cancelUrl: string;
  notifyUrl: string;
  payerEmail?: string | null;
};

type KhipuCreatePaymentResponse = {
  payment_id?: string;
  payment_url?: string;
  simplified_transfer_url?: string;
  transfer_url?: string;
  app_url?: string;
  ready_for_terminal?: boolean;
};

export type KhipuPaymentResponse = {
  payment_id?: string;
  transaction_id?: string;
  status?: string;
  subject?: string;
  amount?: number;
  currency?: string;
  payer_email?: string;
  notification_token?: string;
};

const KHIPU_BASE = "https://khipu.com/api/2.0";

function getKhipuReceiverId(): string {
  const receiverId = process.env.KHIPU_RECEIVER_ID?.trim();

  if (!receiverId) {
    throw new Error("KHIPU_RECEIVER_ID no está configurado.");
  }

  return receiverId;
}

function getKhipuApiKey(): string {
  const apiKey = process.env.KHIPU_SECRET?.trim();

  if (!apiKey) {
    throw new Error("KHIPU_SECRET no está configurado.");
  }

  return apiKey;
}

function buildFormBody(
  input: Record<string, string | number | boolean | null | undefined>,
): URLSearchParams {
  const body = new URLSearchParams();

  Object.entries(input).forEach(([key, value]) => {
    if (value === null || value === undefined) return;

    body.set(key, String(value));
  });

  return body;
}

async function khipuRequest<T>(
  path: string,
  options: RequestInit,
): Promise<T> {
  const apiKey = getKhipuApiKey();

  const response = await fetch(`${KHIPU_BASE}${path}`, {
    ...options,
    headers: {
      "x-api-key": apiKey,
      ...(options.headers ?? {}),
    },
    cache: "no-store",
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      `Khipu API error ${response.status}: ${JSON.stringify(payload)}`,
    );
  }

  return payload as T;
}

export async function createKhipuPayment(
  input: KhipuCreatePaymentInput,
): Promise<KhipuCreatePaymentResponse> {
  const receiverId = getKhipuReceiverId();

  const body = buildFormBody({
    receiver_id: receiverId,
    subject: input.subject,
    amount: input.amount,
    currency: input.currency,
    transaction_id: input.transactionId,
    return_url: input.returnUrl,
    cancel_url: input.cancelUrl,
    notify_url: input.notifyUrl,
    payer_email: input.payerEmail,
  });

  return khipuRequest<KhipuCreatePaymentResponse>("/payments", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });
}

export async function getKhipuPayment(
  paymentId: string,
): Promise<KhipuPaymentResponse> {
  return khipuRequest<KhipuPaymentResponse>(
    `/payments/${encodeURIComponent(paymentId)}`,
    {
      method: "GET",
    },
  );
}

export function verifyKhipuNotificationToken(input: {
  paymentId?: string | null;
  notificationToken?: string | null;
}): boolean {
  if (!input.paymentId || !input.notificationToken) {
    return false;
  }

  const apiKey = getKhipuApiKey();

  const expected = crypto
    .createHmac("sha256", apiKey)
    .update(input.paymentId)
    .digest("hex");

  if (expected.length !== input.notificationToken.length) {
    return false;
  }

  return crypto.timingSafeEqual(
    Buffer.from(expected),
    Buffer.from(input.notificationToken),
  );
}