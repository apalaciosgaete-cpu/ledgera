"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

import { fonts } from "@/styles/tokens";
import { confirmBillingPayment } from "@/modules/billing/client/billingClient";

type CheckoutStatus = "pending" | "success" | "error";

type CheckoutCopy = {
  title: string;
  description: string;
  tone: "info" | "success" | "error";
};

const STATUS_COPY: Record<CheckoutStatus, CheckoutCopy> = {
  pending: {
    title: "Solicitud en proceso",
    description:
      "Estamos revisando el estado de tu contratación. Te informaremos cuando el plan quede activo.",
    tone: "info",
  },
  success: {
    title: "Plan activado",
    description: "Tu contratación fue confirmada y el plan ya está disponible en tu cuenta.",
    tone: "success",
  },
  error: {
    title: "No pudimos completar la contratación",
    description:
      "La operación no se completó. Puedes intentarlo nuevamente desde la página de planes.",
    tone: "error",
  },
};

function normalizeCheckoutStatus(status: string | null): CheckoutStatus | null {
  if (status === "pending" || status === "success" || status === "error") {
    return status;
  }

  return null;
}

export function BillingCheckoutStatusBanner() {
  const searchParams = useSearchParams();
  const status = normalizeCheckoutStatus(
    searchParams.get("checkout") ?? searchParams.get("payment"),
  );
  const paymentId = searchParams.get("paymentId");

  const [confirming, setConfirming] = useState(false);
  const [confirmError, setConfirmError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "pending" && paymentId) {
      setConfirming(true);
      setConfirmError(null);

      confirmBillingPayment(paymentId)
        .then(() => {
          window.location.href = "/configuracion/facturacion?checkout=success";
        })
        .catch(() => {
          setConfirming(false);
          setConfirmError(
            "No pudimos actualizar el estado de tu plan. Intenta nuevamente en unos minutos.",
          );
        });
    }
  }, [status, paymentId]);

  if (!status && !confirmError) return null;

  const copy = STATUS_COPY[status ?? "pending"];
  const colors = {
    info: {
      border: "rgba(14,165,233,0.24)",
      background: "rgba(14,165,233,0.08)",
      title: "var(--accent)",
      text: "var(--text-soft)",
    },
    success: {
      border: "rgba(22,163,74,0.24)",
      background: "rgba(22,163,74,0.08)",
      title: "var(--accent)",
      text: "var(--text-soft)",
    },
    error: {
      border: "rgba(239,68,68,0.24)",
      background: "rgba(239,68,68,0.08)",
      title: "var(--loss)",
      text: "var(--text-soft)",
    },
  }[copy.tone];

  return (
    <div
      style={{
        background: colors.background,
        border: `1px solid ${colors.border}`,
        borderRadius: "12px",
        padding: "1rem 1.25rem",
        marginBottom: "1rem",
      }}
    >
      <h3
        style={{
          fontFamily: fonts.display,
          fontSize: "14px",
          fontWeight: 800,
          color: colors.title,
          margin: "0 0 4px",
        }}
      >
        {confirming ? "Actualizando tu plan..." : copy.title}
      </h3>
      <p
        style={{
          margin: 0,
          fontSize: "13px",
          lineHeight: 1.55,
          color: colors.text,
        }}
      >
        {confirmError ?? copy.description}
      </p>
    </div>
  );
}
