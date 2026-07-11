"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
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
  originSource?: string;
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
  counts: { assets: number; operations: number; missingPrice: number; review: number };
  assets: AssetRow[];
};

type ApiResponse<T> = { ok: boolean; message: string; data: T };

const panelFont = "'Manrope', var(--font-body, 'Inter'), system-ui, sans-serif";
const monoFont = "var(--font-mono, 'IBM Plex Mono'), ui-monospace, monospace";

function formatClp(value: number | null | undefined) {
  if (value == null || !Number.isFinite(value)) return "—";
  return new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }).format(Math.round(value));
}

function formatUsd(value: number | null | undefined) {
  if (value == null || !Number.isFinite(value)) return "—";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: value < 10 ? 4 : 2 }).format(value);
}

function formatNumber(value: number | null | undefined, digits = 8) {
  if (value == null || !Number.isFinite(value)) return "—";
  return new Intl.NumberFormat("es-CL", { minimumFractionDigits: digits === 2 ? 2 : 0, maximumFractionDigits: digits }).format(value);
}

function formatPct(value: number | null | undefined) {
  if (value == null || !Number.isFinite(value)) return "—";
  return `${value > 0 ? "+" : ""}${new Intl.NumberFormat("es-CL", { maximumFractionDigits: 2 }).format(value)}%`;
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString("es-CL", { dateStyle: "short", timeStyle: "short" });
}

function normalizeSource(value: string | null | undefined) {
  if (!value) return "Sin fuente";
  const clean = value.trim().toLowerCase();
  if (clean === "binance") return "Binance";
  if (clean === "stablecoin") return "Stablecoin";
  if (clean === "mindicador.cl") return "mindicador.cl";
  if (clean === "open.er-api.com") return "open.er-api.com";
  if (clean === "fallback" || clean === "respaldo_temporal") return "respaldo temporal";
  if (clean === "sin_precio") return "Sin precio";
  return value;
}

function resultColor(value: number | null | undefined) {
  if (value == null || value === 0) return "var(--text-soft)";
  return value > 0 ? "var(--gain)" : "var(--loss)";
}

function HeaderCell({ children, title, align = "left" }: { children: React.ReactNode; title: string; align?: "left" | "right" | "center" }) {
  return <th title={title} style={{ padding: "10px 7px", textAlign: align, cursor: "help", whiteSpace: "normal", lineHeight: 1.2 }}>{children}</th>;
}

function KpiCard({ label, value, helper, accent = "var(--accent)" }: { label: string; value: string; helper: string; accent?: string }) {
  return (
    <article style={{ background: "var(--bg-elev)", border: "1px solid var(--border)", borderRadius: 20, padding: 18, display: "grid", gap: 8, minHeight: 106, boxShadow: "var(--shadow-sm)", textAlign: "center", justifyItems: "center" }}>
      <span style={{ color: "var(--text-faint)", fontSize: 11.5, fontWeight: 800, letterSpacing: ".04em", textTransform: "uppercase" }}>{label}</span>
      <strong style={{ color: accent, fontSize: "clamp(1.2rem,2.1vw,1.72rem)", fontWeight: 800, letterSpacing: "-.04em", lineHeight: 1 }}>{value}</strong>
      <span style={{ color: "var(--text-soft)", fontSize: 12.5, lineHeight: 1.35, maxWidth: 230, textAlign: "center", width: "100%" }}>{helper}</span>
    </article>
  );
}

