"use client";

import { useEffect, useMemo, useState } from "react";

export default function ExpertAuditPage() {
  const [events, setEvents] = useState<
    Array<{
      id: string;
      userId: string | null;
      actorId: string | null;
      category: string;
      severity: string;
      event: string;
      description: string;
      result: string;
      createdAt: string;
    }>
  >([]);
  const [filters, setFilters] = useState({
    category: "",
    severity: "",
    result: "",
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const params = new URLSearchParams();
        if (filters.category) params.set("category", filters.category);
        if (filters.severity) params.set("severity", filters.severity);
        if (filters.result) params.set("result", filters.result);

        const res = await fetch(`/api/audit/events?${params.toString()}`);
        const json = await res.json();
        if (json.ok) setEvents(json.data);
      } catch (error) {
        console.error("[experto/auditoria] error loading events", error);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [filters]);

  const dashboard = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    return {
      today: events.filter((e) => e.createdAt.startsWith(today)).length,
      errors: events.filter((e) => e.result === "FAILED").length,
      criticals: events.filter((e) => e.severity === "CRITICAL").length,
      categories: Array.from(new Set(events.map((e) => e.category))).length,
    };
  }, [events]);

  function severityColor(severity: string) {
    switch (severity) {
      case "CRITICAL":
        return "#C4634A";
      case "ERROR":
        return "#E8B84B";
      case "WARNING":
        return "#E8B84B";
      default:
        return "#3FA687";
    }
  }

  function escapeCsv(value: string) {
    return '"' + value.replace(/"/g, '""') + '"';
  }

  function exportCsv() {
    const headers = ["id", "userId", "actorId", "category", "severity", "event", "description", "result", "createdAt"];
    const rows = events.map((e) =>
      [e.id, e.userId ?? "", e.actorId ?? "", e.category, e.severity, e.event, e.description, e.result, e.createdAt]
        .map(String)
        .map(escapeCsv)
        .join(","),
    );
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "audit-events.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  function exportJson() {
    const blob = new Blob([JSON.stringify(events, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "audit-events.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section style={{ padding: "24px 0" }}>
      <header style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 850, margin: "0 0 8px" }}>
          Auditoría Continua
        </h1>
        <p style={{ color: "var(--text-soft)", margin: 0 }}>
          Trazabilidad completa de acciones relevantes del sistema.
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
        <Metric label="Hoy" value={dashboard.today} />
        <Metric label="Errores" value={dashboard.errors} accent="danger" />
        <Metric label="Críticos" value={dashboard.criticals} accent="danger" />
        <Metric label="Categorías" value={dashboard.categories} />
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
        <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
          <FilterSelect
            label="Categoría"
            value={filters.category}
            options={["", "AUTH", "USER", "TAX", "DTE", "SII", "BILLING", "ALERT", "RISK", "CONNECTION", "OPERATION", "SECURITY", "ADMIN"]}
            onChange={(value) => setFilters((f) => ({ ...f, category: value }))}
          />
          <FilterSelect
            label="Severidad"
            value={filters.severity}
            options={["", "INFO", "WARNING", "ERROR", "CRITICAL"]}
            onChange={(value) => setFilters((f) => ({ ...f, severity: value }))}
          />
          <FilterSelect
            label="Resultado"
            value={filters.result}
            options={["", "SUCCESS", "FAILED", "PARTIAL"]}
            onChange={(value) => setFilters((f) => ({ ...f, result: value }))}
          />
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={exportCsv}
            style={{
              background: "var(--bg-sunken)",
              border: "none",
              borderRadius: 4,
              color: "var(--text)",
              cursor: "pointer",
              fontSize: 13,
              padding: "8px 12px",
            }}
          >
            Exportar CSV
          </button>
          <button
            onClick={exportJson}
            style={{
              background: "var(--bg-sunken)",
              border: "none",
              borderRadius: 4,
              color: "var(--text)",
              cursor: "pointer",
              fontSize: 13,
              padding: "8px 12px",
            }}
          >
            Exportar JSON
          </button>
        </div>
      </div>

      {loading ? (
        <p>Cargando...</p>
      ) : events.length === 0 ? (
        <p style={{ color: "var(--text-soft)" }}>No hay eventos que coincidan con los filtros.</p>
      ) : (
        <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
          {events.map((event) => (
            <li
              key={event.id}
              style={{
                background: "var(--bg-elev)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                marginBottom: 12,
                padding: 16,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <strong>{event.event}</strong>
                <span style={{ color: severityColor(event.severity), fontSize: 12, fontWeight: 700 }}>
                  {event.severity}
                </span>
              </div>
              <p style={{ color: "var(--text)", margin: "0 0 8px" }}>{event.description}</p>
              <p style={{ color: "var(--text-soft)", fontSize: 12, margin: 0 }}>
                {event.category} · {event.result} · Usuario {event.userId ?? "—"} · Actor{" "}
                {event.actorId ?? "—"} · {new Date(event.createdAt).toLocaleString("es-CL")}
              </p>
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
  accent = "neutral",
}: {
  label: string;
  value: number;
  accent?: "neutral" | "danger";
}) {
  const color = accent === "danger" ? "#C4634A" : "var(--text)";

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
