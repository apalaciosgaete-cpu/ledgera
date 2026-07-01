"use client";

import { useState } from "react";

import { fonts } from "@/styles/tokens";
import { httpClient } from "@/shared/http/httpClient";

type ActionResponse = {
  ok: boolean;
  message?: string;
  data?: {
    status: string;
    subscriptionId: string | null;
    currentPeriodEnd: string | null;
    message: string;
  };
};

async function postBillingAction(path: "/api/billing/cancel" | "/api/billing/downgrade") {
  return httpClient<ActionResponse>(path, {
    method: "POST",
    auth: true,
  });
}

export function BillingCancellationActions() {
  const [loadingAction, setLoadingAction] = useState<"cancel" | "downgrade" | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function runAction(action: "cancel" | "downgrade") {
    const confirmation = action === "cancel"
      ? "¿Cancelar la renovación? Mantendrás acceso hasta el vencimiento del período actual."
      : "¿Volver ahora al plan Free? Esta acción reduce el acceso inmediatamente.";

    if (!window.confirm(confirmation)) return;

    setLoadingAction(action);
    setMessage(null);
    setError(null);

    try {
      const response = await postBillingAction(action === "cancel" ? "/api/billing/cancel" : "/api/billing/downgrade");
      setMessage(response.data?.message ?? response.message ?? "Acción aplicada correctamente.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No fue posible ejecutar la acción.");
    } finally {
      setLoadingAction(null);
    }
  }

  return (
    <div
      style={{
        background: "var(--bg-elev)",
        border: "1px solid var(--border)",
        borderRadius: 12,
        padding: "1.25rem",
        marginBottom: "1rem",
      }}
    >
      <div style={{ marginBottom: "1rem" }}>
        <h3
          style={{
            fontFamily: fonts.display,
            fontSize: 15,
            fontWeight: 800,
            color: "var(--text)",
            margin: "0 0 4px",
          }}
        >
          Gestión de suscripción
        </h3>
        <p style={{ margin: 0, fontSize: 12, color: "var(--text)", lineHeight: 1.5 }}>
          Cancela la renovación manteniendo acceso hasta el vencimiento, o vuelve inmediatamente al plan Free.
        </p>
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <button
          type="button"
          disabled={loadingAction !== null}
          onClick={() => runAction("cancel")}
          style={{
            border: "1px solid rgba(245,158,11,0.35)",
            background: "rgba(245,158,11,0.10)",
            color: "var(--warn)",
            borderRadius: 8,
            padding: "10px 14px",
            fontSize: 13,
            fontWeight: 800,
            cursor: loadingAction ? "not-allowed" : "pointer",
          }}
        >
          {loadingAction === "cancel" ? "Cancelando..." : "Cancelar renovación"}
        </button>

        <button
          type="button"
          disabled={loadingAction !== null}
          onClick={() => runAction("downgrade")}
          style={{
            border: "1px solid rgba(239,68,68,0.35)",
            background: "rgba(239,68,68,0.08)",
            color: "var(--loss)",
            borderRadius: 8,
            padding: "10px 14px",
            fontSize: 13,
            fontWeight: 800,
            cursor: loadingAction ? "not-allowed" : "pointer",
          }}
        >
          {loadingAction === "downgrade" ? "Aplicando..." : "Volver a Free ahora"}
        </button>
      </div>

      {message && (
        <p style={{ margin: "12px 0 0", color: "var(--accent)", fontSize: 13, lineHeight: 1.5 }}>
          {message}
        </p>
      )}

      {error && (
        <p style={{ margin: "12px 0 0", color: "var(--loss)", fontSize: 13, lineHeight: 1.5 }}>
          {error}
        </p>
      )}
    </div>
  );
}
