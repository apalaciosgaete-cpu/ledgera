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

const panelFont = "'Manrope', var(--font-body, 'Inter'), system-ui, sans-serif";
const monoFont = "var(--font-mono, 'IBM Plex Mono'), ui-monospace, monospace";

const statusMeta: Record<AssetRow["status"], { label: string; bg: string; color: string; border: string }> = {
  COMPLETO: {
    label: "Completo",
    bg: "var(--accent-soft)",
    color: "var(--gain)",
    border: "rgba(110, 231, 183, 0.28)",
  },
  FALTA_PRECIO: {
    label: "Falta precio",
    bg: "rgba(253, 164, 175, 0.14)",
    color: "var(--loss)",
    border: "rgba(253, 164, 175, 0.32)",
  },
  FALTA_BASE: {
    label: "Falta base",
    bg: "rgba(252, 211, 77, 0.14)",
    color: "var(--warn)",
    border: "rgba(252, 211, 77, 0.32)",
  },
  REVISAR_BASE: {
    label: "Revisar",
    bg: "rgba(252, 211, 77, 0.14)",
    color: "var(--warn)",
    border: "rgba(252, 211, 77, 0.32)",
  },
};

function formatClp(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return "—";
  return new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }).format(Math.round(value));
}

function formatUsdClpRate(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return "—";
  return `$${new Intl.NumberFormat("es-CL", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value)} CLP`;
}

function formatUsd(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return "—";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: value < 10 ? 4 : 2 }).format(value);
}

function formatNumber(value: number | null | undefined, digits = 8): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return "—";
  return new Intl.NumberFormat("es-CL", { minimumFractionDigits: digits === 2 ? 2 : 0, maximumFractionDigits: digits }).format(value);
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

