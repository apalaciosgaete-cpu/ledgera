"use client";

import { useEffect, useState } from "react";

import { fonts } from "@/styles/tokens";
import { httpClient } from "@/shared/http/httpClient";

type BillingPayment = {
  id: string;
  provider: string;
  status: string;
  amount: number;
  currency: string;
  description: string;
  paymentUrl: string | null;
  paidAt: string | null;
  failedAt: string | null;
  createdAt: string;
};

type BillingStatusResponse = {
  ok: boolean;
  message?: string;
  data?: {
    plan: {
      raw: string;
      normalized: string;
      label: string;
      expiresAt: string | null;
      activatedAt: string | null;
      activationSource: string | null;
    };
    subscription: {
      id: string;
      provider: string;
      plan: string;
      status: string;
      amount: number;
      currency: string;
      interval: string;
      currentPeriodStart: string | null;
      currentPeriodEnd: string | null;
      canceledAt: string | null;
    } | null;
    latestPayment: BillingPayment | null;
    payments: BillingPayment[];
  };
};

function formatClp(amount: number, currency: string) {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: currency || "CLP",
    minimumFractionDigits: 0,
  }).format(amount);
}

function formatDate(value: string | null) {
  if (!value) return "—";

  return new Date(value).toLocaleDateString("es-CL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function statusTone(status: string) {
  switch (status) {
    case "PAID":
    case "ACTIVE":
      return { background: "rgba(22,163,74,0.10)", color: "#166534", label: status === "PAID" ? "Pagado" : "Activo" };
    case "CANCEL_AT_PERIOD_END":
      return { background: "rgba(245,158,11,0.12)", color: "#92400E", label: "Cancela al vencimiento" };
    case "PENDING":
      return { background: "rgba(245,158,11,0.12)", color: "#92400E", label: "Pendiente" };
    case "FAILED":
      return { background: "rgba(239,68,68,0.10)", color: "#991B1B", label: "Fallido" };
    case "CANCELLED":
      return { background: "rgba(100,116,139,0.12)", color: "#475569", label: "Cancelado" };
    default:
      return { background: "rgba(100,116,139,0.10)", color: "#475569", label: status };
  }
}

function StatusBadge({ status }: { status: string }) {
  const tone = statusTone(status);

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        borderRadius: 999,
        background: tone.background,
        color: tone.color,
        fontSize: 11,
        fontWeight: 800,
        padding: "4px 8px",
      }}
    >
      {tone.label}
    </span>
  );
}

export function BillingStatusPanel() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<BillingStatusResponse["data"] | null>(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const response = await httpClient<BillingStatusResponse>("/api/billing/status", {
          auth: true,
        });

        if (mounted) {
          setStatus(response.data ?? null);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : "No fue posible cargar el estado comercial.");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();

    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 12, padding: "1rem 1.25rem", marginBottom: "1rem" }}>
        <p style={{ margin: 0, color: "#475569", fontSize: 13 }}>Cargando estado comercial...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.18)", borderRadius: 12, padding: "1rem 1.25rem", marginBottom: "1rem" }}>
        <p style={{ margin: 0, color: "#991B1B", fontSize: 13 }}>{error}</p>
      </div>
    );
  }

  if (!status) return null;

  const cancelAtPeriodEnd = status.subscription?.status === "CANCEL_AT_PERIOD_END";

  return (
    <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 12, padding: "1.25rem", marginBottom: "1rem" }}>
      <div style={{ marginBottom: "1rem" }}>
        <h3 style={{ fontFamily: fonts.display, fontSize: 15, fontWeight: 800, color: "#0F2A3D", margin: "0 0 4px" }}>
          Estado comercial
        </h3>
        <p style={{ margin: 0, fontSize: 12, color: "#475569" }}>
          Plan actual, suscripción vigente y últimos intentos de pago.
        </p>
      </div>

      {cancelAtPeriodEnd && (
        <div style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.18)", borderRadius: 10, padding: 12, marginBottom: "1rem" }}>
          <p style={{ margin: 0, color: "#92400E", fontSize: 13, lineHeight: 1.5 }}>
            La renovación está cancelada. Mantendrás acceso hasta {formatDate(status.subscription?.currentPeriodEnd ?? null)}.
          </p>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginBottom: "1rem" }}>
        <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 10, padding: 12 }}>
          <p style={{ margin: "0 0 4px", color: "#64748B", fontSize: 11, fontWeight: 700, textTransform: "uppercase" }}>Plan</p>
          <p style={{ margin: 0, color: "#0F2A3D", fontSize: 15, fontWeight: 800 }}>{status.plan.label}</p>
        </div>
        <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 10, padding: 12 }}>
          <p style={{ margin: "0 0 4px", color: "#64748B", fontSize: 11, fontWeight: 700, textTransform: "uppercase" }}>Vence</p>
          <p style={{ margin: 0, color: "#0F2A3D", fontSize: 15, fontWeight: 800 }}>{formatDate(status.plan.expiresAt)}</p>
        </div>
        <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 10, padding: 12 }}>
          <p style={{ margin: "0 0 4px", color: "#64748B", fontSize: 11, fontWeight: 700, textTransform: "uppercase" }}>Suscripción</p>
          {status.subscription ? <StatusBadge status={status.subscription.status} /> : <p style={{ margin: 0, color: "#64748B", fontSize: 13 }}>Sin suscripción</p>}
        </div>
      </div>

      <div style={{ borderTop: "1px solid #E2E8F0", paddingTop: "1rem" }}>
        <h4 style={{ margin: "0 0 10px", fontSize: 13, color: "#0F2A3D", fontWeight: 800 }}>Historial de pagos</h4>
        {status.payments.length === 0 ? (
          <p style={{ margin: 0, color: "#64748B", fontSize: 13 }}>Aún no hay pagos registrados.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr>
                  {["Fecha", "Descripción", "Proveedor", "Monto", "Estado"].map((header) => (
                    <th key={header} style={{ textAlign: "left", padding: "8px 10px", color: "#64748B", borderBottom: "1px solid #E2E8F0", fontWeight: 700 }}>{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {status.payments.map((payment) => (
                  <tr key={payment.id}>
                    <td style={{ padding: "10px", color: "#475569", borderBottom: "1px solid #F1F5F9", whiteSpace: "nowrap" }}>{formatDate(payment.createdAt)}</td>
                    <td style={{ padding: "10px", color: "#0F2A3D", borderBottom: "1px solid #F1F5F9" }}>{payment.description}</td>
                    <td style={{ padding: "10px", color: "#475569", borderBottom: "1px solid #F1F5F9", textTransform: "capitalize" }}>{payment.provider}</td>
                    <td style={{ padding: "10px", color: "#0F2A3D", borderBottom: "1px solid #F1F5F9", fontWeight: 700 }}>{formatClp(payment.amount, payment.currency)}</td>
                    <td style={{ padding: "10px", borderBottom: "1px solid #F1F5F9" }}><StatusBadge status={payment.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