function PortfolioValuationChart({ summary }: { summary: AssetSummary }) {
  const currentValue = Math.max(0, summary.totals.valueClp);
  const cost = Math.max(0, summary.totals.costBasisClp);
  const total = currentValue + cost;
  const currentShare = total > 0 ? (currentValue / total) * 100 : 0;
  const pnlColor = resultColor(summary.totals.unrealizedPnlClp);
  const background = total > 0
    ? `conic-gradient(var(--accent) 0 ${currentShare}%, rgba(255,255,255,.10) ${currentShare}% 100%)`
    : "rgba(255,255,255,.08)";

  return (
    <div style={{ display: "grid", gridTemplateColumns: "minmax(150px,190px) minmax(190px,1fr)", alignItems: "center", gap: 22, justifyContent: "center" }}>
      <div role="img" aria-label={`Costo de compra ${formatClp(cost)}, diferencia ${formatClp(summary.totals.unrealizedPnlClp)}, diferencia porcentual ${formatPct(summary.totals.unrealizedPnlPct)}`} style={{ width: 170, height: 170, borderRadius: "50%", background, display: "grid", placeItems: "center", margin: "0 auto", boxShadow: "inset 0 0 0 1px var(--border)" }}>
        <div style={{ width: 112, height: 112, borderRadius: "50%", background: "var(--bg-elev)", border: "1px solid var(--border)", display: "grid", placeItems: "center", textAlign: "center", padding: 10 }}>
          <span style={{ color: "var(--text-faint)", fontSize: 10.5, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".04em" }}>Diferencia</span>
          <strong style={{ color: pnlColor, fontSize: 22, fontFamily: monoFont, lineHeight: 1.1 }}>{formatPct(summary.totals.unrealizedPnlPct)}</strong>
        </div>
      </div>
      <div style={{ display: "grid", gap: 12 }}>
        <div style={{ background: "var(--bg-sunken)", border: "1px solid var(--border)", borderRadius: 14, padding: "12px 14px", display: "grid", gap: 4 }}>
          <span style={{ color: "var(--text-faint)", fontSize: 11, fontWeight: 800, textTransform: "uppercase" }}>Costo de compra CLP</span>
          <strong style={{ color: "var(--text)", fontFamily: monoFont, fontSize: 17 }}>{formatClp(summary.totals.costBasisClp)}</strong>
        </div>
        <div style={{ background: "var(--bg-sunken)", border: "1px solid var(--border)", borderRadius: 14, padding: "12px 14px", display: "grid", gap: 4 }}>
          <span style={{ color: "var(--text-faint)", fontSize: 11, fontWeight: 800, textTransform: "uppercase" }}>Diferencia CLP</span>
          <strong style={{ color: pnlColor, fontFamily: monoFont, fontSize: 17 }}>{formatClp(summary.totals.unrealizedPnlClp)}</strong>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 7, color: "var(--text-soft)", fontSize: 12.5 }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--accent)" }} /> Valor actual del portafolio
        </div>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <section style={{ background: "var(--bg-elev)", border: "1px solid var(--border)", borderRadius: 22, padding: 28, display: "grid", gap: 14, textAlign: "center" }}>
      <h2 style={{ color: "var(--text)", fontSize: 21, fontWeight: 800, margin: 0 }}>Aún no hay activos valorizados</h2>
      <p style={{ color: "var(--text-soft)", fontSize: 14, lineHeight: 1.6, margin: "0 auto", maxWidth: 620 }}>Carga movimientos o documentación para que LEDGERA consolide tus activos, base de costo y valorización en pesos chilenos.</p>
      <div style={{ display: "flex", justifyContent: "center", gap: 10, flexWrap: "wrap" }}>
        <Link href="/origen-fondos" style={{ background: "var(--accent)", color: "var(--accent-contrast)", borderRadius: 999, padding: "11px 16px", fontWeight: 800, textDecoration: "none", fontSize: 13 }}>Cargar origen de fondos</Link>
        <Link href="/importaciones" style={{ background: "var(--bg-sunken)", color: "var(--text)", border: "1px solid var(--border)", borderRadius: 999, padding: "11px 16px", fontWeight: 800, textDecoration: "none", fontSize: 13 }}>Ver importaciones</Link>
      </div>
    </section>
  );
}

