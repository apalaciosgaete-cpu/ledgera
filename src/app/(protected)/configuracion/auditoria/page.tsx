"use client";

import { useEffect, useState } from "react";

export default function UserAuditPage() {
  const [events, setEvents] = useState<
    Array<{
      id: string;
      category: string;
      event: string;
      description: string;
      result: string;
      createdAt: string;
    }>
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/audit/events");
        const json = await res.json();
        if (json.ok) setEvents(json.data);
      } catch (error) {
        console.error("[configuracion/auditoria] error loading events", error);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  function resultColor(result: string) {
    switch (result) {
      case "SUCCESS":
        return "#16A34A";
      case "FAILED":
        return "#DC2626";
      case "PARTIAL":
        return "#CA8A04";
      default:
        return "#64748B";
    }
  }

  return (
    <section style={{ padding: 24 }}>
      <header style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 850, margin: "0 0 8px" }}>
          Auditoría de cuenta
        </h1>
        <p style={{ color: "#64748B", margin: 0 }}>
          Registro de acciones relevantes en tu cuenta.
        </p>
      </header>

      {loading ? (
        <p>Cargando...</p>
      ) : events.length === 0 ? (
        <p style={{ color: "#64748B" }}>No hay eventos registrados.</p>
      ) : (
        <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
          {events.map((event) => (
            <li
              key={event.id}
              style={{
                background: "#FFFFFF",
                border: "1px solid #E2E8F0",
                borderRadius: 8,
                marginBottom: 12,
                padding: 16,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <strong>{event.event}</strong>
                <span style={{ color: resultColor(event.result), fontSize: 12, fontWeight: 700 }}>
                  {event.result}
                </span>
              </div>
              <p style={{ color: "#475569", margin: "0 0 8px" }}>{event.description}</p>
              <p style={{ color: "#64748B", fontSize: 12, margin: 0 }}>
                {event.category} · {new Date(event.createdAt).toLocaleString("es-CL")}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
