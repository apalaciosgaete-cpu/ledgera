import { httpClient } from "@/shared/http/httpClient";

export type BillingCheckoutPlan = "PERSONAL" | "PROFESIONAL";
export type BillingCheckoutProvider = "stripe" | "flow" | "mercadopago";
export type BillingCheckoutInterval = "monthly" | "annual";

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
  billing: BillingCheckoutInterval = "monthly",
): Promise<string> {
  const response = await httpClient<BillingCheckoutResponse>(
    "/api/billing/checkout",
    {
      method: "POST",
      auth: true,
      body: {
        plan,
        provider,
        interval: billing === "annual" ? "ANNUAL" : "MONTHLY",
      },
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

export async function createBillingChangePlan(
  plan: BillingCheckoutPlan | "BASICO",
  provider: BillingCheckoutProvider = "flow",
  billing: BillingCheckoutInterval = "monthly",
): Promise<string> {
  if (plan !== "BASICO") {
    return createBillingCheckout(plan, provider, billing);
  }

  const response = await httpClient<{
    ok: boolean;
    message?: string;
    data?: {
      type?: "immediate" | "payment_required";
      paymentId?: string;
      checkoutId?: string | null;
      url?: string | null;
      plan?: string;
    };
  }>("/api/billing/change-plan", {
    method: "POST",
    auth: true,
    body: { plan, provider },
  });

  if (response.data?.type === "immediate") {
    return "/configuracion/facturacion?checkout=success";
  }

  const paymentUrl = response.data?.url;

  if (!paymentUrl) {
    throw new Error(
      response.message ?? "No fue posible obtener la URL de pago.",
    );
  }

  return paymentUrl;
}

export async function createBillingReactivate(
  provider: BillingCheckoutProvider = "flow",
): Promise<string> {
  const response = await httpClient<{
    ok: boolean;
    message?: string;
    data?: {
      status?: string;
      paymentId?: string;
      url?: string | null;
    };
  }>("/api/billing/reactivate", {
    method: "POST",
    auth: true,
    body: { provider },
  });

  const paymentUrl = response.data?.url;

  if (response.data?.status === "reactivated") {
    return "/configuracion/facturacion?checkout=success";
  }

  if (!paymentUrl) {
    throw new Error(
      response.message ?? "No fue posible preparar la reactivación.",
    );
  }

  return paymentUrl;
}

export async function confirmBillingPayment(paymentId: string): Promise<void> {
  await httpClient<{ ok: boolean; message?: string }>(
    `/api/billing/payments/${encodeURIComponent(paymentId)}/confirm`,
    {
      method: "POST",
      auth: true,
    },
  );
}
