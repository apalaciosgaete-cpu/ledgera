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

function getKhipuReceiverId(): string {
  const receiverId = process.env.KHIPU_RECEIVER_ID;

  if (!receiverId) {
    throw new Error("KHIPU_RECEIVER_ID no está configurado.");
  }

  return receiverId;
}

function getKhipuSecret(): string {
  const secret = process.env.KHIPU_SECRET;

  if (!secret) {
    throw new Error("KHIPU_SECRET no está configurado.");
  }

  return secret;
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
  const response = await fetch(`https://khipu.com/api/2.0${path}`, {
    ...options,
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
  const secret = getKhipuSecret();

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
      Authorization: `Basic ${Buffer.from(`${receiverId}:${secret}`).toString(
        "base64",
      )}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });
}

export async function getKhipuPayment(
  paymentId: string,
): Promise<KhipuPaymentResponse> {
  const receiverId = getKhipuReceiverId();
  const secret = getKhipuSecret();

  return khipuRequest<KhipuPaymentResponse>(
    `/payments/${encodeURIComponent(paymentId)}`,
    {
      method: "GET",
      headers: {
        Authorization: `Basic ${Buffer.from(`${receiverId}:${secret}`).toString(
          "base64",
        )}`,
      },
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

  const secret = getKhipuSecret();

  const expected = crypto
    .createHmac("sha256", secret)
    .update(input.paymentId)
    .digest("hex");

  return crypto.timingSafeEqual(
    Buffer.from(expected),
    Buffer.from(input.notificationToken),
  );
}