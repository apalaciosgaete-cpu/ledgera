"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { fonts } from "@/styles/tokens";
import { httpClient } from "@/shared/http/httpClient";

type AssetRow = {
  symbol: string;
  quantity: number;
  priceUsd: number | null;
  valueUsd: number | null;
  valueClp: number | null;
  costBasisClp: number;
  unrealizedPnlClp: number | null;
  unrealizedPnlPct: number | null;
  operations: number;
  lastDate: string;
  status: "COMPLETO" | "FALTA_PRECIO" | "FALTA_BASE" | "REVISAR_BASE";
  priceSource: string;
};

type AssetSummary = {
  generatedAt: string;
  usdClp: number;
  fxSource: string;
  totals: {
    valueUsd: number;
    valueClp: number;
    costBasisClp: number;
    unrealizedPnlClp: number;
    unrealizedPnlPct: number | null;
  };
  counts: {
    assets: number;
    operations: number;
    missingPrice: number;
    review: number;
  };
  assets: AssetRow[];
};

type ApiResponse<T> = {
  ok: boolean;
  message: string;
  data: T;
};

const statusMeta: Record<AssetRow["status"], { label: string; bg: string; color: string; border: string }> = {
  COMPLETO: { label: "Completo", bg: "var(--accent-soft)", color: "var(--accent)", border: "var(--accent-soft)" },
  FALTA_PRECIO: { label: "Falta precio", bg: "rgba(196,99,74,0.14)", color: "var(--loss)", border: "rgba(196,99,74,0.14)" },
  FALTA_BASE: { label: "Falta base", bg: "rgba(232,184,75,0.14)", color: "var(--warn)", border: "rgba(232,184,75,0.14)" },
  REVISAR_BASE: { label: "Revisar", bg: "var(--bg-elev)", color: "var(--warn)", border: "rgba(232,184,75,0.14)" },
};

function formatClp(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return "—";
  return new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }).format(Math.round(value));
}

function formatUsd(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return "—";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: value < 10 ? 4 : 2 }).format(value);
}

function formatNumber(value: number | null | undefined, digits = 8): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return "—";
  return new Intl.NumberFormat("es-CL", { maximumFractionDigits: digits }).format(value);
}

function formatPct(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return "—";
  return `${value > 0 ? "+" : ""}${new Intl.NumberFormat("es-CL", { maximumFractionDigits: 2 }).format(value)}%`;
}

function formatDateTime(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("es-CL", { dateStyle: "short", timeStyle: "short" });
}

function resultColor(value: number | null | undefined): string {
  if (value === null || value === undefined) return "var(--text-soft)";
  if (value > 0) return "#3FA687";
  if (value < 0) return "#C4634A";
  return "var(--text-soft)";
}

function KpiCard({ label, value, helper, accent = "#3FA687" }: { label: string; value: string; helper: string; accent?: string }) {
  return (
    <article style={{ background: "var(--bg-elev)", border: "1px solid var(--border)", borderRadius: 20, padding: 18, display: "grid", gap: 8, minHeight: 118, boxShadow: "0 14px 30px rgba(15,42,61,0.05)" }}>
      <span style={{ color: "var(--text-soft)", fontSize: 12, fontWeight: 850, letterSpacing: "0.04em", textTransform: "uppercase" }}>{label}</span>
      <strong style={{ color: accent, fontSize: "clamp(1.35rem,2.5vw,2rem)", fontWeight: 950, letterSpacing: "-0.045em", lineHeight: 1 }}>{value}</strong>
      <span style={{ color: "var(--text-soft)", fontSize: 12.5, lineHeight: 1.35 }}>{helper}</span>
    </article>
  );
}

function EmptyState() {
  return (
    <section style={{ background: "var(--bg-elev)", border: "1px solid var(--border)", borderRadius: 22, padding: 28, display: "grid", gap: 14, textAlign: "center" }}>
      <h2 style={{ color: "var(--text)", fontSize: 24, fontWeight: 950, letterSpacing: "-0.04em", margin: 0 }}>Aún no hay activos valorizados</h2>
      <p style={{ color: "var(--text-soft)", fontSize: 14, lineHeight: 1.6, margin: "0 auto", maxWidth: 620 }}>
        Carga movimientos o documentación para que LEDGERA consolide tus activos, base de costo y valorización en pesos chilenos.
      </p>
      <div style={{ display: "flex", justifyContent: "center", gap: 10, flexWrap: "wrap" }}>
        <Link href="/origen-fondos" style={{ background: "var(--accent)", color: "var(--text)", borderRadius: 999, padding: "11px 16px", fontWeight: 900, textDecoration: "none", fontSize: 13 }}>Cargar origen de fondos</Link>
        <Link href="/importaciones" style={{ background: "var(--bg-sunken)", color: "var(--text)", border: "1px solid var(--border)", borderRadius: 999, padding: "11px 16px", fontWeight: 900, textDecoration: "none", fontSize: 13 }}>Ver importaciones</Link>
      </div>
    </section>
  );
}

