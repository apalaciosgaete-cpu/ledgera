"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

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

const statusConfig: Record<TaxFileSummary["status"], { label: string; color: string; bg: string }> = {
  HEALTHY: { label: "Saludable", color: "var(--accent)", bg: "var(--accent-soft)" },
  ATTENTION_REQUIRED: { label: "Atención requerida", color: "var(--warn)", bg: "rgba(232,184,75,0.14)" },
  HIGH_RISK: { label: "Alto riesgo", color: "var(--loss)", bg: "rgba(196,99,74,0.14)" },
  CRITICAL: { label: "Crítico", color: "var(--loss)", bg: "rgba(196,99,74,0.14)" },
};

export default function ExpertTaxFileDetailPage() {
  const params = useParams<{ userId: string }>();
  const [summary, setSummary] = useState<TaxFileSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/tax-files/${params.userId}`, { cache: "no-store" });
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
  }, [params.userId]);

  if (loading) {
    return <p style={{ color: "var(--text-soft)" }}>Cargando expediente…</p>;
  }

  if (error) {
    return (
      <div
        style={{
          background: "rgba(196,99,74,0.14)",
          border: "1px solid rgba(196,99,74,0.14)",
          borderRadius: 8,
          color: "var(--loss)",
          fontWeight: 750,
          padding: 16,
        }}
      >
        {error}
      </div>
    );
  }

  if (!summary) {
    return <p style={{ color: "var(--text-soft)" }}>No hay datos.</p>;
  }

  const status = statusConfig[summary.status];

  return (
    <section style={{ padding: "24px 0" }}>
      <header style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 850, margin: "0 0 8px" }}>
          Expediente: {summary.userName || summary.userEmail}
        </h1>
        <p style={{ color: "var(--text-soft)", margin: 0 }}>{summary.userEmail}</p>
      </header>

      <div
        style={{
          background: status.bg,
          border: `1px solid ${status.color}30`,
          borderRadius: 12,
          color: status.color,
          marginBottom: 24,
          padding: "16px 20px",
        }}
      >
        <span style={{ fontSize: "1.1rem", fontWeight: 850 }}>{status.label}</span>
        <span style={{ fontSize: 13, marginLeft: 12, opacity: 0.9 }}>
          {summary.status.replace(/_/g, " ")}
        </span>
      </div>

      <div
        style={{
          display: "grid",
          gap: 16,
          gridTemplateColumns: "repeat(3, 1fr)",
          marginBottom: 24,
        }}
      >
        <Metric label="Riesgo" value={summary.risk.score ?? "—"} note={summary.risk.level ?? ""} />
        <Metric label="Smart Tax Score" value={summary.smartScore.score ?? "—"} note={summary.smartScore.level ?? ""} />
        <Metric label="Alertas abiertas" value={summary.alerts.open} note={`${summary.alerts.critical} críticas`} />
      </div>

      <div
        style={{
          display: "grid",
          gap: 16,
          gridTemplateColumns: "repeat(3, 1fr)",
          marginBottom: 24,
        }}
      >
        <Metric label="Tareas pendientes" value={summary.tasks.pending} note={`${summary.tasks.overdue} vencidas`} />
        <Metric label="Recomendaciones" value={summary.recommendations.active} note={`${summary.recommendations.critical} críticas`} />
        <Metric label="DTE rechazados" value={summary.taxDocuments.rejected} note={`${summary.taxDocuments.pending} pendientes`} />
      </div>

      <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(2, 1fr)" }}>
        <Section title="Identidad tributaria">
          <Row label="RUT" value={summary.taxProfile.rut ?? "No registrado"} />
          <Row label="Razón social" value={summary.taxProfile.legalName ?? "—"} />
          <Row label="Validado" value={summary.taxProfile.isValidated ? "Sí" : "No"} />
          <Row label="Tipo documento" value={summary.taxProfile.documentType ?? "—"} />
        </Section>

        <Section title="SII">
          <Row label="Configurado" value={summary.sii.configured ? "Sí" : "No"} />
          <Row label="Estado" value={summary.sii.status} />
          <Row label="CAFs activos" value={String(summary.sii.activeCafs)} />
        </Section>

        <Section title="Suscripción">
          <Row label="Plan" value={summary.billing.plan} />
          <Row label="Estado" value={summary.billing.subscriptionStatus ?? "—"} />
        </Section>

        <Section title="Conexiones y auditoría">
          <Row label="Conexiones totales" value={String(summary.connections.total)} />
          <Row label="Conexiones degradadas" value={String(summary.connections.degraded)} />
          <Row label="Eventos recientes" value={String(summary.audit.recentEvents)} />
          <Row label="Eventos críticos" value={String(summary.audit.criticalEvents)} />
        </Section>
      </div>

      <p style={{ color: "var(--text-soft)", fontSize: 12, marginTop: 24 }}>
        Generado: {new Date(summary.generatedAt).toLocaleString("es-CL")}
      </p>
    </section>
  );
}

function Metric({
  label,
  value,
  note,
}: {
  label: string;
  value: string | number;
  note?: string;
}) {
  return (
    <article
      style={{
        background: "var(--bg-elev)",
        border: "1px solid var(--border)",
        borderRadius: 8,
        padding: 16,
      }}
    >
      <p
        style={{
          color: "var(--text-soft)",
          fontSize: 11,
          fontWeight: 850,
          letterSpacing: "0.04em",
          margin: "0 0 8px",
          textTransform: "uppercase",
        }}
      >
        {label}
      </p>
      <p style={{ color: "var(--text)", fontSize: "1.5rem", fontWeight: 850, margin: "0 0 4px" }}>
        {value}
      </p>
      {note && <p style={{ color: "var(--text-soft)", fontSize: 12, margin: 0 }}>{note}</p>}
    </article>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        background: "var(--bg-elev)",
        border: "1px solid var(--border)",
        borderRadius: 12,
        padding: "18px",
      }}
    >
      <h2
        style={{
          color: "var(--text)",
          fontSize: "1rem",
          fontWeight: 850,
          margin: "0 0 12px",
        }}
      >
        {title}
      </h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>{children}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between" }}>
      <span style={{ color: "var(--text-soft)", fontSize: 14 }}>{label}</span>
      <span style={{ color: "var(--text)", fontSize: 14, fontWeight: 700 }}>{value}</span>
    </div>
  );
}
