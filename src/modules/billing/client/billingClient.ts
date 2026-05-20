import { httpClient } from "@/shared/http/httpClient";

export type BillingProvider = "MERCADOPAGO" | "KHIPU";

export type BillingCheckoutPlan = "PROFESIONAL" | "EMPRESA";

type BillingCheckoutResponse = {
  ok: boolean;
  message?: string;
  data?: {
    provider: BillingProvider;
    paymentId: string;
    providerPaymentId?: string | null;
    checkoutId?: string | null;
    url?: string | null;
  };
};

export async function createBillingCheckout(input: {
  provider: BillingProvider;
  plan: BillingCheckoutPlan;
}): Promise<string> {
  const endpoint =
    input.provider === "MERCADOPAGO"
      ? "/api/billing/mercadopago/checkout"
      : "/api/billing/khipu/payment";

  const response = await httpClient<BillingCheckoutResponse>(endpoint, {
    method: "POST",
    auth: true,
    body: {
      plan: input.plan,
    },
  });

  const paymentUrl = response.data?.url;

  if (!paymentUrl) {
    throw new Error(
      response.message ?? "No fue posible obtener la URL de pago.",
    );
  }

  return paymentUrl;
}