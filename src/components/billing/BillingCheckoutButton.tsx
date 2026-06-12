"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/modules/identity/client/authContext";
import {
  createBillingCheckout,
  createBillingChangePlan,
  type BillingCheckoutPlan,
  type BillingCheckoutProvider,
} from "@/modules/billing/client/billingClient";
import { isHttpClientError } from "@/shared/http/httpClient";

type BillingAction = "checkout" | "change-plan";

type BillingCheckoutButtonProps = {
  plan: BillingCheckoutPlan;
  children: React.ReactNode;
  disabled?: boolean;
  provider?: BillingCheckoutProvider;
  action?: BillingAction;
  autoConfirm?: boolean;
  billing?: "monthly" | "annual";
  style?: React.CSSProperties;
};

function resolveErrorMessage(error: unknown): string {
  if (isHttpClientError(error)) {
    if (error.status === 401) {
      return "Debes iniciar sesión para continuar con el pago.";
    }

    if (error.status === 429 && error.retryAfterSeconds) {
      return `Demasiados intentos. Intenta nuevamente en ${error.retryAfterSeconds} segundos.`;
    }

    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "No fue posible iniciar el pago.";
}

export function BillingCheckoutButton({
  plan,
  children,
  disabled = false,
  provider = "flow",
  action = "checkout",
  autoConfirm = false,
  billing = "monthly",
  style,
}: BillingCheckoutButtonProps) {
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleClick() {
    setErrorMessage(null);
    setSuccess(false);

    if (!isAuthenticated) {
      sessionStorage.setItem(
        "pendingCheckout",
        JSON.stringify({
          plan,
          billing,
          provider,
          action,
          source: "public_plan_selection",
        }),
      );

      const params = new URLSearchParams({
        plan,
        billing,
        intent: action,
        provider,
      });

      router.push(`/register?${params.toString()}`);

      return;
    }

    setLoading(true);

    try {
      const url =
        action === "change-plan"
          ? await createBillingChangePlan(plan, provider)
          : await createBillingCheckout(plan, provider);

      setSuccess(true);

      if (autoConfirm && url.includes("paymentId=")) {
        const paymentIdMatch = url.match(/[?&]paymentId=([^&]+)/);
        const paymentId = paymentIdMatch?.[1];

        if (paymentId) {
          const { confirmBillingPayment } = await import(
            "@/modules/billing/client/billingClient"
          );
          await confirmBillingPayment(paymentId);
        }
      }

      if (url.startsWith("/")) {
        router.push(url);
        return;
      }

      window.location.href = url;
    } catch (error) {
      setErrorMessage(resolveErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "8px",
      }}
    >
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled || loading || success}
        style={{
          width: "100%",
          border: "none",
          cursor: disabled || loading || success ? "not-allowed" : "pointer",
          opacity: disabled || loading || success ? 0.72 : 1,
          ...style,
        }}
      >
        {loading ? "Preparando pago..." : success ? "Redirigiendo..." : children}
      </button>

      {success && (
        <p
          style={{
            margin: 0,
            color: "#16A34A",
            fontSize: "12px",
            lineHeight: 1.5,
          }}
        >
          Checkout iniciado correctamente. Redirigiendo...
        </p>
      )}

      {errorMessage && (
        <p
          style={{
            margin: 0,
            color: "#F87171",
            fontSize: "12px",
            lineHeight: 1.5,
          }}
        >
          {errorMessage}
        </p>
      )}
    </div>
  );
}
