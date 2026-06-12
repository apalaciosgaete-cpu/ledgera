import { httpClient } from "@/shared/http/httpClient";

export type BillingCheckoutPlan = "PERSONAL" | "PROFESIONAL" | "EMPRESA";
export type BillingCheckoutProvider = "stripe" | "flow" | "mercadopago";

type BillingCheckoutResponse = {
  ok: boolean;
  message?: string;
  data?: {
    paymentId: string;
    checkoutId?: string | null;
    url?: string | null;
  };
};

export async function createBillingCheckout(
  plan: BillingCheckoutPlan,
  provider: BillingCheckoutProvider = "flow",
): Promise<string> {
  const response = await httpClient<BillingCheckoutResponse>(
    "/api/billing/checkout",
    {
      method: "POST",
      auth: true,
      body: { plan, provider },
    },
  );

  const paymentUrl = response.data?.url;

  if (!paymentUrl) {
    throw new Error(
      response.message ?? "No fue posible obtener la URL de pago.",
    );
  }

  return paymentUrl;
}
