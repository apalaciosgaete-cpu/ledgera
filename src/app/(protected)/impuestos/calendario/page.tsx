"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Milestone = {
  label: string;
  date: string;
  type: "today" | "milestone" | "payment";
  daysUntil: number;
  passed: boolean;
};

type Alert = {
  type: "urgent" | "warning" | "info";
  label: string;
  detail: string;
};

type CalendarData = {
  year: number;
  hasMovements: boolean;
  hasSell: boolean;
  hasStaking: boolean;
  basePositive: boolean;
  milestones: Milestone[];
  alerts: Alert[];
};

function alertToken(type: Alert["type"]) {
  switch (type) {
    case "urgent": return { bg: "#FEF2F2", border: "#FCA5A5", color: "#991B1B", icon: "⚠" };
    case "warning": return { bg: "#FEF9C3", border: "#FDE047", color: "#854D0E", icon: "!" };
    case "info": return { bg: "#F0FDF4", border: "#86EFAC", color: "#166534", icon: "i" };
  }
}

function milestoneColor(type: Milestone["type"], passed: boolean) {
  if (passed) return { bg: "#F1F5F9", border: "#CBD5E1", color: "#94A3B8" };
  if (type === "today") return { bg: "#0F766E", border: "#0F766E", color: "#FFFFFF" };
  if (type === "payment") return { bg: "#FEF9C3", border: "#FDE047", color: "#854D0E" };
  return { bg: "#E0F2FE", border: "#7DD3FC", color: "#075985" };
}

export default function CalendarioPage() {
  const [data, setData] = useState<CalendarData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/tax/calendar", { cache: "no-store" });
        const json = await res.json();
        if (!res.ok || !json.ok) throw new Error(json.message || "No se pudo cargar el calendario.");
        setData(json.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error cargando calendario.");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  return (
    <div style={{ maxWidth: 800, width: "100%" }}>
      <section style={{ alignItems: "flex-start", display: "flex", flexWrap: "wrap", gap: 16, justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <p style={{ color: "#0F766E", fontSize: 12, fontWeight: 850, letterSpacing: "0.06em", margin: "0 0 7px", textTransform: "uppercase" }}>Calendario tributario</p>
          <h1 style={{ color: "#0F2A3D", fontSize: "1.85rem", fontWeight: 850, lineHeight: 1.12, margin: "0 0 8px" }}>¿Qué viene ahora?</h1>
          <p style={{ color: "#64748B", fontSize: "0.95rem", lineHeight: 1.55, margin: 0 }}>
            Fechas clave, alertas y obligaciones tributarias del año.
          </p>
        </div>
        <Link href="/impuestos" style={{ border: "1px solid #CBD5E1", borderRadius: 8, color: "#0F2A3D", display: "inline-flex", fontSize: 13, fontWeight: 850, padding: "10px 14px", textDecoration: "none" }}>
          Volver al centro tributario
        </Link>
      </section>

      {loading ? (
        <p style={{ color: "#64748B", fontSize: 14, fontWeight: 750 }}>Cargando calendario...</p>
      ) : error ? (
        <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8, color: "#991B1B", fontWeight: 750, padding: 16 }}>
          {error}
        </div>
      ) : data ? (
        <>
          {data.alerts.length > 0 && (
            <section style={{ marginBottom: 24 }}>
              {data.alerts.map((alert, i) => {
                const token = alertToken(alert.type);
                return (
                  <div key={i} style={{ background: token.bg, border: `1px solid ${token.border}`, borderRadius: 8, color: token.color, fontWeight: 750, marginBottom: 8, padding: "14px 16px" }}>
                    <p style={{ margin: "0 0 4px" }}>{token.icon} {alert.label}</p>
                    <p style={{ fontSize: 13, fontWeight: 400, lineHeight: 1.5, margin: 0 }}>{alert.detail}</p>
                  </div>
                );
              })}
            </section>
          )}

          <section style={{ marginBottom: 24 }}>
            <h2 style={{ color: "#0F2A3D", fontSize: "1rem", fontWeight: 850, margin: "0 0 14px" }}>Línea de tiempo {data.year}</h2>
            <div style={{ display: "grid", gap: 10 }}>
              {data.milestones.map((m, i) => {
                const token = milestoneColor(m.type, m.passed);
                const dateStr = new Date(m.date).toLocaleDateString("es-CL", { day: "numeric", month: "long" });
                return (
                  <div key={i} style={{ alignItems: "center", background: token.bg, border: `1px solid ${token.border}`, borderRadius: 8, display: "flex", flexWrap: "wrap", gap: 12, padding: "12px 16px" }}>
                    <div style={{ background: token.color, borderRadius: 999, flexShrink: 0, height: 10, width: 10 }} />
                    <div style={{ flex: 1, minWidth: 160 }}>
                      <p style={{ color: token.color, fontSize: 14, fontWeight: 850, margin: 0 }}>{m.label}</p>
                    </div>
                    <p style={{ color: m.passed ? "#94A3B8" : "#475569", fontSize: 13, fontWeight: 750, margin: 0 }}>
                      {dateStr}
                    </p>
                    {m.type !== "today" && (
                      <p style={{ color: m.passed ? "#94A3B8" : m.daysUntil <= 30 ? "#B45309" : "#64748B", fontSize: 12, fontWeight: 750, margin: 0 }}>
                        {m.passed ? "Completado" : m.daysUntil === 0 ? "Hoy" : `En ${m.daysUntil} días`}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          <section style={{ background: "#F8FAFC", border: "1px solid #CBD5E1", borderRadius: 8, padding: 18 }}>
            <h2 style={{ color: "#0F2A3D", fontSize: "1rem", fontWeight: 850, margin: "0 0 10px" }}>¿Necesitas ayuda?</h2>
            <p style={{ color: "#64748B", fontSize: 13, lineHeight: 1.55, margin: "0 0 10px" }}>
              Las fechas son referenciales para el calendario tributario chileno. Valida con tu contador las fechas exactas del año en curso.
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              <Link href="/impuestos/resumen" style={{ color: "#0F766E", fontSize: 13, fontWeight: 850, textDecoration: "none" }}>
                Ver resumen →
              </Link>
              <Link href="/impuestos/simulador" style={{ color: "#0F766E", fontSize: 13, fontWeight: 850, textDecoration: "none" }}>
                Simular venta →
              </Link>
              <Link href="/impuestos/revision" style={{ color: "#0F766E", fontSize: 13, fontWeight: 850, textDecoration: "none" }}>
                Revisar eventos →
              </Link>
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}
