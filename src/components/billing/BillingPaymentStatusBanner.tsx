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
        message: "Tu plan ya está activo y disponible en tu cuenta.",
        tone: "success",
      };
    }

    return {
      title: "Estamos confirmando tu pago",
      message: "La activación puede tardar algunos minutos. No necesitas realizar otra acción.",
      tone: "pending",
    };
  }

  if (input.paymentParam === "pending") {
    return {
      title: "Pago en proceso",
      message: "Estamos confirmando la operación. Tu plan se activará automáticamente cuando finalice.",
      tone: "pending",
    };
  }

  return {
    title: "Pago no completado",
    message: "No pudimos completar la operación. Puedes intentarlo nuevamente.",
    tone: "failure",
  };
}

function resolveToneStyles(tone: BannerTone) {
  if (tone === "success") {
    return {
      border: "1px solid rgba(22,163,74,0.35)",
      background: "rgba(22,163,74,0.10)",
      titleColor: "var(--accent)",
      textColor: "var(--text-soft)",
    };
  }

  if (tone === "pending") {
    return {
      border: "1px solid rgba(234,179,8,0.35)",
      background: "rgba(234,179,8,0.10)",
      titleColor: "var(--text-faint)",
      textColor: "var(--text-soft)",
    };
  }

  return {
    border: "1px solid rgba(239,68,68,0.35)",
    background: "rgba(239,68,68,0.10)",
    titleColor: "var(--loss)",
    textColor: "var(--text-soft)",
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
        {loading ? "Consultando el estado del pago..." : copy.message}
      </p>
    </div>
  );
}
