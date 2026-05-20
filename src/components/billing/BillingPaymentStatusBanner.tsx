"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

import { useAuth } from "@/modules/identity/client/authContext";
import { getBillingStatus } from "@/modules/billing/client/billingStatusClient";

type BillingStatus = Awaited<ReturnType<typeof getBillingStatus>>;
type PaymentParam = "success" | "pending" | "failure";
type BannerTone = "success" | "pending" | "failure";

function resolvePaymentParam(value: string | null): PaymentParam | null {
  if (
    value === "success" ||
    value === "pending" ||
    value === "failure"
  ) {
    return value;
  }

  return null;
}

function getBannerCopy(input: {
  paymentParam: PaymentParam;
  status: BillingStatus | null;
}): {
  title: string;
  message: string;
  tone: BannerTone;
} {
  if (input.paymentParam === "success") {
    if (input.status?.isActive) {
      return {
        title: "Pago confirmado",
        message:
          "Tu plan fue activado correctamente. La suscripción ya está disponible en tu cuenta.",
        tone: "success",
      };
    }

    return {
      title: "Pago recibido, esperando confirmación",
      message:
        "El proveedor aún no confirma el pago por webhook. Esto puede tardar algunos minutos.",
      tone: "pending",
    };
  }

  if (input.paymentParam === "pending") {
    return {
      title: "Pago pendiente",
      message:
        "El pago está pendiente de confirmación. Actualizaremos tu plan cuando el proveedor confirme la operación.",
      tone: "pending",
    };
  }

  return {
    title: "Pago no completado",
    message:
      "La operación no fue completada. Puedes intentarlo nuevamente con Mercado Pago o Khipu.",
    tone: "failure",
  };
}

function resolveToneStyles(tone: BannerTone) {
  if (tone === "success") {
    return {
      border: "1px solid rgba(22,163,74,0.35)",
      background: "rgba(22,163,74,0.10)",
      titleColor: "#4ADE80",
      textColor: "#BBF7D0",
    };
  }

  if (tone === "pending") {
    return {
      border: "1px solid rgba(234,179,8,0.35)",
      background: "rgba(234,179,8,0.10)",
      titleColor: "#FACC15",
      textColor: "#FEF3C7",
    };
  }

  return {
    border: "1px solid rgba(239,68,68,0.35)",
    background: "rgba(239,68,68,0.10)",
    titleColor: "#F87171",
    textColor: "#FECACA",
  };
}

export function BillingPaymentStatusBanner() {
  const searchParams = useSearchParams();
  const { isAuthenticated, refreshUser } = useAuth();

  const paymentParam = resolvePaymentParam(
    searchParams.get("payment"),
  );

  const [billingStatus, setBillingStatus] =
    useState<BillingStatus | null>(null);

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!paymentParam || !isAuthenticated) {
      return;
    }

    let cancelled = false;

    async function loadStatus() {
      setLoading(true);

      try {
        const status = await getBillingStatus();

        if (cancelled) return;

        setBillingStatus(status);

        if (status.isActive) {
          await refreshUser();
        }
      } catch {
        if (!cancelled) {
          setBillingStatus(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadStatus();

    return () => {
      cancelled = true;
    };
  }, [paymentParam, isAuthenticated, refreshUser]);

  const copy = useMemo(() => {
    if (!paymentParam) return null;

    return getBannerCopy({
      paymentParam,
      status: billingStatus,
    });
  }, [paymentParam, billingStatus]);

  if (!paymentParam || !copy) {
    return null;
  }

  const styles = resolveToneStyles(copy.tone);

  return (
    <div
      style={{
        maxWidth: "860px",
        margin: "0 auto 2rem",
        padding: "1rem 1.25rem",
        borderRadius: "12px",
        border: styles.border,
        background: styles.background,
      }}
    >
      <p
        style={{
          margin: "0 0 6px",
          fontSize: "14px",
          fontWeight: 700,
          color: styles.titleColor,
        }}
      >
        {copy.title}
      </p>

      <p
        style={{
          margin: 0,
          fontSize: "13px",
          lineHeight: 1.6,
          color: styles.textColor,
        }}
      >
        {loading
          ? "Consultando estado actualizado del pago..."
          : copy.message}
      </p>

      {billingStatus?.latestPayment && (
        <p
          style={{
            margin: "8px 0 0",
            fontSize: "12px",
            color: "#94A3B8",
          }}
        >
          Último pago: {billingStatus.latestPayment.provider} ·{" "}
          {billingStatus.latestPayment.status}
        </p>
      )}
    </div>
  );
}