export function InvestorDashboard() {
  const [summary, setSummary] = useState<AssetSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);
    httpClient<ApiResponse<AssetSummary>>("/api/assets/summary", { auth: true })
      .then((response) => { if (!cancelled) setSummary(response.data); })
      .catch(() => { if (!cancelled) setError(true); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const topComposition = useMemo(() => {
    const assets = summary?.assets ?? [];
    const total = summary?.totals.valueClp ?? 0;
    return assets.slice(0, 5).map((asset) => ({
      symbol: asset.symbol,
      pct: total > 0 && asset.valueClp ? (asset.valueClp / total) * 100 : 0,
      valueClp: asset.valueClp ?? 0,
    }));
  }, [summary]);

  const resultLabel = (summary?.totals.unrealizedPnlClp ?? 0) >= 0 ? "Ganancia estimada no realizada" : "Pérdida estimada no realizada";

  return (
    <main style={{ minHeight: "calc(100vh - 96px)", background: "var(--bg-sunken)", color: "var(--text)", fontFamily: fonts.body, padding: "clamp(18px,3vw,34px)", boxSizing: "border-box" }}>
      <div style={{ maxWidth: 1240, margin: "0 auto", display: "grid", gap: 18 }}>
        <section style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 18, flexWrap: "wrap" }}>
          <div style={{ display: "grid", gap: 7, maxWidth: 740 }}>
            <p style={{ color: "var(--accent)", fontSize: 12, fontWeight: 900, letterSpacing: "0.08em", margin: 0, textTransform: "uppercase" }}>Resumen de activos</p>
            <h1 style={{ color: "var(--text)", fontSize: "clamp(2rem,4vw,3.2rem)", lineHeight: 0.98, letterSpacing: "-0.06em", fontWeight: 950, margin: 0 }}>
              Activos actuales, valorización y resultado estimado
            </h1>
            <p style={{ color: "var(--text-soft)", fontSize: 15, lineHeight: 1.55, margin: 0, maxWidth: 690 }}>
              Consulta tus activos confirmados, su precio actual en dólares, valor en pesos chilenos y resultado estimado frente a tu base de costo.
            </p>
          </div>
          <aside style={{ background: "var(--bg-elev)", border: "1px solid var(--border)", borderRadius: 18, padding: 14, minWidth: 230, display: "grid", gap: 7 }}>
            <span style={{ color: "var(--text-soft)", fontSize: 12, fontWeight: 850 }}>Tipo de cambio usado</span>
            <strong style={{ color: "var(--text)", fontSize: 22, fontWeight: 950 }}>{summary ? formatClp(summary.usdClp) : loading ? "Cargando..." : "—"}</strong>
            <span style={{ color: "var(--text-soft)", fontSize: 12 }}>Actualizado: {summary ? formatDateTime(summary.generatedAt) : "—"}</span>
          </aside>
        </section>

        {loading ? (
          <section style={{ background: "var(--bg-elev)", border: "1px solid var(--border)", borderRadius: 22, padding: 28, color: "var(--text-soft)" }}>Cargando resumen de activos...</section>
        ) : error ? (
          <section style={{ background: "rgba(196,99,74,0.14)", border: "1px solid rgba(196,99,74,0.14)", borderRadius: 22, padding: 22, color: "var(--loss)" }}>No fue posible cargar el resumen de activos.</section>
        ) : !summary || summary.assets.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(210px,1fr))", gap: 12 }}>
              <KpiCard label="Patrimonio total estimado" value={formatClp(summary.totals.valueClp)} helper={`${formatUsd(summary.totals.valueUsd)} valorizados a USD/CLP ${formatNumber(summary.usdClp, 2)}`} />
              <KpiCard label={resultLabel} value={formatClp(summary.totals.unrealizedPnlClp)} helper={`Frente a base de costo: ${formatPct(summary.totals.unrealizedPnlPct)}`} accent={resultColor(summary.totals.unrealizedPnlClp)} />
              <KpiCard label="Activos detectados" value={String(summary.counts.assets)} helper="Con saldo actual estimado" accent="#3FA687" />
              <KpiCard label="Operaciones utilizadas" value={String(summary.counts.operations)} helper="Movimientos usados para consolidar saldos" accent="#3FA687" />
            </section>

            <section style={{ background: "var(--bg-elev)", border: "1px solid var(--border)", borderRadius: 22, overflow: "hidden", boxShadow: "0 18px 42px rgba(15,42,61,0.06)" }}>
              <div style={{ padding: "16px 18px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                <div>
                  <h2 style={{ color: "var(--text)", fontSize: 18, fontWeight: 950, margin: 0 }}>Activos valorizados</h2>
                  <p style={{ color: "var(--text-soft)", fontSize: 12.5, margin: "4px 0 0" }}>Valor actual estimado, conversión a CLP y resultado no realizado.</p>
                </div>
                <Link href="/cryptoactivos" style={{ color: "var(--accent)", fontSize: 13, fontWeight: 900, textDecoration: "none" }}>Ver detalle operativo</Link>
              </div>

              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", minWidth: 960, borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "var(--bg-sunken)", color: "var(--text-soft)", fontSize: 11, letterSpacing: "0.04em", textTransform: "uppercase", textAlign: "left" }}>
                      <th style={{ padding: "12px 14px" }}>Activo</th>
                      <th style={{ padding: "12px 14px", textAlign: "right" }}>Cantidad</th>
                      <th style={{ padding: "12px 14px", textAlign: "right" }}>Precio USD</th>
                      <th style={{ padding: "12px 14px", textAlign: "right" }}>Valor USD</th>
                      <th style={{ padding: "12px 14px", textAlign: "right" }}>Valor CLP</th>
                      <th style={{ padding: "12px 14px", textAlign: "right" }}>Base costo CLP</th>
                      <th style={{ padding: "12px 14px", textAlign: "right" }}>Ganancia / pérdida</th>
                      <th style={{ padding: "12px 14px" }}>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.assets.map((asset) => {
                      const meta = statusMeta[asset.status];
                      return (
                        <tr key={asset.symbol} style={{ borderTop: "1px solid var(--border)", color: "var(--text)", fontSize: 13 }}>
                          <td style={{ padding: "13px 14px" }}><strong style={{ color: "var(--text)", fontSize: 14 }}>{asset.symbol}</strong><br /><span style={{ color: "var(--text-soft)", fontSize: 11 }}>{asset.operations} ops.</span></td>
                          <td style={{ padding: "13px 14px", textAlign: "right", fontWeight: 800 }}>{formatNumber(asset.quantity)}</td>
                          <td style={{ padding: "13px 14px", textAlign: "right" }}>{formatUsd(asset.priceUsd)}</td>
                          <td style={{ padding: "13px 14px", textAlign: "right" }}>{formatUsd(asset.valueUsd)}</td>
                          <td style={{ padding: "13px 14px", textAlign: "right", fontWeight: 900, color: "var(--text)" }}>{formatClp(asset.valueClp)}</td>
                          <td style={{ padding: "13px 14px", textAlign: "right" }}>{formatClp(asset.costBasisClp)}</td>
                          <td style={{ padding: "13px 14px", textAlign: "right", color: resultColor(asset.unrealizedPnlClp), fontWeight: 900 }}>{formatClp(asset.unrealizedPnlClp)}<br /><span style={{ fontSize: 11 }}>{formatPct(asset.unrealizedPnlPct)}</span></td>
                          <td style={{ padding: "13px 14px" }}><span style={{ background: meta.bg, border: `1px solid ${meta.border}`, borderRadius: 999, color: meta.color, display: "inline-flex", fontSize: 11.5, fontWeight: 900, padding: "5px 8px" }}>{meta.label}</span></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>

            <section style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(280px,0.8fr)", gap: 14 }}>
              <article style={{ background: "var(--bg-elev)", border: "1px solid var(--border)", borderRadius: 22, padding: 18, display: "grid", gap: 12 }}>
                <h2 style={{ color: "var(--text)", fontSize: 17, fontWeight: 950, margin: 0 }}>Composición del portafolio</h2>
                {topComposition.map((item) => (
                  <div key={item.symbol} style={{ display: "grid", gap: 6 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", color: "var(--text)", fontSize: 13 }}><strong>{item.symbol}</strong><span>{formatPct(item.pct)} · {formatClp(item.valueClp)}</span></div>
                    <div style={{ height: 9, background: "var(--bg-elev)", borderRadius: 999, overflow: "hidden" }}><div style={{ height: "100%", width: `${Math.max(2, Math.min(100, item.pct))}%`, background: "var(--accent)", borderRadius: 999 }} /></div>
                  </div>
                ))}
              </article>

              <article style={{ background: "rgba(232,184,75,0.14)", border: "1px solid rgba(232,184,75,0.14)", borderRadius: 22, padding: 18, display: "grid", gap: 12, alignContent: "start" }}>
                <h2 style={{ color: "var(--warn)", fontSize: 17, fontWeight: 950, margin: 0 }}>Lectura tributaria preliminar</h2>
                <p style={{ color: "var(--warn)", fontSize: 13.5, lineHeight: 1.55, margin: 0 }}>
                  La ganancia o pérdida mostrada es estimada y no realizada. Solo se transforma en resultado tributario cuando existe venta, permuta, pago, retiro con disposición u otro evento confirmado.
                </p>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <Link href="/obligaciones-tributarias" style={{ background: "var(--warn)", color: "var(--text)", borderRadius: 999, padding: "9px 12px", fontSize: 12.5, fontWeight: 900, textDecoration: "none" }}>Ver obligaciones</Link>
                  <Link href="/declaraciones" style={{ background: "var(--bg-elev)", color: "var(--warn)", border: "1px solid rgba(232,184,75,0.14)", borderRadius: 999, padding: "9px 12px", fontSize: 12.5, fontWeight: 900, textDecoration: "none" }}>Descargar respaldo</Link>
                </div>
              </article>
            </section>
          </>
        )}
      </div>
    </main>
  );
}
