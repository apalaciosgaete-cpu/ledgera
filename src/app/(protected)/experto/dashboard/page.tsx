"use client";

import { useEffect, useState } from "react";

export default function ExpertDashboardPage() {
  const [data, setData] = useState<ExecutiveDashboardResponse["data"] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/dashboard/executive", { cache: "no-store" });
        const json = await res.json();
        if (!json.ok) throw new Error(json.message || "Error cargando dashboard.");
        setData(json.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error desconocido.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  if (loading) return <p>Cargando dashboard ejecutivo...</p>;
  if (error) return <p style={{ color: "var(--loss)" }}>{error}</p>;
  if (!data) return <p>No hay datos disponibles.</p>;

  return (
    <section style={{ padding: "24px 0" }}>
      <header style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 850, margin: "0 0 8px" }}>
          Dashboard Ejecutivo
        </h1>
        <p style={{ color: "var(--text-soft)", margin: 0 }}>
          Visión operacional y tributaria consolidada de LEDGERA.
        </p>
      </header>

      <div
        style={{
          display: "grid",
          gap: 16,
          gridTemplateColumns: "repeat(4, 1fr)",
          marginBottom: 24,
        }}
      >
        <Metric label="Usuarios críticos" value={data.risk.criticalUsers} accent="danger" />
        <Metric label="Alertas críticas" value={data.alerts.critical} accent="danger" />
        <Metric label="DTE pendientes" value={data.tax.dtePending} accent="warn" />
        <Metric label="Pagos pendientes" value={data.billing.pendingPayments} accent="warn" />
      </div>

      <div
        style={{
          display: "grid",
          gap: 16,
          gridTemplateColumns: "repeat(4, 1fr)",
          marginBottom: 24,
        }}
      >
        <Metric label="Riesgo promedio" value={data.risk.averageScore} />
        <Metric label="Conexiones degradadas" value={data.operations.degradedConnections} accent="warn" />
        <Metric label="Errores auditoría" value={data.audit.errorsToday} accent="danger" />
        <Metric label="Suscripciones activas" value={data.billing.activeSubscriptions} accent="good" />
      </div>

      <div
        style={{
          display: "grid",
          gap: 16,
          gridTemplateColumns: "repeat(3, 1fr)",
          marginBottom: 24,
        }}
      >
        <Metric label="Smart Tax Score promedio" value={data.smartTax.averageScore} />
        <Metric label="Usuarios deficientes" value={data.smartTax.deficientUsers} accent="danger" />
        <Metric label="Usuarios óptimos" value={data.smartTax.optimalUsers} accent="good" />
      </div>

      <div
        style={{
          display: "grid",
          gap: 16,
          gridTemplateColumns: "repeat(3, 1fr)",
          marginBottom: 24,
        }}
      >
        <Metric label="Recomendaciones activas" value={data.recommendations.active} />
        <Metric label="Recomendaciones críticas" value={data.recommendations.critical} accent="danger" />
        <Metric label="Usuarios con recomendaciones" value={data.recommendations.pendingUsers} accent="warn" />
      </div>

      <div
        style={{
          display: "grid",
          gap: 16,
          gridTemplateColumns: "repeat(4, 1fr)",
          marginBottom: 24,
        }}
      >
        <Metric label="Tareas pendientes" value={data.tasks.pending} />
        <Metric label="Tareas vencidas" value={data.tasks.overdue} accent="danger" />
        <Metric label="Tareas críticas" value={data.tasks.critical} accent="danger" />
        <Metric label="Tiempo promedio resolución (min)" value={data.tasks.averageResolutionMinutes} />
      </div>

      <div
        style={{
          display: "grid",
          gap: 16,
          gridTemplateColumns: "repeat(3, 1fr)",
          marginBottom: 24,
        }}
      >
        <Metric label="Expedientes críticos" value={data.taxFiles.critical} accent="danger" />
        <Metric label="Expedientes con atención" value={data.taxFiles.attentionRequired} accent="warn" />
        <Metric label="Expedientes saludables" value={data.taxFiles.healthy} accent="good" />
      </div>

      <div
        style={{
          display: "grid",
          gap: 16,
          gridTemplateColumns: "repeat(4, 1fr)",
          marginBottom: 24,
        }}
      >
        <Metric label="Perfiles Optimizados" value={data.adaptiveProfiles.optimized} accent="good" />
        <Metric label="Perfiles Estándar" value={data.adaptiveProfiles.standard} />
        <Metric label="Perfiles con Atención" value={data.adaptiveProfiles.attentionRequired} accent="warn" />
        <Metric label="Perfiles Críticos" value={data.adaptiveProfiles.critical} accent="danger" />
      </div>

      <div
        style={{
          display: "grid",
          gap: 16,
          gridTemplateColumns: "repeat(3, 1fr)",
          alignItems: "start",
        }}
      >
        <Card title="Top Riesgo">
          {data.topRisk.length === 0 ? (
            <Empty />
          ) : (
            <table style={{ width: "100%", fontSize: 13, borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ color: "var(--text-soft)", textAlign: "left" }}>
                  <th style={{ paddingBottom: 8 }}>Usuario</th>
                  <th style={{ paddingBottom: 8 }}>Score</th>
                  <th style={{ paddingBottom: 8 }}>Nivel</th>
                </tr>
              </thead>
              <tbody>
                {data.topRisk.map((row) => (
                  <tr key={row.userId}>
                    <td style={{ padding: "6px 0", borderTop: "1px solid var(--border)" }}>{row.userId}</td>
                    <td style={{ padding: "6px 0", borderTop: "1px solid var(--border)" }}>{row.score}</td>
                    <td style={{ padding: "6px 0", borderTop: "1px solid var(--border)" }}>
                      <LevelBadge level={row.level} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>

        <Card title="Últimas Alertas">
          {data.latestAlerts.length === 0 ? (
            <Empty />
          ) : (
            <table style={{ width: "100%", fontSize: 13, borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ color: "var(--text-soft)", textAlign: "left" }}>
                  <th style={{ paddingBottom: 8 }}>Fecha</th>
                  <th style={{ paddingBottom: 8 }}>Categoría</th>
                  <th style={{ paddingBottom: 8 }}>Severidad</th>
                </tr>
              </thead>
              <tbody>
                {data.latestAlerts.map((row) => (
                  <tr key={row.id}>
                    <td style={{ padding: "6px 0", borderTop: "1px solid var(--border)" }}>
                      {new Date(row.createdAt).toLocaleDateString("es-CL")}
                    </td>
                    <td style={{ padding: "6px 0", borderTop: "1px solid var(--border)" }}>{row.category}</td>
                    <td style={{ padding: "6px 0", borderTop: "1px solid var(--border)" }}>
                      <SeverityBadge severity={row.severity} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>

        <Card title="Eventos Críticos">
          {data.criticalEvents.length === 0 ? (
            <Empty />
          ) : (
            <table style={{ width: "100%", fontSize: 13, borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ color: "var(--text-soft)", textAlign: "left" }}>
                  <th style={{ paddingBottom: 8 }}>Fecha</th>
                  <th style={{ paddingBottom: 8 }}>Evento</th>
                  <th style={{ paddingBottom: 8 }}>Resultado</th>
                </tr>
              </thead>
              <tbody>
                {data.criticalEvents.map((row) => (
                  <tr key={row.id}>
                    <td style={{ padding: "6px 0", borderTop: "1px solid var(--border)" }}>
                      {new Date(row.createdAt).toLocaleDateString("es-CL")}
                    </td>
                    <td style={{ padding: "6px 0", borderTop: "1px solid var(--border)" }}>{row.event}</td>
                    <td style={{ padding: "6px 0", borderTop: "1px solid var(--border)" }}>{row.result}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </div>
    </section>
  );
}

interface ExecutiveDashboardResponse {
  data: {
    metrics: Array<{ key: string; label: string; value: number }>;
    alerts: { open: number; critical: number; resolvedToday: number };
    risk: { averageScore: number; criticalUsers: number; highUsers: number };
    tax: { dtePending: number; dteRejected: number; availableFolios: number; siiDisconnected: number };
    billing: { activeSubscriptions: number; pendingPayments: number; cancelledSubscriptions: number; estimatedMrr: number };
    operations: { degradedConnections: number; failedImports: number; disconnectedExchanges: number };
    audit: { criticalEvents: number; errorsToday: number; totalEventsToday: number };
    smartTax: { averageScore: number; deficientUsers: number; optimalUsers: number };
    recommendations: { active: number; critical: number; pendingUsers: number };
    tasks: { pending: number; overdue: number; critical: number; averageResolutionMinutes: number };
    taxFiles: { critical: number; attentionRequired: number; healthy: number };
    adaptiveProfiles: { optimized: number; standard: number; attentionRequired: number; critical: number };
    topRisk: Array<{ userId: string; score: number; level: string; evaluatedAt: string }>;
    latestAlerts: Array<{
      id: string;
      userId: string;
      category: string;
      severity: string;
      title: string;
      status: string;
      createdAt: string;
    }>;
    criticalEvents: Array<{
      id: string;
      userId: string | null;
      actorId: string | null;
      category: string;
      severity: string;
      event: string;
      description: string;
      result: string;
      createdAt: string;
    }>;
  };
}

function Metric({
  label,
  value,
  accent = "neutral",
}: {
  label: string;
  value: number;
  accent?: "neutral" | "good" | "warn" | "danger";
}) {
  const color =
    accent === "good" ? "#3FA687" : accent === "warn" ? "#E8B84B" : accent === "danger" ? "#C4634A" : "var(--text)";

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
      <p style={{ color, fontSize: "1.75rem", fontWeight: 850, margin: 0 }}>{value}</p>
    </article>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        background: "var(--bg-elev)",
        border: "1px solid var(--border)",
        borderRadius: 8,
        padding: 16,
      }}
    >
      <h2 style={{ fontSize: "1.1rem", margin: "0 0 12px" }}>{title}</h2>
      {children}
    </div>
  );
}

function Empty() {
  return <p style={{ color: "var(--text-soft)", fontSize: 13, margin: 0 }}>Sin registros.</p>;
}

function LevelBadge({ level }: { level: string }) {
  const color =
    level === "CRITICAL" ? "#C4634A" : level === "HIGH" ? "#E8B84B" : level === "MEDIUM" ? "#E8B84B" : "#3FA687";
  return (
    <span style={{ color, fontWeight: 700, fontSize: 12 }}>
      {level}
    </span>
  );
}

function SeverityBadge({ severity }: { severity: string }) {
  const color =
    severity === "CRITICAL" ? "#C4634A" : severity === "HIGH" ? "#E8B84B" : severity === "MEDIUM" ? "#E8B84B" : "#3FA687";
  return (
    <span style={{ color, fontWeight: 700, fontSize: 12 }}>
      {severity}
    </span>
  );
}
