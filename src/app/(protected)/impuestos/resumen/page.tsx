"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type SummaryRow = {
  year: number;
  symbol: string;
  eventsCount: number;
  quantitySold: number;
  proceedsNetUsd: number;
  costBasisUsd: number;
  feeUsd: number;
  realizedPnlUsd: number;
  proceedsNetClp: number;
  costBasisClp: number;
  feeClp: number;
  realizedPnlClp: number;
};

type SummaryDecision = {
  status: "EMPTY" | "NO_TAX_EVENTS" | "DECLARE_REVIEW" | "PAY_REVIEW" | "LOSS_REVIEW";
  label: string;
  headline: string;
  detail: string;
  shouldDeclare: boolean;
  likelyPayment: boolean;
};

type SummaryData = {
  usdClp: number;
  availableYears: number[];
  decision: SummaryDecision;
  nextAction: {
    label: string;
    href: string;
  };
  rows: SummaryRow[];
  totals: {
    eventsCount: number;
    quantitySold: number;
    proceedsNetUsd: number;
    costBasisUsd: number;
    feeUsd: number;
    realizedPnlUsd: number;
    proceedsNetClp: number;
    costBasisClp: number;
    feeClp: number;
    realizedPnlClp: number;
    stakingRewardUsd: number;
    stakingRewardClp: number;
    stakingCount: number;
  };
};

type SummaryResponse = {
  ok: boolean;
  message?: string;
  data?: SummaryData;
};

const formatterClp = new Intl.NumberFormat("es-CL", {
  style: "currency",
  currency: "CLP",
  maximumFractionDigits: 0,
});

const formatterUsd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

const formatterNumber = new Intl.NumberFormat("es-CL", {
  maximumFractionDigits: 8,
});

function clp(value: number) {
  return formatterClp.format(value || 0);
}

function usd(value: number) {
  return formatterUsd.format(value || 0);
}

function buildQuery(year: string, symbol: string) {
  const params = new URLSearchParams();
  if (year) params.set("year", year);
  if (symbol) params.set("symbol", symbol.toUpperCase());
  const query = params.toString();
  return query ? `?${query}` : "";
}

function decisionTone(status: SummaryDecision["status"]) {
  if (status === "PAY_REVIEW") return { bg: "#FEF3C7", border: "#FCD34D", color: "#92400E" };
  if (status === "LOSS_REVIEW") return { bg: "#E0F2FE", border: "#7DD3FC", color: "#075985" };
  if (status === "NO_TAX_EVENTS") return { bg: "#DCFCE7", border: "#86EFAC", color: "#166534" };
  if (status === "EMPTY") return { bg: "#F8FAFC", border: "#CBD5E1", color: "#334155" };
  return { bg: "#ECFDF5", border: "#99F6E4", color: "#0F766E" };
}

function Metric({ label, value, note, color = "#0F2A3D" }: { label: string; value: string; note: string; color?: string }) {
  return (
    <article style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 8, minHeight: 112, padding: 16 }}>
      <p style={{ color: "#64748B", fontSize: 11, fontWeight: 850, letterSpacing: "0.04em", margin: "0 0 8px", textTransform: "uppercase" }}>{label}</p>
      <p style={{ color, fontSize: "1.45rem", fontWeight: 850, lineHeight: 1.15, margin: "0 0 6px" }}>{value}</p>
      <p style={{ color: "#64748B", fontSize: 13, lineHeight: 1.45, margin: 0 }}>{note}</p>
    </article>
  );
}

