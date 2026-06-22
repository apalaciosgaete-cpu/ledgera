"use client";

import { useEffect, useState } from "react";

import { BillingCheckoutButton } from "@/components/billing/BillingCheckoutButton";
import { fonts } from "@/styles/tokens";
import { httpClient } from "@/shared/http/httpClient";
import { createBillingReactivate } from "@/modules/billing/client/billingClient";

type BillingState = {
  plan: {
    normalized: string;
    label: string;
    expiresAt: string | null;
  };
  subscription: {
    status: string;
    currentPeriodEnd: string | null;
  } | null;
};

type BillingStatusResponse = {
  ok: boolean;
  data?: BillingState;
};

function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("es-CL", { day: "numeric", month: "long", year: "numeric" });
}

function resolveCommercialState(status: BillingState | null) {
  if (!status) return "LOADING";
  if (status.plan.normalized === "FREE") return "FREE";
  if (!status.subscription) return "EXPIRED";
  if (status.subscription.status === "CANCEL_AT_PERIOD_END") return "CANCEL_AT_PERIOD_END";
  if (status.subscription.status === "CANCELLED") return "CANCELLED";
  if (status.subscription.status === "EXPIRED") return "EXPIRED";
  if (status.subscription.status === "FAILED") return "FAILED";
  if (status.subscription.status === "PAST_DUE") return "PAST_DUE";
  if (status.subscription.status === "ACTIVE") return "ACTIVE";
  return "EXPIRED";
}

export function SubscriptionPortalPanel() {
  const [status, setStatus] = useState<BillingState | null>(null);
  const [loading, setLoading] = useState(true);
  const [reactivateLoading, setReactivateLoading] = useState(false);
  const [reactivateError, setReactivateError] = useState<string | null>(null);
  const [reactivateSuccess, setReactivateSuccess] = useState<string | null>(null);
  const state = resolveCommercialState(status);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const response = await httpClient<BillingStatusResponse>("/api/billing/status", { auth: true });
        if (mounted) setStatus(response.data ?? null);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, []);

  async function handleReactivate() {
    setReactivateLoading(true);
    setReactivateError(null);
    setReactivateSuccess(null);

    try {
      const url = await createBillingReactivate();
      setReactivateSuccess("Reactivación preparada. Redirigiendo al checkout...");
      window.location.href = url;
    } catch (error) {
      setReactivateError(
        error instanceof Error ? error.message : "No fue posible reactivar la suscripción.",
      );
      setReactivateLoading(false);
    }
  }

  const needsReactivate =
    state === "EXPIRED" ||
    state === "CANCELLED" ||
    state === "FAILED" ||
    state === "PAST_DUE";

  return (
    <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 12, padding: "1.25rem", marginBottom: "1rem" }}>
      <div style={{ marginBottom: "1rem" }}>
        <h3 style={{ fontFamily: fonts.display, fontSize: 15, fontWeight: 800, color: "#0F2A3D", margin: "0 0 4px" }}>
          Portal de suscripción
        </h3>
        <p style={{ margin: 0, fontSize: 12, color: "#475569", lineHeight: 1.5 }}>
          Cambia, renueva o reactiva tu plan desde un único centro de gestión.
        </p>
      </div>

      <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 10, padding: 12, marginBottom: "1rem" }}>
        <p style={{ margin: "0 0 4px", fontSize: 11, color: "#64748B", fontWeight: 800, textTransform: "uppercase" }}>Estado</p>
        <p style={{ margin: 0, fontSize: 14, color: "#0F2A3D", fontWeight: 800 }}>
          {loading ? "Cargando..." : `${status?.plan.label ?? "Free"} · ${state}`}
        </p>
        {state === "CANCEL_AT_PERIOD_END" && (
          <p style={{ margin: "8px 0 0", fontSize: 12, color: "#92400E" }}>
            Renovación cancelada. Acceso hasta {formatDate(status?.subscription?.currentPeriodEnd)}.
          </p>
        )}
      </div>

      {needsReactivate && (
        <div style={{ marginBottom: "1rem" }}>
          <button
            type="button"
            onClick={handleReactivate}
            disabled={reactivateLoading}
            style={{
              width: "100%",
              background: "#16A34A",
              color: "#FFFFFF",
              border: "none",
              borderRadius: 8,
              padding: "12px 14px",
              fontSize: 13,
              fontWeight: 800,
              cursor: reactivateLoading ? "not-allowed" : "pointer",
              opacity: reactivateLoading ? 0.72 : 1,
            }}
          >
            {reactivateLoading ? "Preparando reactivación..." : "Reactivar suscripción"}
          </button>

          {reactivateSuccess && (
            <p style={{ margin: "8px 0 0", fontSize: 12, color: "#166534" }}>{reactivateSuccess}</p>
          )}
          {reactivateError && (
            <p style={{ margin: "8px 0 0", fontSize: 12, color: "#991B1B" }}>{reactivateError}</p>
          )}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 12 }}>
        <BillingCheckoutButton
          plan="PROFESIONAL"
          action="change-plan"
          disabled={state === "ACTIVE" && status?.plan.normalized === "PERSONAL"}
          style={{ background: "#0F766E", color: "#FFFFFF", borderRadius: 8, padding: "12px 14px", fontSize: 13, fontWeight: 800 }}
        >
          {state === "EXPIRED" || state === "CANCELLED" || state === "FAILED" || state === "PAST_DUE"
            ? "Renovar Personal"
            : "Cambiar a Personal"}
        </BillingCheckoutButton>

        <BillingCheckoutButton
          plan="EMPRESA"
          action="change-plan"
          disabled={state === "ACTIVE" && status?.plan.normalized === "PRO"}
          style={{ background: "#0F2A3D", color: "#FFFFFF", borderRadius: 8, padding: "12px 14px", fontSize: 13, fontWeight: 800 }}
        >
          {state === "EXPIRED" || state === "CANCELLED" || state === "FAILED" || state === "PAST_DUE"
            ? "Renovar Pro"
            : "Cambiar a Pro"}
        </BillingCheckoutButton>
      </div>

      <p style={{ margin: "12px 0 0", fontSize: 11, color: "#64748B", lineHeight: 1.5 }}>
        Compatible con Stripe, Flow y MercadoPago mediante el contrato de checkout vigente.
      </p>
    </div>
  );
}
