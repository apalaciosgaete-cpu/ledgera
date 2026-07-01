"use client";

import { useEffect, useState } from "react";

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<
    Array<{
      id: string;
      category: string;
      severity: string;
      title: string;
      message: string;
      status: string;
      createdAt: string;
    }>
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/alerts");
        const json = await res.json();
        if (json.ok) setAlerts(json.data);
      } catch (error) {
        console.error("[alertas] error loading alerts", error);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  async function handleAcknowledge(id: string) {
    const res = await fetch(`/api/alerts/${id}/acknowledge`, { method: "PATCH" });
    const json = await res.json();
    if (json.ok) {
      setAlerts((prev) =>
        prev.map((alert) => (alert.id === id ? { ...alert, status: "ACKNOWLEDGED" } : alert)),
      );
    }
  }

  async function handleResolve(id: string) {
    const res = await fetch(`/api/alerts/${id}/resolve`, { method: "PATCH" });
    const json = await res.json();
    if (json.ok) {
      setAlerts((prev) =>
        prev.map((alert) => (alert.id === id ? { ...alert, status: "RESOLVED" } : alert)),
      );
    }
  }

  function severityDot(severity: string) {
    const color =
      severity === "CRITICAL"
        ? "#C4634A"
        : severity === "HIGH"
          ? "#E8B84B"
          : severity === "MEDIUM"
            ? "#E8B84B"
            : "#3FA687";
    return (
      <span
        style={{
          background: color,
          borderRadius: "50%",
          display: "inline-block",
          height: 10,
          marginRight: 8,
          width: 10,
        }}
      />
    );
  }

  return (
    <section style={{ padding: 24 }}>
      <header style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 850, margin: "0 0 8px" }}>
          Centro de Alertas
        </h1>
        <p style={{ color: "var(--text-soft)", margin: 0 }}>
          Monitoreo preventivo de eventos relevantes para tu situación tributaria.
        </p>
      </header>

      {loading ? (
        <p>Cargando alertas...</p>
      ) : alerts.length === 0 ? (
        <p style={{ color: "var(--text-soft)" }}>No tienes alertas pendientes.</p>
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
                {severityDot(alert.severity)}
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
              <p style={{ color: "var(--text)", margin: "0 0 12px" }}>{alert.message}</p>
              <div style={{ alignItems: "center", display: "flex", gap: 8 }}>
                <span style={{ color: "var(--text-soft)", fontSize: 12 }}>
                  {alert.category} · {new Date(alert.createdAt).toLocaleDateString("es-CL")}
                </span>
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
                      padding: "4px 8px",
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
                      padding: "4px 8px",
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
