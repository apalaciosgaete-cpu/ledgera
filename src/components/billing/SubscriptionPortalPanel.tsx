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
  return new Date(value).toLocaleDateString("es-CL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
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
        const response = await httpClient<BillingStatusResponse>(
          "/api/billing/status",
          { auth: true },
        );
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
        error instanceof Error
          ? error.message
          : "No fue posible reactivar la suscripción.",
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
    <div style={{ background: "var(--bg-elev)", border: "1px solid var(--border)", borderRadius: 12, padding: "1.25rem", marginBottom: "1rem" }}>
      <div style={{ marginBottom: "1rem" }}>
        <h3 style={{ fontFamily: fonts.display, fontSize: 15, fontWeight: 800, color: "var(--text)", margin: "0 0 4px" }}>
          Portal de suscripción
        </h3>
        <p style={{ margin: 0, fontSize: 12, color: "var(--text)", lineHeight: 1.5 }}>
          Cambia, renueva o reactiva tu plan desde un único centro de gestión.
        </p>
      </div>

      <div style={{ background: "var(--bg-sunken)", border: "1px solid var(--border)", borderRadius: 10, padding: 12, marginBottom: "1rem" }}>
        <p style={{ margin: "0 0 4px", fontSize: 11, color: "var(--text-soft)", fontWeight: 800, textTransform: "uppercase" }}>Estado</p>
        <p style={{ margin: 0, fontSize: 14, color: "var(--text)", fontWeight: 800 }}>
          {loading ? "Cargando..." : `${status?.plan.label ?? "Gratuito"} · ${state}`}
        </p>
        {state === "CANCEL_AT_PERIOD_END" && (
          <p style={{ margin: "8px 0 0", fontSize: 12, color: "var(--warn)" }}>
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
              background: "var(--accent)",
              color: "var(--accent-contrast)",
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
            <p style={{ margin: "8px 0 0", fontSize: 12, color: "var(--accent)" }}>{reactivateSuccess}</p>
          )}
          {reactivateError && (
            <p style={{ margin: "8px 0 0", fontSize: 12, color: "var(--loss)" }}>{reactivateError}</p>
          )}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 12 }}>
        <BillingCheckoutButton
          plan="PERSONAL"
          action="change-plan"
          disabled={state === "ACTIVE" && status?.plan.normalized === "PERSONAL"}
          style={{ background: "var(--accent)", color: "var(--accent-contrast)", borderRadius: 8, padding: "12px 14px", fontSize: 13, fontWeight: 800 }}
        >
          {needsReactivate ? "Renovar Personal" : "Cambiar a Personal"}
        </BillingCheckoutButton>

        <BillingCheckoutButton
          plan="PROFESIONAL"
          action="change-plan"
          disabled={state === "ACTIVE" && status?.plan.normalized === "PROFESIONAL"}
          style={{ background: "var(--bg-elev)", color: "var(--text)", borderRadius: 8, padding: "12px 14px", fontSize: 13, fontWeight: 800 }}
        >
          {needsReactivate ? "Renovar Profesional" : "Cambiar a Profesional"}
        </BillingCheckoutButton>
      </div>

      <p style={{ margin: "12px 0 0", fontSize: 11, color: "var(--text-soft)", lineHeight: 1.5 }}>
        La pasarela externa permanece bloqueada hasta completar la habilitación legal. Ningún plan se activa sin webhook de pago confirmado.
      </p>
    </div>
  );
}
