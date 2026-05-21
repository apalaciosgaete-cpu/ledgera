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

function getKhipuSecret(): string {
  const secret = process.env.KHIPU_SECRET?.trim();

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

function buildKhipuAuthHeader(
  method: string,
  url: string,
  params: URLSearchParams,
  receiverId: string,
  secret: string,
): string {
  const sortedEntries = [...params.entries()].sort(([a], [b]) =>
    a.localeCompare(b),
  );
  // URLSearchParams.toString() encodes spaces as +, matching Python urllib.parse.urlencode
  const queryString = new URLSearchParams(sortedEntries).toString();

  const toSign = [
    method.toUpperCase(),
    encodeURIComponent(url),
    encodeURIComponent(queryString),
  ].join("&");

  console.log("[khipu:auth] method     =", method.toUpperCase());
  console.log("[khipu:auth] url        =", url);
  console.log("[khipu:auth] queryString=", queryString);
  console.log("[khipu:auth] toSign     =", toSign);

  const signature = crypto
    .createHmac("sha256", secret)
    .update(toSign)
    .digest("hex");

  console.log("[khipu:auth] signature  =", signature);

  return `${receiverId}:${signature}`;
}

async function khipuRequest<T>(
  path: string,
  method: string,
  params: URLSearchParams,
  receiverId: string,
  secret: string,
): Promise<T> {
  const url = `${KHIPU_BASE}${path}`;
  const isGet = method.toUpperCase() === "GET";

  const authorization = buildKhipuAuthHeader(
    method,
    url,
    params,
    receiverId,
    secret,
  );

  const response = await fetch(url, {
    method,
    headers: {
      Authorization: authorization,
      ...(!isGet && { "Content-Type": "application/x-www-form-urlencoded" }),
    },
    body: isGet ? undefined : params,
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

  return khipuRequest<KhipuCreatePaymentResponse>(
    "/payments",
    "POST",
    body,
    receiverId,
    secret,
  );
}

export async function getKhipuPayment(
  paymentId: string,
): Promise<KhipuPaymentResponse> {
  const receiverId = getKhipuReceiverId();
  const secret = getKhipuSecret();

  return khipuRequest<KhipuPaymentResponse>(
    `/payments/${encodeURIComponent(paymentId)}`,
    "GET",
    new URLSearchParams(),
    receiverId,
    secret,
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

  if (expected.length !== input.notificationToken.length) {
    return false;
  }

  return crypto.timingSafeEqual(
    Buffer.from(expected),
    Buffer.from(input.notificationToken),
  );
}