export function InvestorDashboard() {
  const [summary, setSummary] = useState<AssetSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [hiddenAssetSymbols, setHiddenAssetSymbols] = useState<Set<string>>(() => new Set());

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

  const visibleAssets = useMemo(() => {
    const assets = summary?.assets ?? [];
    return hiddenAssetSymbols.size === 0 ? assets : assets.filter((asset) => !hiddenAssetSymbols.has(asset.symbol));
  }, [summary, hiddenAssetSymbols]);

  const topComposition = useMemo(() => {
    const total = visibleAssets.reduce((acc, asset) => acc + (asset.valueClp ?? 0), 0);
    return visibleAssets.slice(0, 5).map((asset) => ({ symbol: asset.symbol, pct: total > 0 && asset.valueClp ? (asset.valueClp / total) * 100 : 0, valueClp: asset.valueClp ?? 0 }));
  }, [visibleAssets]);

  function hideAssetFromView(symbol: string) {
    setHiddenAssetSymbols((current) => new Set([...current, symbol]));
  }

  return (
    <main style={{ minHeight: "calc(100vh - 96px)", background: "var(--bg-sunken)", color: "var(--text)", fontFamily: panelFont, padding: "clamp(16px,2.4vw,28px)", boxSizing: "border-box" }}>
      <div style={{ maxWidth: 1220, margin: "0 auto", display: "grid", gap: 16 }}>
        <section style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <div style={{ display: "grid", gap: 7, flex: "1 1 auto", minWidth: 0 }}>
            <h1 style={{ color: "var(--text)", fontSize: "clamp(1.9rem,2.9vw,2.55rem)", lineHeight: 1, letterSpacing: "-.048em", fontWeight: 800, margin: 0 }}>Activos actuales, valorización y diferencia frente a costo</h1>
            <p style={{ color: "var(--text-soft)", fontSize: 14.5, lineHeight: 1.55, margin: 0 }}>Consulta tus activos confirmados, su precio actual y valor en pesos chilenos.</p>
          </div>
          <aside style={{ background: "var(--bg-elev)", border: "1px solid var(--border)", borderRadius: 18, padding: 14, minWidth: 240, display: "grid", gap: 7, justifyItems: "center", textAlign: "center" }}>
            <span style={{ color: "var(--text-faint)", fontSize: 12, fontWeight: 800 }}>Tipo de cambio usado</span>
            <strong style={{ color: "var(--text)", fontSize: 20, fontWeight: 800 }}>{summary ? `$${formatNumber(summary.usdClp, 2)} CLP` : loading ? "Cargando..." : "—"}</strong>
            <span style={{ color: "var(--text-soft)", fontSize: 12 }}>Fuente: {summary ? normalizeSource(summary.fxSource) : "—"}</span>
            <span style={{ color: "var(--text-faint)", fontSize: 12 }}>Actualizado: {summary ? formatDateTime(summary.generatedAt) : "—"}</span>
          </aside>
        </section>

        {loading ? <section style={{ background: "var(--bg-elev)", border: "1px solid var(--border)", borderRadius: 22, padding: 28, color: "var(--text-soft)" }}>Cargando resumen de activos...</section>
        : error ? <section style={{ background: "rgba(253,164,175,.14)", border: "1px solid rgba(253,164,175,.32)", borderRadius: 22, padding: 22, color: "var(--loss)" }}>No fue posible cargar el resumen de activos.</section>
        : !summary || summary.assets.length === 0 ? <EmptyState />
        : <>
          <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(210px,280px))", gap: 12, justifyContent: "center" }}>
            <KpiCard label="Valor total actual" value={formatClp(summary.totals.valueClp)} helper={`Valor USD ${formatUsd(summary.totals.valueUsd)} · TC ${formatNumber(summary.usdClp, 2)}`} />
            <KpiCard label="Diferencia vs. base de costo" value={formatClp(summary.totals.unrealizedPnlClp)} helper={`Variación porcentual: ${formatPct(summary.totals.unrealizedPnlPct)}`} accent={resultColor(summary.totals.unrealizedPnlClp)} />
            <KpiCard label="Activos detectados" value={String(summary.counts.assets)} helper="Con saldo actual" />
            <KpiCard label="Operaciones utilizadas" value={String(summary.counts.operations)} helper="Movimientos usados para consolidar saldos" />
          </section>

          <section style={{ background: "var(--bg-elev)", border: "1px solid var(--border)", borderRadius: 22, overflow: "hidden", boxShadow: "var(--shadow-sm)" }}>
            <div style={{ padding: "15px 18px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10 }}>
              <div><h2 style={{ color: "var(--text)", fontSize: 16.5, fontWeight: 800, margin: 0 }}>Activos valorizados</h2><p style={{ color: "var(--text-soft)", fontSize: 12.5, margin: "4px 0 0" }}>Valor actual, conversión a CLP, origen operativo y diferencia frente a costo.</p></div>
              {hiddenAssetSymbols.size > 0 ? <button type="button" onClick={() => setHiddenAssetSymbols(new Set())} style={{ background: "var(--bg-sunken)", border: "1px solid var(--border-strong)", borderRadius: 999, color: "var(--accent)", cursor: "pointer", fontSize: 12, fontWeight: 800, padding: "7px 10px" }}>Restaurar vista ({hiddenAssetSymbols.size})</button> : null}
            </div>
            <div>
              <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
                <thead><tr style={{ background: "var(--bg-sunken)", color: "var(--text-faint)", fontSize: 10.2, letterSpacing: ".03em", textTransform: "uppercase" }}>
                  <HeaderCell title="Criptoactivo o token valorizado.">Activo</HeaderCell>
                  <HeaderCell align="center" title="Cantidad de operaciones confirmadas usadas para calcular el saldo.">OPS</HeaderCell>
                  <HeaderCell align="right" title="Saldo actual del activo.">Cantidad</HeaderCell>
                  <HeaderCell align="right" title="Precio unitario actual en dólares.">Precio unitario USD</HeaderCell>
                  <HeaderCell title="Exchange o proveedor de origen.">Origen</HeaderCell>
                  <HeaderCell align="right" title="Valor actual del saldo en dólares.">Valor USD</HeaderCell>
                  <HeaderCell align="right" title="Valor actual convertido a pesos chilenos.">Valor CLP</HeaderCell>
                  <HeaderCell align="right" title="Costo de adquisición acumulado del saldo actual.">Costo de compra CLP</HeaderCell>
                  <HeaderCell align="right" title="Diferencia en pesos entre valor actual y costo.">Diferencia CLP</HeaderCell>
                  <HeaderCell align="right" title="Diferencia porcentual entre valor actual y costo.">Diferencia %</HeaderCell>
                  <HeaderCell align="center" title="Oculta el activo solo de esta vista.">Borrar</HeaderCell>
                </tr></thead>
                <tbody>
                  {visibleAssets.length === 0 ? <tr><td colSpan={11} style={{ padding: "18px 10px", textAlign: "center", color: "var(--text-soft)" }}>Todos los activos fueron ocultados de esta vista. La información sigue guardada.</td></tr>
                  : visibleAssets.map((asset) => <tr key={asset.symbol} style={{ borderTop: "1px solid var(--border)", color: "var(--text)", fontSize: 11.5 }}>
                    <td style={{ padding: "12px 7px", overflow: "hidden", textOverflow: "ellipsis" }}><strong style={{ fontSize: 13, fontWeight: 800 }}>{asset.symbol}</strong></td>
                    <td style={{ padding: "12px 7px", textAlign: "center", fontWeight: 800, fontFamily: monoFont }}>{asset.operations}</td>
                    <td style={{ padding: "12px 7px", textAlign: "right", fontWeight: 800, fontFamily: monoFont, overflow: "hidden", textOverflow: "ellipsis" }}>{formatNumber(asset.quantity)}</td>
                    <td style={{ padding: "12px 7px", textAlign: "right", fontFamily: monoFont, overflow: "hidden", textOverflow: "ellipsis" }}>{formatUsd(asset.priceUsd)}</td>
                    <td style={{ padding: "12px 7px", color: "var(--text-soft)", overflow: "hidden", textOverflow: "ellipsis" }}>{asset.originSource || "Sin origen"}</td>
                    <td style={{ padding: "12px 7px", textAlign: "right", fontFamily: monoFont, overflow: "hidden", textOverflow: "ellipsis" }}>{formatUsd(asset.valueUsd)}</td>
                    <td style={{ padding: "12px 7px", textAlign: "right", fontWeight: 800, fontFamily: monoFont, overflow: "hidden", textOverflow: "ellipsis" }}>{formatClp(asset.valueClp)}</td>
                    <td style={{ padding: "12px 7px", textAlign: "right", fontFamily: monoFont, overflow: "hidden", textOverflow: "ellipsis" }}>{formatClp(asset.costBasisClp)}</td>
                    <td style={{ padding: "12px 7px", textAlign: "right", color: resultColor(asset.unrealizedPnlClp), fontWeight: 800, fontFamily: monoFont, overflow: "hidden", textOverflow: "ellipsis" }}>{formatClp(asset.unrealizedPnlClp)}</td>
                    <td style={{ padding: "12px 7px", textAlign: "right", color: resultColor(asset.unrealizedPnlClp), fontWeight: 800, fontFamily: monoFont }}>{formatPct(asset.unrealizedPnlPct)}</td>
                    <td style={{ padding: "12px 5px", textAlign: "center" }}><button type="button" aria-label={`Borrar ${asset.symbol} de esta vista`} title="Quitar activo de esta vista" onClick={() => hideAssetFromView(asset.symbol)} style={{ background: "transparent", border: "1px solid rgba(253,164,175,.35)", borderRadius: 999, color: "var(--loss)", cursor: "pointer", fontSize: 16, fontWeight: 900, height: 26, width: 26 }}>×</button></td>
                  </tr>)}
                </tbody>
              </table>
            </div>
          </section>

          <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,280px),1fr))", gap: 14 }}>
            <article style={{ background: "var(--bg-elev)", border: "1px solid var(--border)", borderRadius: 22, padding: 18, display: "grid", gap: 12 }}>
              <h2 style={{ color: "var(--text)", fontSize: 16.5, fontWeight: 800, margin: 0 }}>Composición del portafolio</h2>
              {topComposition.map((item) => <div key={item.symbol} style={{ display: "grid", gap: 6 }}><div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}><strong>{item.symbol}</strong><span style={{ color: "var(--text-soft)", fontFamily: monoFont }}>{formatPct(item.pct)} · {formatClp(item.valueClp)}</span></div><div style={{ height: 9, background: "var(--bg-sunken)", borderRadius: 999, overflow: "hidden" }}><div style={{ height: "100%", width: `${Math.max(2, Math.min(100, item.pct))}%`, background: "var(--accent)", borderRadius: 999 }} /></div></div>)}
            </article>
            <article style={{ background: "var(--bg-elev)", border: "1px solid var(--border)", borderRadius: 22, padding: 18, display: "grid", gap: 18, alignContent: "start" }}>
              <div><h2 style={{ color: "var(--text)", fontSize: 16.5, fontWeight: 800, margin: 0 }}>Calidad del respaldo</h2><p style={{ color: "var(--text-soft)", fontSize: 13.5, lineHeight: 1.55, margin: "6px 0 0" }}>Comparación consolidada entre el costo de compra y el valor actual del portafolio.</p></div>
              <PortfolioValuationChart summary={summary} />
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}><Link href="/importaciones" style={{ background: "var(--accent)", color: "var(--accent-contrast)", borderRadius: 999, padding: "9px 12px", fontSize: 12.5, fontWeight: 800, textDecoration: "none" }}>Revisar importaciones</Link><Link href="/cryptoactivos" style={{ background: "var(--bg-sunken)", color: "var(--accent)", border: "1px solid var(--border-strong)", borderRadius: 999, padding: "9px 12px", fontSize: 12.5, fontWeight: 800, textDecoration: "none" }}>Ver activos</Link></div>
            </article>
          </section>
        </>}
      </div>
    </main>
  );
}