function normalizeSource(value: string | null | undefined): string {
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

function normalizeOrigin(value: string | null | undefined): string {
  if (!value) return "Sin origen";
  return value;
}

function resultColor(value: number | null | undefined): string {
  if (value === null || value === undefined) return "var(--text-soft)";
  if (value > 0) return "var(--gain)";
  if (value < 0) return "var(--loss)";
  return "var(--text-soft)";
}

function HeaderCell({ children, title, align = "left" }: { children: React.ReactNode; title: string; align?: "left" | "right" | "center" }) {
  return (
    <th
      title={title}
      style={{
        padding: "12px 14px",
        textAlign: align,
        cursor: "help",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </th>
  );
}

function KpiCard({ label, value, helper, accent = "var(--accent)" }: { label: string; value: string; helper: string; accent?: string }) {
  return (
    <article
      style={{
        background: "var(--bg-elev)",
        border: "1px solid var(--border)",
        borderRadius: 20,
        padding: 18,
        display: "grid",
        gap: 8,
        minHeight: 106,
        boxShadow: "var(--shadow-sm)",
        textAlign: "center",
        justifyItems: "center",
      }}
    >
      <span style={{ color: "var(--text-faint)", fontSize: 11.5, fontWeight: 800, letterSpacing: "0.04em", textTransform: "uppercase" }}>{label}</span>
      <strong style={{ color: accent, fontSize: "clamp(1.2rem,2.1vw,1.72rem)", fontWeight: 800, letterSpacing: "-0.04em", lineHeight: 1 }}>{value}</strong>
      <span style={{ color: "var(--text-soft)", fontSize: 12.5, lineHeight: 1.35, maxWidth: 230, textAlign: "center", width: "100%" }}>{helper}</span>
    </article>
  );
}

function EmptyState() {
  return (
    <section style={{ background: "var(--bg-elev)", border: "1px solid var(--border)", borderRadius: 22, padding: 28, display: "grid", gap: 14, textAlign: "center" }}>
      <h2 style={{ color: "var(--text)", fontSize: 21, fontWeight: 800, letterSpacing: "-0.035em", margin: 0 }}>Aún no hay activos valorizados</h2>
      <p style={{ color: "var(--text-soft)", fontSize: 14, lineHeight: 1.6, margin: "0 auto", maxWidth: 620 }}>
        Carga movimientos o documentación para que LEDGERA consolide tus activos, base de costo y valorización en pesos chilenos.
      </p>
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
      .then((response) => {
        if (!cancelled) setSummary(response.data);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const visibleAssets = useMemo(() => {
    const assets = summary?.assets ?? [];
    if (hiddenAssetSymbols.size === 0) return assets;
    return assets.filter((asset) => !hiddenAssetSymbols.has(asset.symbol));
  }, [summary, hiddenAssetSymbols]);

  const topComposition = useMemo(() => {
    const total = visibleAssets.reduce((acc, asset) => acc + (asset.valueClp ?? 0), 0);
    return visibleAssets.slice(0, 5).map((asset) => ({
      symbol: asset.symbol,
      pct: total > 0 && asset.valueClp ? (asset.valueClp / total) * 100 : 0,
      valueClp: asset.valueClp ?? 0,
    }));
  }, [visibleAssets]);

  const resultLabel = "Diferencia vs. base de costo";
  const hiddenAssetsCount = hiddenAssetSymbols.size;

  function hideAssetFromView(symbol: string) {
    setHiddenAssetSymbols((current) => {
      const next = new Set(current);
      next.add(symbol);
      return next;
    });
  }

  function restoreAssetView() {
    setHiddenAssetSymbols(new Set());
  }

  return (
    <main style={{ minHeight: "calc(100vh - 96px)", background: "var(--bg-sunken)", color: "var(--text)", fontFamily: panelFont, padding: "clamp(16px,2.4vw,28px)", boxSizing: "border-box" }}>
      <div style={{ maxWidth: 1220, margin: "0 auto", display: "grid", gap: 16 }}>
        <section style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <div style={{ display: "grid", gap: 7, flex: "1 1 auto", minWidth: 0, maxWidth: "none" }}>
            <p style={{ color: "var(--accent)", fontSize: 11.5, fontWeight: 800, letterSpacing: "0.08em", margin: 0, textTransform: "uppercase" }}>Resumen de activos</p>
            <h1 style={{ color: "var(--text)", fontSize: "clamp(1.9rem,2.9vw,2.55rem)", lineHeight: 1, letterSpacing: "-0.048em", fontWeight: 800, margin: 0, whiteSpace: "normal" }}>
              Activos actuales, valorización y diferencia frente a costo
            </h1>
            <p style={{ color: "var(--text-soft)", fontSize: 14.5, lineHeight: 1.55, margin: 0, maxWidth: 690 }}>
              Consulta tus activos confirmados, su precio actual y valor en pesos chilenos.
            </p>
          </div>
          <aside style={{ background: "var(--bg-elev)", border: "1px solid var(--border)", borderRadius: 18, padding: 14, minWidth: 240, display: "grid", gap: 7, justifyItems: "center", textAlign: "center" }}>
            <span style={{ color: "var(--text-faint)", fontSize: 12, fontWeight: 800 }}>Tipo de cambio usado</span>
            <strong style={{ color: "var(--text)", fontSize: 20, fontWeight: 800, letterSpacing: "-0.03em" }}>{summary ? formatUsdClpRate(summary.usdClp) : loading ? "Cargando..." : "—"}</strong>
            <span style={{ color: "var(--text-soft)", fontSize: 12 }}>Fuente: {summary ? normalizeSource(summary.fxSource) : "—"}</span>
            <span style={{ color: "var(--text-faint)", fontSize: 12 }}>Actualizado: {summary ? formatDateTime(summary.generatedAt) : "—"}</span>
          </aside>
        </section>

        {loading ? (
          <section style={{ background: "var(--bg-elev)", border: "1px solid var(--border)", borderRadius: 22, padding: 28, color: "var(--text-soft)" }}>Cargando resumen de activos...</section>
        ) : error ? (
          <section style={{ background: "rgba(253, 164, 175, 0.14)", border: "1px solid rgba(253, 164, 175, 0.32)", borderRadius: 22, padding: 22, color: "var(--loss)" }}>No fue posible cargar el resumen de activos.</section>
        ) : !summary || summary.assets.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(210px,280px))", gap: 12, justifyContent: "center", alignItems: "stretch" }}>
              <KpiCard label="Valor total actual" value={formatClp(summary.totals.valueClp)} helper={`Valor USD ${formatUsd(summary.totals.valueUsd)} · TC ${formatNumber(summary.usdClp, 2)}`} />
              <KpiCard label={resultLabel} value={formatClp(summary.totals.unrealizedPnlClp)} helper={`Variación porcentual: ${formatPct(summary.totals.unrealizedPnlPct)}`} accent={resultColor(summary.totals.unrealizedPnlClp)} />
              <KpiCard label="Activos detectados" value={String(summary.counts.assets)} helper="Con saldo actual" accent="var(--accent)" />
              <KpiCard label="Operaciones utilizadas" value={String(summary.counts.operations)} helper="Movimientos usados para consolidar saldos" accent="var(--accent)" />
            </section>

            <section style={{ background: "var(--bg-elev)", border: "1px solid var(--border)", borderRadius: 22, overflow: "hidden", boxShadow: "var(--shadow-sm)" }}>
              <div style={{ padding: "15px 18px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10, whiteSpace: "nowrap", overflow: "hidden" }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: 10, minWidth: 0 }}>
                  <h2 style={{ color: "var(--text)", fontSize: 16.5, fontWeight: 800, margin: 0, letterSpacing: "-0.025em", flex: "0 0 auto" }}>Activos valorizados</h2>
                  <p style={{ color: "var(--text-soft)", fontSize: 12.5, margin: 0, overflow: "hidden", textOverflow: "ellipsis", minWidth: 0 }}>Valor actual, conversión a CLP, origen operativo y diferencia frente a costo.</p>
                </div>
                {hiddenAssetsCount > 0 ? (
                  <button
                    type="button"
                    onClick={restoreAssetView}
                    title="Vuelve a mostrar todos los activos ocultos en esta vista."
                    style={{ background: "var(--bg-sunken)", border: "1px solid var(--border-strong)", borderRadius: 999, color: "var(--accent)", cursor: "pointer", flex: "0 0 auto", fontSize: 12, fontWeight: 800, padding: "7px 10px" }}
                  >
                    Restaurar vista ({hiddenAssetsCount})
                  </button>
                ) : null}
              </div>

              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", minWidth: 1400, borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "var(--bg-sunken)", color: "var(--text-faint)", fontSize: 10.8, letterSpacing: "0.04em", textTransform: "uppercase", textAlign: "left", whiteSpace: "nowrap" }}>
                      <HeaderCell title="Criptoactivo o token valorizado.">Activo</HeaderCell>
                      <HeaderCell align="center" title="Cantidad de operaciones confirmadas usadas para calcular el saldo actual de este activo.">OPS</HeaderCell>
                      <HeaderCell align="right" title="Saldo actual del activo después de aplicar entradas y salidas confirmadas.">Cantidad</HeaderCell>
                      <HeaderCell align="right" title="Precio unitario actual usado para valorizar una unidad del activo en dólares.">Precio unitario USD</HeaderCell>
                      <HeaderCell title="Exchange o proveedor de servicio de origen de las operaciones usadas para construir el saldo.">Origen</HeaderCell>
                      <HeaderCell align="right" title="Valor actual del saldo en dólares: cantidad por precio unitario.">Valor USD</HeaderCell>
                      <HeaderCell align="right" title="Valor actual convertido a pesos chilenos con el tipo de cambio usado.">Valor CLP</HeaderCell>
                      <HeaderCell align="right" title="Costo de adquisición acumulado del saldo actual, convertido a pesos chilenos.">Costo de compra CLP</HeaderCell>
                      <HeaderCell align="right" title="Diferencia en pesos entre el valor actual y el costo de compra.">Diferencia CLP</HeaderCell>
                      <HeaderCell align="right" title="Diferencia porcentual entre el valor actual y el costo de compra.">Diferencia %</HeaderCell>
                      <HeaderCell align="center" title="Nivel de integridad de los datos usados para valorizar el activo.">Estado de datos</HeaderCell>
                      <HeaderCell align="center" title="Borra el activo solo de esta vista. La información permanece en la base de datos.">Borrar</HeaderCell>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleAssets.length === 0 ? (
                      <tr style={{ borderTop: "1px solid var(--border)", color: "var(--text-soft)", fontSize: 13 }}>
                        <td colSpan={12} style={{ padding: "18px 14px", textAlign: "center" }}>
                          Todos los activos fueron ocultados de esta vista. La información sigue guardada.
                        </td>
                      </tr>
                    ) : visibleAssets.map((asset) => {
                      const meta = statusMeta[asset.status];
                      return (
                        <tr key={asset.symbol} style={{ borderTop: "1px solid var(--border)", color: "var(--text)", fontSize: 13 }}>
                          <td style={{ padding: "13px 14px" }}><strong style={{ color: "var(--text)", fontSize: 14, fontWeight: 800 }}>{asset.symbol}</strong></td>
                          <td style={{ padding: "13px 14px", textAlign: "center", fontWeight: 800, fontFamily: monoFont }}>{asset.operations}</td>
                          <td style={{ padding: "13px 14px", textAlign: "right", fontWeight: 800, fontFamily: monoFont }}>{formatNumber(asset.quantity)}</td>
                          <td style={{ padding: "13px 14px", textAlign: "right", fontFamily: monoFont }}>{formatUsd(asset.priceUsd)}</td>
                          <td style={{ padding: "13px 14px", color: "var(--text-soft)", fontSize: 12 }}>{normalizeOrigin(asset.originSource)}</td>
                          <td style={{ padding: "13px 14px", textAlign: "right", fontFamily: monoFont }}>{formatUsd(asset.valueUsd)}</td>
                          <td style={{ padding: "13px 14px", textAlign: "right", fontWeight: 800, color: "var(--text)", fontFamily: monoFont }}>{formatClp(asset.valueClp)}</td>
                          <td style={{ padding: "13px 14px", textAlign: "right", fontFamily: monoFont }}>{formatClp(asset.costBasisClp)}</td>
                          <td style={{ padding: "13px 14px", textAlign: "right", color: resultColor(asset.unrealizedPnlClp), fontWeight: 800, fontFamily: monoFont }}>{formatClp(asset.unrealizedPnlClp)}</td>
                          <td style={{ padding: "13px 14px", textAlign: "right", color: resultColor(asset.unrealizedPnlClp), fontWeight: 800, fontFamily: monoFont }}>{formatPct(asset.unrealizedPnlPct)}</td>
                          <td style={{ padding: "13px 14px", textAlign: "center" }}><span style={{ background: meta.bg, border: `1px solid ${meta.border}`, borderRadius: 999, color: meta.color, display: "inline-flex", fontSize: 11.5, fontWeight: 800, justifyContent: "center", padding: "5px 8px", whiteSpace: "nowrap" }}>{meta.label}</span></td>
                          <td style={{ padding: "13px 14px", textAlign: "center" }}>
                            <button
                              type="button"
                              aria-label={`Borrar ${asset.symbol} de esta vista`}
                              title="Borrar solo de esta vista. No elimina datos de la base de datos."
                              onClick={() => hideAssetFromView(asset.symbol)}
                              style={{ alignItems: "center", background: "transparent", border: "1px solid rgba(253, 164, 175, 0.35)", borderRadius: 999, color: "var(--loss)", cursor: "pointer", display: "inline-flex", fontSize: 16, fontWeight: 900, height: 26, justifyContent: "center", lineHeight: 1, width: 26 }}
                            >
                              ×
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>

            <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,280px),1fr))", gap: 14 }}>
              <article style={{ background: "var(--bg-elev)", border: "1px solid var(--border)", borderRadius: 22, padding: 18, display: "grid", gap: 12 }}>
                <h2 style={{ color: "var(--text)", fontSize: 16.5, fontWeight: 800, margin: 0, letterSpacing: "-0.025em" }}>Composición del portafolio</h2>
                {topComposition.map((item) => (
                  <div key={item.symbol} style={{ display: "grid", gap: 6 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", color: "var(--text)", fontSize: 13, gap: 12 }}><strong>{item.symbol}</strong><span style={{ color: "var(--text-soft)", fontFamily: monoFont }}>{formatPct(item.pct)} · {formatClp(item.valueClp)}</span></div>
                    <div style={{ height: 9, background: "var(--bg-sunken)", borderRadius: 999, overflow: "hidden" }}><div style={{ height: "100%", width: `${Math.max(2, Math.min(100, item.pct))}%`, background: "var(--accent)", borderRadius: 999 }} /></div>
                  </div>
                ))}
              </article>

              <article style={{ background: "var(--bg-elev)", border: "1px solid var(--border)", borderRadius: 22, padding: 18, display: "grid", gap: 14, alignContent: "start" }}>
                <div style={{ display: "grid", gap: 6 }}>
                  <h2 style={{ color: "var(--text)", fontSize: 16.5, fontWeight: 800, margin: 0, letterSpacing: "-0.025em" }}>Calidad del respaldo</h2>
                  <p style={{ color: "var(--text-soft)", fontSize: 13.5, lineHeight: 1.55, margin: 0 }}>
                    Revisa la integridad de los datos usados para valorizar el portafolio antes de avanzar a obligaciones o declaraciones.
                  </p>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(120px,1fr))", gap: 10 }}>
                  <div style={{ background: "var(--bg-sunken)", border: "1px solid var(--border)", borderRadius: 16, padding: 12, display: "grid", gap: 4 }}>
                    <span style={{ color: "var(--text-faint)", fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.04em" }}>Operaciones base</span>
                    <strong style={{ color: "var(--text)", fontSize: 20, fontWeight: 800, fontFamily: monoFont }}>{summary.counts.operations}</strong>
                  </div>
                  <div style={{ background: "var(--bg-sunken)", border: "1px solid var(--border)", borderRadius: 16, padding: 12, display: "grid", gap: 4 }}>
                    <span style={{ color: "var(--text-faint)", fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.04em" }}>Por revisar</span>
                    <strong style={{ color: summary.counts.review > 0 ? "var(--warn)" : "var(--gain)", fontSize: 20, fontWeight: 800, fontFamily: monoFont }}>{summary.counts.review}</strong>
                  </div>
                  <div style={{ background: "var(--bg-sunken)", border: "1px solid var(--border)", borderRadius: 16, padding: 12, display: "grid", gap: 4 }}>
                    <span style={{ color: "var(--text-faint)", fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.04em" }}>Sin precio</span>
                    <strong style={{ color: summary.counts.missingPrice > 0 ? "var(--loss)" : "var(--gain)", fontSize: 20, fontWeight: 800, fontFamily: monoFont }}>{summary.counts.missingPrice}</strong>
                  </div>
                </div>

                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <Link href="/importaciones" style={{ background: "var(--accent)", color: "var(--accent-contrast)", borderRadius: 999, padding: "9px 12px", fontSize: 12.5, fontWeight: 800, textDecoration: "none" }}>Revisar importaciones</Link>
                  <Link href="/cryptoactivos" style={{ background: "var(--bg-sunken)", color: "var(--accent)", border: "1px solid var(--border-strong)", borderRadius: 999, padding: "9px 12px", fontSize: 12.5, fontWeight: 800, textDecoration: "none" }}>Ver activos</Link>
                </div>
              </article>
            </section>
          </>
        )}
      </div>
    </main>
  );
}
