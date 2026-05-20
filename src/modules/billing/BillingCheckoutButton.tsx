"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/modules/identity/client/authContext";
import {
  createBillingCheckout,
  type BillingCheckoutPlan,
  type BillingProvider,
} from "@/modules/billing/client/billingClient";
import { isHttpClientError } from "@/shared/http/httpClient";

type BillingCheckoutButtonProps = {
  provider: BillingProvider;
  plan: BillingCheckoutPlan;
  children: React.ReactNode;
  disabled?: boolean;
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
  provider,
  plan,
  children,
  disabled = false,
  style,
}: BillingCheckoutButtonProps) {
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] =
    useState<string | null>(null);

  async function handleClick() {
    setErrorMessage(null);

    if (!isAuthenticated) {
      sessionStorage.setItem(
        "pendingCheckout",
        JSON.stringify({
          provider,
          plan,
          billing: "monthly",
        }),
      );

      router.push(
        `/register?plan=${encodeURIComponent(plan)}&provider=${encodeURIComponent(
          provider,
        )}`,
      );

      return;
    }

    setLoading(true);

    try {
      const url = await createBillingCheckout({
        provider,
        plan,
      });

      window.location.href = url;
    } catch (error) {
      setErrorMessage(resolveErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled || loading}
        style={{
          width: "100%",
          border: "none",
          cursor: disabled || loading ? "not-allowed" : "pointer",
          opacity: disabled || loading ? 0.72 : 1,
          ...style,
        }}
      >
        {loading ? "Preparando pago..." : children}
      </button>

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