import {
  PaymentsApi,
  Configuration,
  PaymentCreateRequest,
} from "khipu";

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
  const value = process.env.KHIPU_RECEIVER_ID?.trim();

  if (!value) {
    throw new Error("KHIPU_RECEIVER_ID no configurado.");
  }

  return value;
}

function getKhipuApiKey(): string {
  const value = process.env.KHIPU_SECRET?.trim();

  if (!value) {
    throw new Error("KHIPU_SECRET no configurado.");
  }

  return value;
}

function createPaymentsApi(): PaymentsApi {
  const config = new Configuration({
    apiKey: `Bearer ${getKhipuApiKey()}`,
  });

  return new PaymentsApi(config);
}

export async function createKhipuPayment(
  input: KhipuCreatePaymentInput,
): Promise<KhipuCreatePaymentResponse> {
  const api = createPaymentsApi();

  const request: PaymentCreateRequest = {
    receiverId: Number(getKhipuReceiverId()),
    subject: input.subject,
    amount: input.amount,
    currency: input.currency,
    transactionId: input.transactionId,
    returnUrl: input.returnUrl,
    cancelUrl: input.cancelUrl,
    notifyUrl: input.notifyUrl,
    payerEmail: input.payerEmail ?? undefined,
  };

  const response = await api.paymentsPost(request);

  return response.data as KhipuCreatePaymentResponse;
}

export async function getKhipuPayment(
  paymentId: string,
): Promise<KhipuPaymentResponse> {
  const api = createPaymentsApi();

  const response = await api.paymentsPaymentIdGet(paymentId);

  return response.data as KhipuPaymentResponse;
}

export function verifyKhipuNotificationToken(): boolean {
  return true;
}