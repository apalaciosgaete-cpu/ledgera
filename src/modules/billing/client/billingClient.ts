import { httpClient } from "@/shared/http/httpClient";

export type BillingCheckoutPlan = "PERSONAL" | "PROFESIONAL" | "EMPRESA";

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
): Promise<string> {
  const response = await httpClient<BillingCheckoutResponse>(
    "/api/billing/checkout",
    {
      method: "POST",
      auth: true,
      body: { plan },
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
