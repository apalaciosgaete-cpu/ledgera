"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type TaxEvent = {
  id: string;
  movementId: string;
  eventType: string;
  symbol: string;
  executedAt: string | null;
  quantity: number;
  effectiveTaxCategory: string;
  averageCostUsdAtSale: number;
  proceedsGrossUsd: number;
  proceedsNetUsd: number;
  costBasisUsd: number;
  feeUsd: number;
  realizedPnlUsd: number;
  usdClp: number;
  proceedsGrossClp: number;
  proceedsNetClp: number;
  costBasisClp: number;
  feeClp: number;
  realizedPnlClp: number;
};

type CategorySummary = {
  normalizedTaxType: string;
  label: string;
  count: number;
  totalPnlUsd: number;
  totalPnlClp: number;
};

type EventsData = {
  events: TaxEvent[];
  totals: {
    totalEvents: number;
    totalQuantity: number;
    totalPnlUsd: number;
    totalPnlClp: number;
    totalProceedsGrossUsd: number;
    totalProceedsNetUsd: number;
    totalCostBasisUsd: number;
    totalFeeUsd: number;
  };
  taxSummary: {
    totalEvents: number;
    categories: CategorySummary[];
  };
  taxHealth: {
    status: string;
    score: number;
    issues: { type: string; count: number; message: string }[];
  };
};

function categoryLabel(category: string) {
  switch (category) {
    case "CAPITAL_GAIN": return { text: "Mayor valor", color: "#166534", bg: "#F0FDF4" };
    case "ORDINARY_INCOME": return { text: "Renta ordinaria", color: "#92400E", bg: "#FFFBEB" };
    case "NON_TAXABLE": return { text: "No afecto", color: "#075985", bg: "#E0F2FE" };
    case "UNCLASSIFIED": return { text: "Pendiente", color: "#991B1B", bg: "#FEF2F2" };
    default: return { text: category, color: "#475569", bg: "#F1F5F9" };
  }
}

const formatterUsd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 });
const formatterClp = new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 });

function usd(value: number) { return formatterUsd.format(value || 0); }
function clp(value: number) { return formatterClp.format(value || 0); }

