"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { clp, usd } from "@/shared/formatting";

type TaxEvent = {
  movementId: string;
  symbol: string;
  executedAt: string;
  quantity: number;
  priceUsd: number;
  costBasisUsd: number;
  realizedPnlUsd: number;
  realizedPnlClp: number;
  proceedsNetClp: number;
};

type Alert = {
  type: string;
  severity: "high" | "medium" | "low";
  label: string;
  detail: string;
};

type ReviewData = {
  events: TaxEvent[];
  totalEvents: number;
  totalPnlClp: number;
  availableYears: number[];
  availableSymbols: string[];
  filters: { year: number | null; symbol: string | null };
  alerts: Alert[];
  health: "OK" | "REVIEW" | "RISK";
  sellWithoutEvent: number;
};

function healthToken(health: ReviewData["health"]) {
  switch (health) {
    case "OK": return { bg: "#F0FDF4", border: "#86EFAC", color: "#166534", label: "Saludable", icon: "✓" };
    case "REVIEW": return { bg: "#FEF9C3", border: "#FDE047", color: "#854D0E", label: "Requiere revisión", icon: "!" };
    case "RISK": return { bg: "#FEF2F2", border: "#FCA5A5", color: "#991B1B", label: "Crítico", icon: "⚠" };
  }
}

