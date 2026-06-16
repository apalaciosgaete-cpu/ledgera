"use client";

import { useEffect, useState } from "react";

type TaxFileSummary = {
  userId: string;
  userEmail: string;
  userName: string;
  status: "HEALTHY" | "ATTENTION_REQUIRED" | "HIGH_RISK" | "CRITICAL";
  taxProfile: {
    exists: boolean;
    documentType: string | null;
    rut: string | null;
    legalName: string | null;
    isValidated: boolean;
  };
  risk: { score: number | null; level: string | null };
  smartScore: { score: number | null; level: string | null };
  alerts: { open: number; critical: number };
  recommendations: { active: number; critical: number };
  tasks: { pending: number; overdue: number; critical: number };
  taxDocuments: { total: number; pending: number; rejected: number };
  sii: { configured: boolean; status: string; activeCafs: number };
  billing: { plan: string; subscriptionStatus: string | null };
  connections: { total: number; degraded: number };
  audit: { recentEvents: number; criticalEvents: number };
  generatedAt: string;
};

const statusConfig: Record<TaxFileSummary["status"], { label: string; color: string; bg: string; icon: string }> = {
  HEALTHY: {
    label: "Todo en orden",
    color: "#166534",
    bg: "#F0FDF4",
    icon: "✅",
  },
  ATTENTION_REQUIRED: {
    label: "Revisión recomendada",
    color: "#B45309",
    bg: "#FEF9C3",
    icon: "⚠️",
  },
  HIGH_RISK: {
    label: "Riesgo alto",
    color: "#DC2626",
    bg: "#FEF2F2",
    icon: "🚨",
  },
  CRITICAL: {
    label: "Requiere acción inmediata",
    color: "#991B1B",
    bg: "#FEE2E2",
    icon: "⛔",
  },
};

export default function MyTaxFilePage() {
  const [summary, setSummary] = useState<TaxFileSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/tax-file/me", { cache: "no-store" });
        const json = await res.json();
        if (!json.ok) throw new Error(json.message || "Error cargando expediente.");
        setSummary(json.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error desconocido.");
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, []);

  if (loading) {
    return <p style={{ color: "#64748B", fontSize: 14 }}>Cargando expediente tributario…</p>;
  }

  if (error) {
    return (
      <div
        style={{
          background: "#FEF2F2",
          border: "1px solid #FECACA",
          borderRadius: 8,
          color: "#991B1B",
          fontWeight: 750,
          padding: 16,
        }}
      >
        {error}
      </div>
    );
  }

  if (!summary) {
    return <p style={{ color: "#64748B" }}>No hay información disponible.</p>;
  }

  const status = statusConfig[summary.status];

  return (
    <section style={{ maxWidth: 800, width: "100%" }}>
      <header style={{ marginBottom: 24 }}>
        <p
          style={{
            color: "#0F766E",
            fontSize: 12,
            fontWeight: 850,
            letterSpacing: "0.06em",
            margin: "0 0 7px",
            textTransform: "uppercase",
          }}
        >
          Mi expediente
        </p>
        <h1
          style={{
            color: "#0F2A3D",
            fontSize: "1.9rem",
            fontWeight: 850,
            lineHeight: 1.12,
            margin: "0 0 8px",
          }}
        >
          Tu resumen tributario en LEDGERA
        </h1>
        <p style={{ color: "#64748B", fontSize: 14, lineHeight: 1.6, margin: 0 }}>
          Aquí ves el estado de tu información tributaria de forma sencilla.
        </p>
      </header>

      <div
        style={{
          background: status.bg,
          border: `1px solid ${status.color}30`,
          borderRadius: 12,
          color: status.color,
          marginBottom: 24,
          padding: "20px",
        }}
      >
        <div style={{ alignItems: "center", display: "flex", gap: 12, marginBottom: 6 }}>
          <span style={{ fontSize: 28 }}>{status.icon}</span>
          <span style={{ fontSize: "1.35rem", fontWeight: 850 }}>{status.label}</span>
        </div>
        <p style={{ margin: 0, opacity: 0.9 }}>
          Estado general: <strong>{summary.status.replace(/_/g, " ")}</strong>
        </p>
      </div>

      <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(2, 1fr)", marginBottom: 24 }}>
        <SimpleCard
          title="Mi información tributaria"
          items={[
            { label: "RUT", value: summary.taxProfile.rut ?? "No registrado" },
            { label: "Razón social", value: summary.taxProfile.legalName ?? "—" },
            { label: "Validado", value: summary.taxProfile.isValidated ? "Sí" : "No" },
            { label: "SII", value: siiLabel(summary.sii.status) },
          ]}
        />
        <SimpleCard
          title="Mis alertas y tareas"
          items={[
            { label: "Alertas abiertas", value: String(summary.alerts.open) },
            { label: "Tareas pendientes", value: String(summary.tasks.pending) },
            { label: "Tareas vencidas", value: String(summary.tasks.overdue) },
            { label: "Recomendaciones", value: String(summary.recommendations.active) },
          ]}
        />
      </div>

      <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(2, 1fr)", marginBottom: 24 }}>
        <SimpleCard
          title="Mis documentos"
          items={[
            { label: "Total", value: String(summary.taxDocuments.total) },
            { label: "Pendientes", value: String(summary.taxDocuments.pending) },
            { label: "Rechazados", value: String(summary.taxDocuments.rejected) },
          ]}
        />
        <SimpleCard
          title="Mi plan"
          items={[
            { label: "Plan", value: summary.billing.plan },
            { label: "Estado", value: summary.billing.subscriptionStatus ?? "—" },
            { label: "Conexiones", value: `${summary.connections.total} (${summary.connections.degraded} desconectadas)` },
          ]}
        />
      </div>

      <p style={{ color: "#94A3B8", fontSize: 12, margin: 0 }}>
        Última actualización: {new Date(summary.generatedAt).toLocaleString("es-CL")}
      </p>
    </section>
  );
}

function SimpleCard({
  title,
  items,
}: {
  title: string;
  items: { label: string; value: string }[];
}) {
  return (
    <div
      style={{
        background: "#FFFFFF",
        border: "1px solid #E2E8F0",
        borderRadius: 12,
        padding: "18px",
      }}
    >
      <h2
        style={{
          color: "#0F2A3D",
          fontSize: "1rem",
          fontWeight: 850,
          margin: "0 0 12px",
        }}
      >
        {title}
      </h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {items.map((item) => (
          <div key={item.label} style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "#64748B", fontSize: 14 }}>{item.label}</span>
            <span style={{ color: "#0F2A3D", fontSize: 14, fontWeight: 700 }}>{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function siiLabel(status: string): string {
  switch (status) {
    case "CONFIGURED":
      return "Configurado";
    case "CERTIFICATE_EXPIRED":
      return "Certificado vencido";
    case "NOT_CONFIGURED":
    default:
      return "No configurado";
  }
}
