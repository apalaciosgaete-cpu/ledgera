import { httpClient } from "@/shared/http/httpClient";

export type BillingStatusResponse = {
  ok: boolean;
  message?: string;
  data?: {
    user: {
      id: string;
      email: string;
      role: string;
      status?: string;
      subscriptionPlan?: string;
      subscriptionExpiresAt?: string | Date | null;
    };
    subscription: {
      id: string;
      provider: string;
      plan: string;
      status: string;
      amount: number;
      currency: string;
      currentPeriodStart: string | Date | null;
      currentPeriodEnd: string | Date | null;
    } | null;
    latestPayment: {
      id: string;
      provider: string;
      status: string;
      amount: number;
      currency: string;
      description: string;
      paidAt: string | Date | null;
      failedAt: string | Date | null;
      createdAt: string | Date;
    } | null;
    isActive: boolean;
  };
};

export async function getBillingStatus() {
  const response = await httpClient<BillingStatusResponse>(
    "/api/billing/status",
    {
      method: "GET",
      auth: true,
    },
  );

  if (!response.data) {
    throw new Error(
      response.message ??
        "No fue posible obtener el estado de billing.",
    );
  }

  return response.data;
}