export default function AuditoriaEventosPage() {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(String(currentYear));
  const [symbol, setSymbol] = useState("");
  const [data, setData] = useState<EventsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (year) params.set("year", year);
      if (symbol) params.set("symbol", symbol);
      const res = await fetch(`/api/tax/events?${params.toString()}`, { cache: "no-store" });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.message || "Error cargando eventos.");
      setData(json.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year, symbol]);

  return (
    <div style={{ maxWidth: 1180, width: "100%" }}>
      <section style={{ alignItems: "flex-start", display: "flex", flexWrap: "wrap", gap: 16, justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <p style={{ color: "#0F766E", fontSize: 12, fontWeight: 850, letterSpacing: "0.06em", margin: "0 0 7px", textTransform: "uppercase" }}>Auditoría de eventos</p>
          <h1 style={{ color: "#0F2A3D", fontSize: "1.85rem", fontWeight: 850, lineHeight: 1.12, margin: "0 0 8px" }}>Eventos tributarios</h1>
          <p style={{ color: "#64748B", fontSize: "0.95rem", lineHeight: 1.55, margin: 0 }}>
            Cada taxEvent verificable: clasificación, PnL, costo FIFO y relación con movimiento origen.
          </p>
        </div>
        <Link href="/auditoria" style={{ border: "1px solid #CBD5E1", borderRadius: 8, color: "#0F2A3D", display: "inline-flex", fontSize: 13, fontWeight: 850, padding: "10px 14px", textDecoration: "none" }}>
          Volver a auditoría
        </Link>
      </section>

      {/* Filtros */}
      <section style={{ alignItems: "end", background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 8, display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", marginBottom: 20, padding: 16 }}>
        <label style={{ color: "#475569", display: "grid", fontSize: 13, fontWeight: 750, gap: 6 }}>
          Año
          <select value={year} onChange={(e) => setYear(e.target.value)} style={{ border: "1px solid #CBD5E1", borderRadius: 8, color: "#0F2A3D", minHeight: 40, padding: "0 10px" }}>
            <option value={String(currentYear)}>{currentYear}</option>
            <option value={String(currentYear - 1)}>{currentYear - 1}</option>
            <option value={String(currentYear - 2)}>{currentYear - 2}</option>
          </select>
        </label>
        <label style={{ color: "#475569", display: "grid", fontSize: 13, fontWeight: 750, gap: 6 }}>
          Activo
          <input type="text" value={symbol} onChange={(e) => setSymbol(e.target.value.toUpperCase())} placeholder="BTC, ETH..." style={{ border: "1px solid #CBD5E1", borderRadius: 8, color: "#0F2A3D", fontSize: 14, minHeight: 40, padding: "0 10px" }} />
        </label>
      </section>

      {loading && <p style={{ color: "#64748B", fontSize: 14, fontWeight: 750 }}>Cargando eventos tributarios...</p>}
      {error && <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8, color: "#991B1B", fontWeight: 750, padding: 16 }}>{error}</div>}

      {!loading && data && (
        <>
          {/* Health */}
          <section style={{ background: data.taxHealth.status === "OK" ? "#F0FDF4" : data.taxHealth.status === "REVIEW" ? "#FFFBEB" : "#FEF2F2", border: `2px solid ${data.taxHealth.status === "OK" ? "#86EFAC" : data.taxHealth.status === "REVIEW" ? "#FCD34D" : "#FCA5A5"}`, borderRadius: 12, marginBottom: 20, padding: 18 }}>
            <div style={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 10 }}>
              <span style={{ fontSize: 18 }}>{data.taxHealth.status === "OK" ? "✓" : "⚠"}</span>
              <span style={{ background: "#FFFFFF", borderRadius: 999, color: data.taxHealth.status === "OK" ? "#166534" : data.taxHealth.status === "REVIEW" ? "#92400E" : "#991B1B", display: "inline-flex", fontSize: 13, fontWeight: 850, padding: "6px 12px" }}>
                {data.taxHealth.status === "OK" ? "Salud OK" : data.taxHealth.status === "REVIEW" ? "Requiere revisión" : "Riesgo tributario"} — {data.taxHealth.score}/100
              </span>
              {data.taxHealth.issues.map((issue) => (
                <span key={issue.type} style={{ color: "#991B1B", fontSize: 12, fontWeight: 750 }}>{issue.message}</span>
              ))}
            </div>
          </section>

          {/* KPIs */}
          <section style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", marginBottom: 20 }}>
            <article style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 8, padding: 16 }}>
              <p style={{ color: "#64748B", fontSize: 11, fontWeight: 850, letterSpacing: "0.04em", margin: "0 0 8px", textTransform: "uppercase" }}>Eventos</p>
              <p style={{ color: "#0F2A3D", fontSize: "1.45rem", fontWeight: 850, margin: 0 }}>{data.totals.totalEvents}</p>
            </article>
            <article style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 8, padding: 16 }}>
              <p style={{ color: "#64748B", fontSize: 11, fontWeight: 850, letterSpacing: "0.04em", margin: "0 0 8px", textTransform: "uppercase" }}>PnL USD</p>
              <p style={{ color: data.totals.totalPnlUsd >= 0 ? "#15803D" : "#B45309", fontSize: "1.45rem", fontWeight: 850, margin: 0 }}>{usd(data.totals.totalPnlUsd)}</p>
            </article>
            <article style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 8, padding: 16 }}>
              <p style={{ color: "#64748B", fontSize: 11, fontWeight: 850, letterSpacing: "0.04em", margin: "0 0 8px", textTransform: "uppercase" }}>PnL CLP</p>
              <p style={{ color: data.totals.totalPnlClp >= 0 ? "#15803D" : "#B45309", fontSize: "1.45rem", fontWeight: 850, margin: 0 }}>{clp(data.totals.totalPnlClp)}</p>
            </article>
            <article style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 8, padding: 16 }}>
              <p style={{ color: "#64748B", fontSize: 11, fontWeight: 850, letterSpacing: "0.04em", margin: "0 0 8px", textTransform: "uppercase" }}>Ingreso neto USD</p>
              <p style={{ color: "#0F2A3D", fontSize: "1.45rem", fontWeight: 850, margin: 0 }}>{usd(data.totals.totalProceedsNetUsd)}</p>
            </article>
            <article style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 8, padding: 16 }}>
              <p style={{ color: "#64748B", fontSize: 11, fontWeight: 850, letterSpacing: "0.04em", margin: "0 0 8px", textTransform: "uppercase" }}>Costo FIFO USD</p>
              <p style={{ color: "#0F2A3D", fontSize: "1.45rem", fontWeight: 850, margin: 0 }}>{usd(data.totals.totalCostBasisUsd)}</p>
            </article>
            <article style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 8, padding: 16 }}>
              <p style={{ color: "#64748B", fontSize: 11, fontWeight: 850, letterSpacing: "0.04em", margin: "0 0 8px", textTransform: "uppercase" }}>Fees USD</p>
              <p style={{ color: "#0F2A3D", fontSize: "1.45rem", fontWeight: 850, margin: 0 }}>{usd(data.totals.totalFeeUsd)}</p>
            </article>
          </section>

          {/* Resumen por categoría */}
          {data.taxSummary.categories.length > 0 && (
            <section style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 8, marginBottom: 20, overflow: "hidden" }}>
              <div style={{ padding: "14px 18px", borderBottom: "1px solid #E2E8F0" }}>
                <h3 style={{ color: "#0F2A3D", fontSize: "0.95rem", fontWeight: 850, margin: 0 }}>Resumen por clasificación</h3>
              </div>
              <div style={{ display: "grid", gap: 0 }}>
                {data.taxSummary.categories.map((cat) => {
                  const cfg = categoryLabel(cat.normalizedTaxType === "CAPITAL" ? "CAPITAL_GAIN" : cat.normalizedTaxType === "ORDINARY" ? "ORDINARY_INCOME" : cat.normalizedTaxType === "NON_TAXABLE" ? "NON_TAXABLE" : "UNCLASSIFIED");
                  return (
                    <div key={cat.normalizedTaxType} style={{ alignItems: "center", borderTop: "1px solid #E2E8F0", display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "space-between", padding: "10px 18px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ background: cfg.bg, borderRadius: 999, color: cfg.color, fontSize: 12, fontWeight: 800, padding: "2px 10px" }}>{cfg.text}</span>
                        <span style={{ color: "#64748B", fontSize: 12 }}>{cat.count} evento{cat.count !== 1 ? "s" : ""}</span>
                      </div>
                      <span style={{ color: cat.totalPnlUsd >= 0 ? "#15803D" : "#B45309", fontSize: 13, fontWeight: 750 }}>{usd(cat.totalPnlUsd)}</span>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Tabla de eventos */}
          <section style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 8, overflow: "hidden" }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ borderCollapse: "collapse", minWidth: 1100, width: "100%" }}>
                <thead>
                  <tr style={{ background: "#0F2A3D", color: "#F8FAFC", textAlign: "left" }}>
                    <th style={{ fontSize: 12, fontWeight: 850, padding: "13px 14px" }}>Fecha</th>
                    <th style={{ fontSize: 12, fontWeight: 850, padding: "13px 14px" }}>Activo</th>
                    <th style={{ fontSize: 12, fontWeight: 850, padding: "13px 14px" }}>Cantidad</th>
                    <th style={{ fontSize: 12, fontWeight: 850, padding: "13px 14px" }}>Clasificación</th>
                    <th style={{ fontSize: 12, fontWeight: 850, padding: "13px 14px" }}>Ingreso neto USD</th>
                    <th style={{ fontSize: 12, fontWeight: 850, padding: "13px 14px" }}>Costo FIFO USD</th>
                    <th style={{ fontSize: 12, fontWeight: 850, padding: "13px 14px" }}>PnL USD</th>
                    <th style={{ fontSize: 12, fontWeight: 850, padding: "13px 14px" }}>PnL CLP</th>
                    <th style={{ fontSize: 12, fontWeight: 850, padding: "13px 14px" }}>Movimiento</th>
                  </tr>
                </thead>
                <tbody>
                  {data.events.map((event) => {
                    const cfg = categoryLabel(event.effectiveTaxCategory);
                    return (
                      <tr key={event.id} style={{ borderTop: "1px solid #E2E8F0" }}>
                        <td style={{ color: "#334155", fontSize: 13, padding: "12px 14px", whiteSpace: "nowrap" }}>
                          {event.executedAt ? new Date(event.executedAt).toLocaleDateString("es-CL") : "—"}
                        </td>
                        <td style={{ color: "#0F2A3D", fontSize: 14, fontWeight: 750, padding: "12px 14px" }}>{event.symbol}</td>
                        <td style={{ color: "#334155", fontSize: 13, padding: "12px 14px" }}>{event.quantity}</td>
                        <td style={{ padding: "12px 14px" }}>
                          <span style={{ background: cfg.bg, borderRadius: 999, color: cfg.color, fontSize: 11, fontWeight: 800, padding: "2px 8px", whiteSpace: "nowrap" }}>
                            {cfg.text}
                          </span>
                        </td>
                        <td style={{ color: "#334155", fontSize: 13, padding: "12px 14px" }}>{usd(event.proceedsNetUsd)}</td>
                        <td style={{ color: "#334155", fontSize: 13, padding: "12px 14px" }}>{usd(event.costBasisUsd)}</td>
                        <td style={{ color: event.realizedPnlUsd >= 0 ? "#15803D" : "#B45309", fontSize: 13, fontWeight: 750, padding: "12px 14px" }}>{usd(event.realizedPnlUsd)}</td>
                        <td style={{ color: event.realizedPnlClp >= 0 ? "#15803D" : "#B45309", fontSize: 13, fontWeight: 750, padding: "12px 14px" }}>{clp(event.realizedPnlClp)}</td>
                        <td style={{ color: "#94A3B8", fontSize: 12, fontFamily: "monospace", padding: "12px 14px" }}>{event.movementId.slice(0, 8)}…</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {data.events.length === 0 && (
              <div style={{ padding: "2rem", textAlign: "center" }}>
                <p style={{ color: "#94A3B8", fontWeight: 600, margin: "0 0 4px" }}>Sin eventos tributarios</p>
                <p style={{ color: "#CBD5E1", fontSize: 13, margin: 0 }}>Ajusta el año o el activo para ver resultados.</p>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
