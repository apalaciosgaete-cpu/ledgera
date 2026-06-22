"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

import { fonts } from "@/styles/tokens";
import { confirmBillingPayment } from "@/modules/billing/client/billingClient";

type CheckoutStatus = "pending" | "success" | "error";

const STATUS_COPY: Record<CheckoutStatus, { title: string; description: string; tone: "info" | "success" | "error" }> = {
  pending: {
    title: "Upgrade iniciado",
    description: "El checkout quedó preparado para el proveedor de pago. Cuando se confirme el pago, LEDGERA podrá actualizar tu plan automáticamente.",
    tone: "info",
  },
  success: {
    title: "Pago confirmado",
    description: "Tu pago fue confirmado. Tu plan será actualizado automáticamente cuando el webhook del proveedor quede procesado.",
    tone: "success",
  },
  error: {
    title: "No fue posible completar el pago",
    description: "El proveedor de pago no pudo completar el checkout. Puedes intentar nuevamente desde la comparación de planes.",
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
  const status = normalizeCheckoutStatus(searchParams.get("checkout") ?? searchParams.get("payment"));
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
        .catch((error: unknown) => {
          setConfirming(false);
          setConfirmError(
            error instanceof Error
              ? error.message
              : "No fue posible confirmar el pago.",
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
      title: "#075985",
      text: "#0F2A3D",
    },
    success: {
      border: "rgba(22,163,74,0.24)",
      background: "rgba(22,163,74,0.08)",
      title: "#166534",
      text: "#0F2A3D",
    },
    error: {
      border: "rgba(239,68,68,0.24)",
      background: "rgba(239,68,68,0.08)",
      title: "#991B1B",
      text: "#0F2A3D",
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
        {confirming ? "Confirmando pago..." : copy.title}
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
      {paymentId && (
        <p
          style={{
            margin: "8px 0 0",
            fontSize: "11px",
            color: "#475569",
            fontFamily: "monospace",
          }}
        >
          paymentId: {paymentId}
        </p>
      )}
    </div>
  );
}