export default function RevisionPage() {
  const [data, setData] = useState<ReviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [year, setYear] = useState<string>("");
  const [symbol, setSymbol] = useState<string>("");

  async function load(y?: string, s?: string) {
    try {
      setLoading(true);
      setError("");
      const params = new URLSearchParams();
      if (y) params.set("year", y);
      if (s) params.set("symbol", s);
      const res = await fetch(`/api/tax/review?${params.toString()}`, { cache: "no-store" });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.message || "No se pudo cargar la revisión.");
      setData(json.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error cargando revisión.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  useEffect(() => {
    if (!data) return;
    const timer = setTimeout(() => void load(year, symbol), 300);
    return () => clearTimeout(timer);
  }, [year, symbol]);

  const health = data ? healthToken(data.health) : healthToken("OK");

  return (
    <div style={{ maxWidth: 1180, width: "100%" }}>
      <section style={{ alignItems: "flex-start", display: "flex", flexWrap: "wrap", gap: 16, justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <p style={{ color: "#0F766E", fontSize: 12, fontWeight: 850, letterSpacing: "0.06em", margin: "0 0 7px", textTransform: "uppercase" }}>Revisión tributaria</p>
          <h1 style={{ color: "#0F2A3D", fontSize: "1.85rem", fontWeight: 850, lineHeight: 1.12, margin: "0 0 8px" }}>Revisa antes de declarar</h1>
          <p style={{ color: "#64748B", fontSize: "0.95rem", lineHeight: 1.55, margin: 0 }}>
            Eventos tributarios, alertas e inconsistencias. Todo en un solo lugar.
          </p>
        </div>
        <Link href="/impuestos" style={{ border: "1px solid #CBD5E1", borderRadius: 8, color: "#0F2A3D", display: "inline-flex", fontSize: 13, fontWeight: 850, padding: "10px 14px", textDecoration: "none" }}>
          Volver al centro tributario
        </Link>
      </section>

      {loading && !data ? (
        <p style={{ color: "#64748B", fontSize: 14, fontWeight: 750 }}>Cargando revisión...</p>
      ) : error ? (
        <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8, color: "#991B1B", fontWeight: 750, padding: 16 }}>
          {error}
        </div>
      ) : data ? (
        <>
          <section style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", marginBottom: 20 }}>
            <article style={{ background: health.bg, border: `2px solid ${health.border}`, borderRadius: 8, padding: 16 }}>
              <p style={{ color: "#64748B", fontSize: 11, fontWeight: 850, letterSpacing: "0.04em", margin: "0 0 8px", textTransform: "uppercase" }}>Estado</p>
              <p style={{ color: health.color, fontSize: "1.45rem", fontWeight: 850, lineHeight: 1.15, margin: "0 0 6px" }}>{health.icon} {health.label}</p>
              <p style={{ color: "#64748B", fontSize: 13, margin: 0 }}>{data.totalEvents} eventos revisados</p>
            </article>
            <article style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 8, padding: 16 }}>
              <p style={{ color: "#64748B", fontSize: 11, fontWeight: 850, letterSpacing: "0.04em", margin: "0 0 8px", textTransform: "uppercase" }}>Resultado neto</p>
              <p style={{ color: data.totalPnlClp >= 0 ? "#15803D" : "#B45309", fontSize: "1.45rem", fontWeight: 850, lineHeight: 1.15, margin: "0 0 6px" }}>{clp(data.totalPnlClp)}</p>
              <p style={{ color: "#64748B", fontSize: 13, margin: 0 }}>Suma de eventos filtrados</p>
            </article>
            <article style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 8, padding: 16 }}>
              <p style={{ color: "#64748B", fontSize: 11, fontWeight: 850, letterSpacing: "0.04em", margin: "0 0 8px", textTransform: "uppercase" }}>Ventas sin evento</p>
              <p style={{ color: data.sellWithoutEvent > 0 ? "#B45309" : "#15803D", fontSize: "1.45rem", fontWeight: 850, lineHeight: 1.15, margin: "0 0 6px" }}>{data.sellWithoutEvent}</p>
              <p style={{ color: "#64748B", fontSize: 13, margin: 0 }}>{data.sellWithoutEvent > 0 ? "Revisar inconsistencias" : "Sin inconsistencias"}</p>
            </article>
          </section>

          {data.alerts.length > 0 && (
            <section style={{ marginBottom: 20 }}>
              {data.alerts.map((alert, i) => (
                <div key={i} style={{ background: alert.severity === "high" ? "#FEF2F2" : "#FEF9C3", border: `1px solid ${alert.severity === "high" ? "#FCA5A5" : "#FDE047"}`, borderRadius: 8, color: alert.severity === "high" ? "#991B1B" : "#854D0E", fontWeight: 750, marginBottom: 8, padding: "14px 16px" }}>
                  <p style={{ margin: "0 0 4px" }}>{alert.label}</p>
                  <p style={{ fontSize: 13, fontWeight: 400, lineHeight: 1.5, margin: 0 }}>{alert.detail}</p>
                </div>
              ))}
            </section>
          )}

          <section style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 8, marginBottom: 20, padding: 16 }}>
            <div style={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 14 }}>
              <label style={{ alignItems: "center", color: "#475569", display: "inline-flex", fontSize: 13, fontWeight: 750, gap: 8 }}>
                Año
                <select
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  style={{ background: "#FFFFFF", border: "1px solid #CBD5E1", borderRadius: 8, color: "#0F2A3D", fontSize: 13, fontWeight: 750, minHeight: 38, padding: "0 10px" }}
                >
                  <option value="">Todos</option>
                  {data.availableYears.map((y) => (
                    <option key={y} value={String(y)}>{y}</option>
                  ))}
                </select>
              </label>
              <label style={{ alignItems: "center", color: "#475569", display: "inline-flex", fontSize: 13, fontWeight: 750, gap: 8 }}>
                Activo
                <select
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value)}
                  style={{ background: "#FFFFFF", border: "1px solid #CBD5E1", borderRadius: 8, color: "#0F2A3D", fontSize: 13, fontWeight: 750, minHeight: 38, padding: "0 10px" }}
                >
                  <option value="">Todos</option>
                  {data.availableSymbols.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </label>
            </div>

            {data.events.length === 0 ? (
              <p style={{ color: "#64748B", fontSize: 14, margin: 0, textAlign: "center" }}>No hay eventos tributarios con los filtros seleccionados.</p>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ borderCollapse: "collapse", minWidth: 780, width: "100%" }}>
                  <thead>
                    <tr style={{ background: "#0F2A3D", color: "#F8FAFC", textAlign: "left" }}>
                      <th style={{ fontSize: 12, fontWeight: 850, padding: "13px 14px" }}>Fecha</th>
                      <th style={{ fontSize: 12, fontWeight: 850, padding: "13px 14px" }}>Activo</th>
                      <th style={{ fontSize: 12, fontWeight: 850, padding: "13px 14px", textAlign: "right" }}>Cantidad</th>
                      <th style={{ fontSize: 12, fontWeight: 850, padding: "13px 14px", textAlign: "right" }}>Precio USD</th>
                      <th style={{ fontSize: 12, fontWeight: 850, padding: "13px 14px", textAlign: "right" }}>Costo</th>
                      <th style={{ fontSize: 12, fontWeight: 850, padding: "13px 14px", textAlign: "right" }}>Resultado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.events.map((event) => {
                      const positive = event.realizedPnlClp >= 0;
                      return (
                        <tr key={event.movementId} style={{ borderTop: "1px solid #E2E8F0" }}>
                          <td style={{ color: "#334155", fontSize: 13, padding: "14px" }}>
                            {new Date(event.executedAt).toLocaleDateString("es-CL")}
                          </td>
                          <td style={{ color: "#0F2A3D", fontSize: 14, fontWeight: 850, padding: "14px" }}>{event.symbol}</td>
                          <td style={{ color: "#334155", fontSize: 13, padding: "14px", textAlign: "right" }}>{event.quantity}</td>
                          <td style={{ color: "#334155", fontSize: 13, padding: "14px", textAlign: "right" }}>{usd(event.priceUsd)}</td>
                          <td style={{ color: "#334155", fontSize: 13, padding: "14px", textAlign: "right" }}>{usd(event.costBasisUsd)}</td>
                          <td style={{ color: positive ? "#15803D" : "#B45309", fontSize: 13, fontWeight: 850, padding: "14px", textAlign: "right" }}>
                            {clp(event.realizedPnlClp)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section style={{ background: "#F8FAFC", border: "1px solid #CBD5E1", borderRadius: 8, padding: 16 }}>
            <p style={{ color: "#0F2A3D", fontSize: 14, fontWeight: 850, margin: "0 0 6px" }}>¿Necesitas entender por qué?</p>
            <p style={{ color: "#64748B", fontSize: 13, lineHeight: 1.5, margin: "0 0 10px" }}>
              Revisa el impacto por activo y las operaciones relevantes en la sección de explicación.
            </p>
            <Link href="/impuestos" style={{ color: "#0F766E", fontSize: 13, fontWeight: 850, textDecoration: "none" }}>
              Ver explicación tributaria →
            </Link>
          </section>
        </>
      ) : null}
    </div>
  );
}
