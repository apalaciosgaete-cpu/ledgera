"use client";

import { useEffect, useMemo, useState } from "react";

export default function ExpertAlertsPage() {
  const [alerts, setAlerts] = useState<
    Array<{
      id: string;
      userId: string;
      category: string;
      severity: string;
      title: string;
      message: string;
      status: string;
      source: string | null;
      createdAt: string;
      acknowledgedAt: string | null;
      resolvedAt: string | null;
    }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: "",
    severity: "",
    category: "",
  });

  useEffect(() => {
    async function load() {
      try {
        const params = new URLSearchParams();
        if (filters.status) params.set("status", filters.status);
        if (filters.severity) params.set("severity", filters.severity);
        if (filters.category) params.set("category", filters.category);

        const res = await fetch(`/api/alerts?${params.toString()}`);
        const json = await res.json();
        if (json.ok) setAlerts(json.data);
      } catch (error) {
        console.error("[experto/alertas] error loading alerts", error);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [filters]);

  async function handleAcknowledge(id: string) {
    const res = await fetch(`/api/alerts/${id}/acknowledge`, { method: "PATCH" });
    const json = await res.json();
    if (json.ok) {
      setAlerts((prev) =>
        prev.map((alert) =>
          alert.id === id
            ? { ...alert, status: "ACKNOWLEDGED", acknowledgedAt: new Date().toISOString() }
            : alert,
        ),
      );
    }
  }

  async function handleResolve(id: string) {
    const res = await fetch(`/api/alerts/${id}/resolve`, { method: "PATCH" });
    const json = await res.json();
    if (json.ok) {
      setAlerts((prev) =>
        prev.map((alert) =>
          alert.id === id ? { ...alert, status: "RESOLVED", resolvedAt: new Date().toISOString() } : alert,
        ),
      );
    }
  }

  const dashboard = useMemo(() => {
    const open = alerts.filter((a) => a.status === "OPEN").length;
    const critical = alerts.filter((a) => a.severity === "CRITICAL").length;
    const resolved = alerts.filter((a) => a.status === "RESOLVED").length;
    return { open, critical, resolved };
  }, [alerts]);

  function severityColor(severity: string) {
    switch (severity) {
      case "CRITICAL":
        return "#C4634A";
      case "HIGH":
        return "#E8B84B";
      case "MEDIUM":
        return "#E8B84B";
      default:
        return "#3FA687";
    }
  }

  return (
    <section style={{ padding: "24px 0" }}>
      <header style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 850, margin: "0 0 8px" }}>
          Gestión de Alertas
        </h1>
        <p style={{ color: "var(--text-soft)", margin: 0 }}>
          Monitoreo, filtrado y auditoría de alertas del sistema.
        </p>
      </header>

      <div
        style={{
          display: "grid",
          gap: 16,
          gridTemplateColumns: "repeat(3, 1fr)",
          marginBottom: 24,
        }}
      >
        <Metric label="Abiertas" value={dashboard.open} accent="warn" />
        <Metric label="Críticas" value={dashboard.critical} accent="danger" />
        <Metric label="Resueltas" value={dashboard.resolved} accent="good" />
      </div>

      <div
        style={{
          background: "var(--bg-elev)",
          border: "1px solid var(--border)",
          borderRadius: 8,
          marginBottom: 24,
          padding: 16,
        }}
      >
        <h2 style={{ fontSize: "1.1rem", margin: "0 0 12px" }}>Filtros</h2>
        <div style={{ display: "flex", gap: 12 }}>
          <FilterSelect
            label="Estado"
            value={filters.status}
            options={["", "OPEN", "ACKNOWLEDGED", "RESOLVED"]}
            onChange={(value) => setFilters((f) => ({ ...f, status: value }))}
          />
          <FilterSelect
            label="Severidad"
            value={filters.severity}
            options={["", "LOW", "MEDIUM", "HIGH", "CRITICAL"]}
            onChange={(value) => setFilters((f) => ({ ...f, severity: value }))}
          />
          <FilterSelect
            label="Categoría"
            value={filters.category}
            options={["", "TRIBUTARY", "OPERATIONAL", "COMMERCIAL", "SECURITY", "COMPLIANCE"]}
            onChange={(value) => setFilters((f) => ({ ...f, category: value }))}
          />
        </div>
      </div>

      {loading ? (
        <p>Cargando alertas...</p>
      ) : alerts.length === 0 ? (
        <p style={{ color: "var(--text-soft)" }}>No hay alertas que coincidan con los filtros.</p>
      ) : (
        <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
          {alerts.map((alert) => (
            <li
              key={alert.id}
              style={{
                background: "var(--bg-elev)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                marginBottom: 12,
                padding: 16,
              }}
            >
              <div style={{ alignItems: "center", display: "flex", marginBottom: 8 }}>
                <span
                  style={{
                    background: severityColor(alert.severity),
                    borderRadius: "50%",
                    height: 10,
                    marginRight: 8,
                    width: 10,
                  }}
                />
                <strong style={{ flex: 1 }}>{alert.title}</strong>
                <span
                  style={{
                    background: "var(--bg-sunken)",
                    borderRadius: 4,
                    color: "var(--text)",
                    fontSize: 12,
                    padding: "2px 8px",
                  }}
                >
                  {alert.status}
                </span>
              </div>
              <p style={{ color: "var(--text)", margin: "0 0 8px" }}>{alert.message}</p>
              <p style={{ color: "var(--text-soft)", fontSize: 12, margin: "0 0 12px" }}>
                Usuario {alert.userId} · {alert.category} · {alert.severity} ·{" "}
                {new Date(alert.createdAt).toLocaleDateString("es-CL")}
                {alert.source ? ` · Fuente: ${alert.source}` : ""}
              </p>
              <div style={{ display: "flex", gap: 8 }}>
                {alert.status === "OPEN" && (
                  <button
                    onClick={() => handleAcknowledge(alert.id)}
                    style={{
                      background: "var(--bg-sunken)",
                      border: "none",
                      borderRadius: 4,
                      color: "var(--text)",
                      cursor: "pointer",
                      fontSize: 12,
                      padding: "6px 12px",
                    }}
                  >
                    Reconocer
                  </button>
                )}
                {(alert.status === "OPEN" || alert.status === "ACKNOWLEDGED") && (
                  <button
                    onClick={() => handleResolve(alert.id)}
                    style={{
                      background: "var(--accent)",
                      border: "none",
                      borderRadius: 4,
                      color: "var(--text)",
                      cursor: "pointer",
                      fontSize: 12,
                      padding: "6px 12px",
                    }}
                  >
                    Resolver
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function Metric({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent: "good" | "warn" | "danger" | "info";
}) {
  const color =
    accent === "good" ? "#3FA687" : accent === "warn" ? "#E8B84B" : accent === "danger" ? "#C4634A" : "#3FA687";

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

function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <label style={{ display: "flex", flexDirection: "column", fontSize: 12, gap: 4 }}>
      {label}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          border: "1px solid var(--border)",
          borderRadius: 4,
          fontSize: 13,
          padding: "6px 8px",
        }}
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt || "Todos"}
          </option>
        ))}
      </select>
    </label>
  );
}