export default function TaxSummaryPage() {
  const currentYear = String(new Date().getFullYear());
  const [data, setData] = useState<SummaryData | null>(null);
  const [year, setYear] = useState(currentYear);
  const [symbol, setSymbol] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadSummary(nextYear = year, nextSymbol = symbol) {
    try {
      const response = await fetch(`/api/tax/summary${buildQuery(nextYear, nextSymbol)}`, { cache: "no-store" });
      const json = (await response.json()) as SummaryResponse;

      if (!response.ok || !json.ok || !json.data) {
        throw new Error(json.message ?? "No se pudo cargar el resumen tributario.");
      }

      setData(json.data);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo cargar el resumen tributario.");
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadSummary(currentYear, "");
    }, 0);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const decision = data?.decision;
  const tone = decision ? decisionTone(decision.status) : decisionTone("EMPTY");
  const pnlColor = (data?.totals.realizedPnlClp ?? 0) >= 0 ? "#15803D" : "#B45309";
  const sortedRows = useMemo(() => [...(data?.rows ?? [])].sort((a, b) => b.realizedPnlClp - a.realizedPnlClp), [data?.rows]);

  return (
    <div style={{ maxWidth: 1180, width: "100%" }}>
      <section style={{ alignItems: "flex-start", display: "flex", flexWrap: "wrap", gap: 16, justifyContent: "space-between", marginBottom: 24 }}>
        <div style={{ maxWidth: 760 }}>
          <p style={{ color: "#0F766E", fontSize: 12, fontWeight: 850, letterSpacing: "0.06em", margin: "0 0 7px", textTransform: "uppercase" }}>Resumen tributario simple</p>
          <h1 style={{ color: "#0F2A3D", fontSize: "1.85rem", fontWeight: 850, lineHeight: 1.12, margin: "0 0 8px" }}>Declarar, pagar o revisar</h1>
          <p style={{ color: "#64748B", fontSize: "0.95rem", lineHeight: 1.55, margin: 0 }}>
            Lectura simple del resultado realizado por ventas cripto. Es una orientacion operativa; valida el cierre con un profesional.
          </p>
        </div>

        <Link href="/panel" style={{ border: "1px solid #CBD5E1", borderRadius: 8, color: "#0F2A3D", display: "inline-flex", fontSize: 13, fontWeight: 850, padding: "10px 14px", textDecoration: "none" }}>
          Volver al dashboard
        </Link>
      </section>

      <section style={{ alignItems: "end", background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 8, display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", marginBottom: 16, padding: 16 }}>
        <label style={{ color: "#475569", display: "grid", fontSize: 13, fontWeight: 750, gap: 6 }}>
          Ano tributario
          <select value={year} onChange={(event) => setYear(event.target.value)} style={{ border: "1px solid #CBD5E1", borderRadius: 8, color: "#0F2A3D", minHeight: 40, padding: "0 10px" }}>
            <option value="">Todos</option>
            <option value={currentYear}>{currentYear}</option>
            {data?.availableYears.filter((item) => String(item) !== currentYear).map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
        </label>
        <label style={{ color: "#475569", display: "grid", fontSize: 13, fontWeight: 750, gap: 6 }}>
          Activo
          <input value={symbol} onChange={(event) => setSymbol(event.target.value.toUpperCase())} placeholder="BTC" style={{ border: "1px solid #CBD5E1", borderRadius: 8, color: "#0F2A3D", minHeight: 40, padding: "0 10px", textTransform: "uppercase" }} />
        </label>
        <button onClick={() => void loadSummary(year, symbol.trim())} style={{ background: "#0F766E", border: 0, borderRadius: 8, color: "#FFFFFF", cursor: "pointer", fontSize: 13, fontWeight: 850, minHeight: 40, padding: "0 14px" }}>
          Aplicar
        </button>
        <button onClick={() => { setYear(""); setSymbol(""); void loadSummary("", ""); }} style={{ background: "#FFFFFF", border: "1px solid #CBD5E1", borderRadius: 8, color: "#0F2A3D", cursor: "pointer", fontSize: 13, fontWeight: 850, minHeight: 40, padding: "0 14px" }}>
          Limpiar
        </button>
      </section>

      {loading && <p style={{ color: "#64748B", fontSize: 14, fontWeight: 750 }}>Cargando resumen tributario...</p>}
      {error && <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8, color: "#991B1B", fontWeight: 750, padding: 16 }}>{error}</div>}

      {!loading && data && decision && (
        <>
          {decision.status === "EMPTY" ? (
            <section style={{ background: "#F8FAFC", border: "1px dashed #CBD5E1", borderRadius: 8, marginBottom: 16, padding: "32px 24px", textAlign: "center" }}>
              <h2 style={{ color: "#0F2A3D", fontSize: "1.25rem", fontWeight: 850, margin: "0 0 10px" }}>{decision.headline}</h2>
              <p style={{ color: "#64748B", fontSize: 14, lineHeight: 1.6, margin: "0 auto 18px", maxWidth: 520 }}>{decision.detail}</p>
              <Link href="/importaciones" style={{ background: "#0F766E", borderRadius: 8, color: "#FFFFFF", display: "inline-flex", fontSize: 14, fontWeight: 850, padding: "11px 16px", textDecoration: "none" }}>
                Cargar movimientos
              </Link>
            </section>
          ) : (
            <section style={{ background: tone.bg, border: `1px solid ${tone.border}`, borderRadius: 8, marginBottom: 16, padding: 18 }}>
              <span style={{ background: "#FFFFFF", borderRadius: 999, color: tone.color, display: "inline-flex", fontSize: 12, fontWeight: 850, marginBottom: 12, padding: "6px 10px" }}>{decision.label}</span>
              <h2 style={{ color: "#0F2A3D", fontSize: "1.45rem", fontWeight: 850, lineHeight: 1.18, margin: "0 0 8px" }}>{decision.headline}</h2>
              <p style={{ color: "#475569", fontSize: 14, lineHeight: 1.55, margin: "0 0 14px", maxWidth: 780 }}>{decision.detail}</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                <Link href={data.nextAction.href} style={{ background: "#0F2A3D", borderRadius: 8, color: "#FFFFFF", display: "inline-flex", fontSize: 13, fontWeight: 850, padding: "10px 14px", textDecoration: "none" }}>
                  {data.nextAction.label}
                </Link>
                <Link href="/tax/reports" style={{ border: "1px solid #CBD5E1", borderRadius: 8, color: "#0F2A3D", display: "inline-flex", fontSize: 13, fontWeight: 850, padding: "10px 14px", textDecoration: "none" }}>
                  Reportes
                </Link>
              </div>
            </section>
          )}

          <section style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", marginBottom: 18 }}>
            <Metric label="Resultado CLP" value={clp(data.totals.realizedPnlClp)} note={`${usd(data.totals.realizedPnlUsd)} realizado`} color={pnlColor} />
            <Metric label="Ventas" value={String(data.totals.eventsCount)} note="Eventos SELL calculados" />
            <Metric label="Ingresos venta" value={clp(data.totals.proceedsNetClp)} note="Neto de fees" />
            <Metric label="Costo FIFO" value={clp(data.totals.costBasisClp)} note="Base de costo estimada" />
            {data.totals.stakingCount > 0 && (
              <Metric label="Staking" value={clp(data.totals.stakingRewardClp)} note={`${usd(data.totals.stakingRewardUsd)} en ${data.totals.stakingCount} rewards`} color="#15803D" />
            )}
          </section>

          <section style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 8, overflow: "hidden" }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ borderCollapse: "collapse", minWidth: 860, width: "100%" }}>
                <thead>
                  <tr style={{ background: "#0F2A3D", color: "#F8FAFC", textAlign: "left" }}>
                    <th style={{ fontSize: 12, fontWeight: 850, padding: "13px 14px" }}>Ano</th>
                    <th style={{ fontSize: 12, fontWeight: 850, padding: "13px 14px" }}>Activo</th>
                    <th style={{ fontSize: 12, fontWeight: 850, padding: "13px 14px", textAlign: "right" }}>Ventas</th>
                    <th style={{ fontSize: 12, fontWeight: 850, padding: "13px 14px", textAlign: "right" }}>Cantidad</th>
                    <th style={{ fontSize: 12, fontWeight: 850, padding: "13px 14px", textAlign: "right" }}>Ingreso CLP</th>
                    <th style={{ fontSize: 12, fontWeight: 850, padding: "13px 14px", textAlign: "right" }}>Costo CLP</th>
                    <th style={{ fontSize: 12, fontWeight: 850, padding: "13px 14px", textAlign: "right" }}>Resultado CLP</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedRows.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ color: "#64748B", fontSize: 14, padding: 18, textAlign: "center" }}>No hay datos para los filtros seleccionados.</td>
                    </tr>
                  ) : sortedRows.map((row) => {
                    const positive = row.realizedPnlClp >= 0;
                    return (
                      <tr key={`${row.year}-${row.symbol}`} style={{ borderTop: "1px solid #E2E8F0" }}>
                        <td style={{ color: "#334155", fontSize: 13, padding: "14px" }}>{row.year}</td>
                        <td style={{ color: "#0F2A3D", fontSize: 14, fontWeight: 850, padding: "14px" }}>{row.symbol}</td>
                        <td style={{ color: "#334155", fontSize: 13, padding: "14px", textAlign: "right" }}>{row.eventsCount}</td>
                        <td style={{ color: "#334155", fontSize: 13, padding: "14px", textAlign: "right" }}>{formatterNumber.format(row.quantitySold)}</td>
                        <td style={{ color: "#334155", fontSize: 13, padding: "14px", textAlign: "right" }}>{clp(row.proceedsNetClp)}</td>
                        <td style={{ color: "#334155", fontSize: 13, padding: "14px", textAlign: "right" }}>{clp(row.costBasisClp)}</td>
                        <td style={{ color: positive ? "#15803D" : "#B45309", fontSize: 13, fontWeight: 850, padding: "14px", textAlign: "right" }}>{clp(row.realizedPnlClp)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          <section style={{ color: "#64748B", display: "flex", flexWrap: "wrap", fontSize: 12, gap: 12, marginTop: 14 }}>
            <span>FX usado: {clp(data.usdClp)}</span>
            <span>Filtro ano: {year || "Todos"}</span>
            <span>Filtro activo: {symbol || "Todos"}</span>
          </section>
        </>
      )}
    </div>
  );
}
