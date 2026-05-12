"use client";

import React, { useEffect, useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type TaxHealthStatus = "OK" | "REVIEW" | "RISK";
type PeriodStatus = "OPEN" | "CLOSED" | "REOPENED";
type NormalizedTaxType = "CAPITAL" | "ORDINARY" | "NON_TAXABLE" | "PENDING";
type Section = "resumen" | "eventos" | "reportes";

interface TaxCategory {
  normalizedTaxType: NormalizedTaxType;
  label: string;
  count: number;
  totalPnlUsd: number;
  totalPnlClp: number;
  totalProceedsNetUsd: number;
  totalCostBasisUsd: number;
  totalFeeUsd: number;
}

interface TaxHealth {
  status: TaxHealthStatus;
  score: number;
  issues: { type: string; count: number; message: string }[];
  blocked: boolean;
  blockReason?: string;
}

interface TaxTotals {
  totalEvents: number;
  totalQuantity: number;
  totalPnlUsd: number;
  totalPnlClp: number;
  totalProceedsGrossUsd: number;
  totalProceedsNetUsd: number;
  totalCostBasisUsd: number;
  totalFeeUsd: number;
}

interface TaxEvent {
  id: string;
  movementId: string;
  eventType: string;
  symbol: string;
  executedAt: string;
  quantity: number;
  effectiveTaxCategory: string;
  averageCostUsdAtSale: number;
  proceedsGrossUsd: number;
  proceedsNetUsd: number;
  costBasisUsd: number;
  feeUsd: number;
  realizedPnlUsd: number;
  usdClp: number;
  realizedPnlClp: number;
}

interface PeriodData {
  year: number;
  status: PeriodStatus;
  isClosed: boolean;
  closedAt: string | null;
  reopenedAt: string | null;
  closedReason: string | null;
}

interface TributarioData {
  events: TaxEvent[];
  totals: TaxTotals;
  taxSummary: { totalEvents: number; categories: TaxCategory[] };
  taxHealth: TaxHealth;
  period: PeriodData;
}

interface HealthConfigItem {
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
}

interface PeriodConfigItem {
  label: string;
  color: string;
  bg: string;
}

type Movimiento = {
  id:                      string;
  type:                    string;
  symbol:                  string;
  quantity:                number;
  priceUsd:                number;
  feeUsd:                  number;
  executedAt:              string;
  suggestedTaxCategory:    string;
  appliedTaxCategory:      string | null;
  taxClassificationSource: string;
};

// ─── Config ───────────────────────────────────────────────────────────────────

const HEALTH_CONFIG: Record<TaxHealthStatus, HealthConfigItem> = {
  OK:     { label: "OK",      color: "#16A34A", bgColor: "rgba(22,163,74,0.07)",  borderColor: "rgba(22,163,74,0.22)"  },
  REVIEW: { label: "REVISAR", color: "#D97706", bgColor: "rgba(245,158,11,0.07)", borderColor: "rgba(245,158,11,0.22)" },
  RISK:   { label: "RIESGO",  color: "#DC2626", bgColor: "rgba(220,38,38,0.07)",  borderColor: "rgba(220,38,38,0.22)"  },
};

const PERIOD_CONFIG: Record<PeriodStatus, PeriodConfigItem> = {
  OPEN:     { label: "Periodo abierto",   color: "#16A34A", bg: "rgba(22,163,74,0.08)"    },
  CLOSED:   { label: "Periodo cerrado",   color: "#64748B", bg: "rgba(100,116,139,0.08)"  },
  REOPENED: { label: "Periodo reabierto", color: "#D97706", bg: "rgba(245,158,11,0.08)"   },
};

const CATEGORY_COLORS: Record<NormalizedTaxType, string> = {
  CAPITAL:     "#0F2A3D",
  ORDINARY:    "#D97706",
  NON_TAXABLE: "#16A34A",
  PENDING:     "#DC2626",
};

const CATEGORIAS_SII: Record<string, string> = {
  CAPITAL_GAIN:    "Mayor valor (Art. 17 N°8 LIR)",
  CAPITAL_LOSS:    "Pérdida de capital",
  HABITUAL_INCOME: "Renta habitual (IGC)",
  BREAKEVEN_REVIEW:"Revisar — sin ganancia/pérdida",
  UNCLASSIFIED:    "Sin clasificar",
  STAKING_REWARD:  "Recompensa staking",
  AIRDROP:         "Airdrop",
  FEE:             "Comisión",
};

const TIPO: Record<string, string> = {
  BUY:  "Compra",
  SELL: "Venta",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatUsd(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
}

function formatClp(value: number) {
  return new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("es-CL", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function formatNumber(value: number, decimals = 8) {
  return new Intl.NumberFormat("es-CL", { minimumFractionDigits: 0, maximumFractionDigits: decimals }).format(value);
}

function pnlColor(value: number) {
  if (value > 0) return "#16A34A";
  if (value < 0) return "#DC2626";
  return "#64748B";
}

const currentYear = new Date().getFullYear();

const cellStyle: React.CSSProperties = {
  padding: "0.75rem",
  color: "#475569",
  verticalAlign: "middle",
  whiteSpace: "nowrap",
  fontSize: "0.875rem",
};

// ─── ExcelPendientes ──────────────────────────────────────────────────────────

function generarCSV(movimientos: Movimiento[]): string {
  const encabezado = [
    "ID",
    "Tipo",
    "Símbolo",
    "Cantidad",
    "Precio USD",
    "Comisión USD",
    "Fecha ejecución",
    "Categoría sugerida SII",
    "Categoría aplicada",
    "Fuente clasificación",
    "Estado",
  ].join(";");

  const filas = movimientos.map(m => [
    m.id,
    TIPO[m.type] ?? m.type,
    m.symbol,
    m.quantity.toString().replace(".", ","),
    m.priceUsd.toString().replace(".", ","),
    m.feeUsd.toString().replace(".", ","),
    formatDate(m.executedAt),
    CATEGORIAS_SII[m.suggestedTaxCategory] ?? m.suggestedTaxCategory,
    m.appliedTaxCategory ? (CATEGORIAS_SII[m.appliedTaxCategory] ?? m.appliedTaxCategory) : "PENDIENTE",
    m.taxClassificationSource,
    m.appliedTaxCategory ? "Clasificado" : "Pendiente",
  ].join(";"));

  return [encabezado, ...filas].join("\n");
}

function descargarCSV(contenido: string, nombre: string) {
  const BOM  = "\uFEFF";
  const blob = new Blob([BOM + contenido], { type: "text/csv;charset=utf-8;" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = nombre;
  a.click();
  URL.revokeObjectURL(url);
}

function ExcelPendientes() {
  const [cargando, setCargando] = useState(false);
  const [total,    setTotal]    = useState<number | null>(null);
  const [error,    setError]    = useState("");

  async function exportar() {
    setCargando(true);
    setError("");
    try {
      const res = await fetch("/api/exportar/movimientos-pendientes");
      if (!res.ok) throw new Error("Error al obtener movimientos");
      const json = await res.json();
      const movimientos: Movimiento[] = json.data ?? json;

      if (movimientos.length === 0) {
        setTotal(0);
        setCargando(false);
        return;
      }

      const csv   = generarCSV(movimientos);
      const fecha = new Date().toISOString().slice(0, 10);
      descargarCSV(csv, `ledgera-movimientos-pendientes-${fecha}.csv`);
      setTotal(movimientos.length);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error inesperado");
    } finally {
      setCargando(false);
    }
  }

  return (
    <div
      style={{
        background:     "rgba(245,158,11,0.06)",
        border:         "1px solid rgba(245,158,11,0.2)",
        borderRadius:   "12px",
        padding:        "1.25rem 1.5rem",
        marginBottom:   "16px",
        display:        "flex",
        alignItems:     "center",
        justifyContent: "space-between",
        gap:            "1rem",
        flexWrap:       "wrap",
      }}
    >
      <div>
        <p style={{ fontSize: "0.9375rem", fontWeight: 700, color: "#0F2A3D", margin: "0 0 4px", fontFamily: "'Space Grotesk', sans-serif" }}>
          Movimientos pendientes de clasificación
        </p>
        <p style={{ fontSize: "0.8125rem", color: "#64748B", margin: 0 }}>
          Exporta en formato CSV compatible con Excel para revisar y clasificar tributariamente.
        </p>
        {total === 0 && (
          <p style={{ fontSize: "0.75rem", color: "#16A34A", margin: "6px 0 0", fontWeight: 500 }}>
            ✓ No hay movimientos pendientes de clasificar.
          </p>
        )}
        {total !== null && total > 0 && (
          <p style={{ fontSize: "0.75rem", color: "#D97706", margin: "6px 0 0", fontWeight: 500 }}>
            {total} movimiento{total > 1 ? "s" : ""} exportado{total > 1 ? "s" : ""} correctamente.
          </p>
        )}
        {error && (
          <p style={{ fontSize: "0.75rem", color: "#DC2626", margin: "6px 0 0" }}>{error}</p>
        )}
      </div>

      <button
        type="button"
        onClick={exportar}
        disabled={cargando}
        style={{
          display:      "flex",
          alignItems:   "center",
          gap:          "8px",
          padding:      "0.5rem 1.25rem",
          borderRadius: "8px",
          border:       "none",
          background:   cargando ? "#94A3B8" : "#0F2A3D",
          color:        "#ffffff",
          fontSize:     "0.8125rem",
          fontWeight:   600,
          cursor:       cargando ? "not-allowed" : "pointer",
          fontFamily:   "'Plus Jakarta Sans', sans-serif",
          whiteSpace:   "nowrap",
          flexShrink:   0,
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
        {cargando ? "Generando..." : "Exportar CSV"}
      </button>
    </div>
  );
}

// ─── ReportesSection ──────────────────────────────────────────────────────────

interface ReporteItem {
  key: string;
  title: string;
  description: string;
  href: string;
  color: string;
  blockedWhen: "never" | "pending" | "noEvents";
}

const REPORTES: ReporteItem[] = [
  {
    key: "csv-informativo",
    title: "CSV Borrador informativo",
    description: "Resumen tributario del periodo para revision personal. Incluye PnL, categorias y detalle de eventos.",
    href: "/api/tax/events/export-informative",
    color: "#0F2A3D",
    blockedWhen: "noEvents",
  },
  {
    key: "csv-contador",
    title: "CSV para contador",
    description: "Reporte formal para entrega a contador. Requiere que todos los eventos tengan clasificacion definitiva.",
    href: "/api/tax/events/export-strict",
    color: "#16A34A",
    blockedWhen: "pending",
  },
  {
    key: "pdf-informativo",
    title: "PDF Borrador informativo",
    description: "Version PDF del borrador informativo. Descargable con detalle de eventos y resumen por periodo.",
    href: "/api/tax/reports/pdf-informative",
    color: "#0F2A3D",
    blockedWhen: "noEvents",
  },
  {
    key: "pdf-estricto",
    title: "PDF verificable (contador / SII)",
    description: "Reporte formal con hash SHA256 y QR de verificacion publica. Requiere clasificacion completa.",
    href: "/api/tax/reports/pdf-strict",
    color: "#16A34A",
    blockedWhen: "pending",
  },
];

function ReportesSection({
  year,
  hasEvents,
  hasPending,
  blocked,
}: {
  year: number;
  hasEvents: boolean;
  hasPending: boolean;
  blocked: boolean;
}) {
  const [loadingKey, setLoadingKey] = useState<string | null>(null);
  const [errorKey,   setErrorKey]   = useState<string | null>(null);
  const [errorMsg,   setErrorMsg]   = useState<string | null>(null);

  async function handleDownload(reporte: ReporteItem) {
    setErrorKey(null);
    setErrorMsg(null);
    setLoadingKey(reporte.key);
    try {
      const url = `${reporte.href}?year=${year}`;
      const res = await fetch(url);
      if (!res.ok) {
        const json = await res.json().catch(() => null);
        const msg =
          res.status === 409 ? `Bloqueado: ${json?.message ?? "existen eventos pendientes de clasificacion."}` :
          res.status === 404 ? `Sin datos: ${json?.message ?? "no hay eventos para este periodo."}` :
          json?.message ?? "Error al generar el reporte.";
        setErrorKey(reporte.key);
        setErrorMsg(msg);
        return;
      }
      const blob        = await res.blob();
      const disposition = res.headers.get("content-disposition") ?? "";
      const match       = disposition.match(/filename="?([^"]+)"?/);
      const filename    = match?.[1] ?? `ledgera-reporte-${year}`;
      const blobUrl     = URL.createObjectURL(blob);
      const a           = document.createElement("a");
      a.href     = blobUrl;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(blobUrl);
    } catch {
      setErrorKey(reporte.key);
      setErrorMsg("Error de conexion al generar el reporte.");
    } finally {
      setLoadingKey(null);
    }
  }

  function isBlocked(reporte: ReporteItem): { blocked: boolean; reason: string } {
    if (blocked) return { blocked: true, reason: "Operaciones bloqueadas por inconsistencias tributarias" };
    if (reporte.blockedWhen === "noEvents" && !hasEvents) return { blocked: true, reason: `Sin eventos tributarios para ${year}` };
    if (reporte.blockedWhen === "pending" && hasPending) return { blocked: true, reason: "Requiere que todos los eventos tengan clasificacion definitiva" };
    return { blocked: false, reason: "" };
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>

      {/* ── Exportar movimientos pendientes ── */}
      <ExcelPendientes />

      {/* ── Reportes tributarios ── */}
      {REPORTES.map((reporte) => {
        const { blocked: isBlockedItem, reason } = isBlocked(reporte);
        const isLoading = loadingKey === reporte.key;
        const hasError  = errorKey   === reporte.key;
        return (
          <div
            key={reporte.key}
            style={{
              background:   "#ffffff",
              border:       `1px solid ${isBlockedItem ? "rgba(15,42,61,0.08)" : "#E2E8F0"}`,
              borderRadius: "12px",
              padding:      "1.25rem 1.5rem",
              opacity:      isBlockedItem ? 0.6 : 1,
            }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: "200px" }}>
                <p style={{ margin: "0 0 4px", fontWeight: 700, fontSize: "0.9375rem", color: isBlockedItem ? "#94A3B8" : "#0F2A3D", fontFamily: "'Space Grotesk', sans-serif" }}>
                  {reporte.title}
                </p>
                <p style={{ margin: 0, fontSize: "0.8125rem", color: "#64748B" }}>{reporte.description}</p>
                {isBlockedItem && (
                  <p style={{ margin: "6px 0 0", fontSize: "0.75rem", color: "#D97706", fontWeight: 500 }}>{reason}</p>
                )}
                {hasError && errorMsg && (
                  <p style={{ margin: "6px 0 0", fontSize: "0.75rem", color: "#DC2626", background: "rgba(220,38,38,0.05)", padding: "4px 8px", borderRadius: "6px", border: "1px solid rgba(220,38,38,0.15)" }}>
                    {errorMsg}
                  </p>
                )}
              </div>
              <button
                onClick={() => !isBlockedItem && !isLoading && handleDownload(reporte)}
                disabled={isBlockedItem || isLoading}
                style={{
                  padding:      "0.5rem 1.25rem",
                  borderRadius: "8px",
                  background:   isBlockedItem ? "#F1F5F9" : isLoading ? "#94A3B8" : reporte.color,
                  color:        isBlockedItem ? "#94A3B8" : "#ffffff",
                  fontSize:     "0.8125rem",
                  fontWeight:   600,
                  border:       "none",
                  cursor:       isBlockedItem || isLoading ? "not-allowed" : "pointer",
                  fontFamily:   "'Plus Jakarta Sans', sans-serif",
                  whiteSpace:   "nowrap",
                  flexShrink:   0,
                }}
              >
                {isLoading ? "Generando..." : `Descargar ${year}`}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TributarioPage() {
  const [year,    setYear]    = useState(currentYear);
  const [section, setSection] = useState<Section>("resumen");
  const [data,    setData]    = useState<TributarioData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    async function fetchAll() {
      setLoading(true);
      setError(null);
      try {
        const [eventsRes, periodRes, healthRes] = await Promise.all([
          fetch(`/api/tax/events?year=${year}`),
          fetch(`/api/tax/periods/status?year=${year}`),
          fetch(`/api/tax/health`),
        ]);
        if (!eventsRes.ok || !periodRes.ok) throw new Error("Error al conectar con el motor tributario");
        const eventsJson = await eventsRes.json();
        const periodJson = await periodRes.json();
        const healthJson = await healthRes.json();
        if (!eventsJson.ok || !periodJson.ok) throw new Error(eventsJson.message ?? periodJson.message ?? "Respuesta invalida");
        setData({
          events:     eventsJson.data.events,
          totals:     eventsJson.data.totals,
          taxSummary: eventsJson.data.taxSummary,
          taxHealth: {
            ...eventsJson.data.taxHealth,
            blocked:     healthJson.ok ? healthJson.data.blocked     : false,
            blockReason: healthJson.ok ? healthJson.data.blockReason : undefined,
          },
          period: periodJson.data,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error inesperado");
      } finally {
        setLoading(false);
      }
    }
    fetchAll();
  }, [year]);

  if (loading) {
    return (
      <>
        <style>{`@keyframes ledgera-spin { to { transform: rotate(360deg); } }`}</style>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "60vh", gap: "1rem" }}>
          <div style={{ width: 28, height: 28, border: "2px solid rgba(15,42,61,0.12)", borderTopColor: "#0F2A3D", borderRadius: "50%", animation: "ledgera-spin 0.75s linear infinite" }} />
          <p style={{ color: "#94A3B8", fontSize: "0.875rem", margin: 0 }}>Cargando modulo tributario...</p>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <div style={{ padding: "2rem" }}>
        <div style={{ background: "rgba(220,38,38,0.06)", border: "1px solid rgba(220,38,38,0.18)", borderRadius: "12px", padding: "1.25rem 1.5rem" }}>
          <p style={{ color: "#DC2626", fontWeight: 600, margin: "0 0 4px" }}>Error al cargar Tributario</p>
          <p style={{ color: "#64748B", margin: 0, fontSize: "0.875rem" }}>{error}</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { events, totals, taxSummary, taxHealth, period } = data;
  const hcfg = HEALTH_CONFIG[taxHealth.status];
  const pcfg = PERIOD_CONFIG[period.status];

  return (
    <div style={{ maxWidth: "1100px", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "1.5rem", gap: "1rem", flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "1.375rem", fontWeight: 700, color: "#0F2A3D", margin: "0 0 4px" }}>Tributario</h1>
          <p style={{ color: "#94A3B8", margin: 0, fontSize: "0.875rem" }}>Analisis tributario de tus operaciones cripto</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {[currentYear - 1, currentYear].map((y) => (
            <button key={y} onClick={() => setYear(y)}
              style={{ padding: "6px 16px", borderRadius: "8px", border: "1px solid", borderColor: year === y ? "#0F2A3D" : "rgba(15,42,61,0.15)", background: year === y ? "#0F2A3D" : "transparent", color: year === y ? "#ffffff" : "#64748B", fontSize: "0.875rem", fontWeight: year === y ? 600 : 400, cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              {y}
            </button>
          ))}
        </div>
      </div>

      {/* Banner bloqueo */}
      {taxHealth.blocked && (
        <div style={{ background: "rgba(220,38,38,0.06)", border: "1px solid rgba(220,38,38,0.25)", borderRadius: "12px", padding: "1rem 1.25rem", marginBottom: "1.25rem", display: "flex", alignItems: "flex-start", gap: "0.75rem" }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#DC2626", flexShrink: 0, marginTop: "5px" }} />
          <div>
            <p style={{ margin: "0 0 4px", fontWeight: 700, fontSize: "0.9375rem", color: "#DC2626" }}>Operaciones bloqueadas</p>
            <p style={{ margin: 0, fontSize: "0.8125rem", color: "#64748B" }}>{taxHealth.blockReason ?? "Existen inconsistencias tributarias que deben resolverse antes de continuar."}</p>
          </div>
        </div>
      )}

      {/* Estado periodo + health */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "1.25rem" }}>
        <div style={{ background: pcfg.bg, borderRadius: "12px", padding: "1rem 1.25rem", border: `1px solid ${pcfg.color}22`, display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: pcfg.color, flexShrink: 0 }} />
          <div>
            <p style={{ margin: 0, fontWeight: 600, fontSize: "0.875rem", color: pcfg.color }}>{pcfg.label}</p>
            <p style={{ margin: 0, fontSize: "0.75rem", color: "#94A3B8" }}>Periodo {year}{period.closedAt ? ` — cerrado ${formatDate(period.closedAt)}` : ""}</p>
          </div>
        </div>
        <div style={{ background: hcfg.bgColor, borderRadius: "12px", padding: "1rem 1.25rem", border: `1px solid ${hcfg.borderColor}`, display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: hcfg.color, flexShrink: 0 }} />
          <div>
            <p style={{ margin: 0, fontWeight: 600, fontSize: "0.875rem", color: hcfg.color }}>{hcfg.label}</p>
            <p style={{ margin: 0, fontSize: "0.75rem", color: "#94A3B8" }}>Score {taxHealth.score}/100{taxHealth.issues.length > 0 ? ` — ${taxHealth.issues.length} senal${taxHealth.issues.length > 1 ? "es" : ""}` : " — sin observaciones"}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "4px", marginBottom: "1.5rem", borderBottom: "1px solid #E2E8F0" }}>
        {(["resumen", "eventos", "reportes"] as Section[]).map((s) => (
          <button key={s} onClick={() => setSection(s)}
            style={{ padding: "8px 18px", borderRadius: "8px 8px 0 0", border: "none", borderBottom: section === s ? "2px solid #0F2A3D" : "2px solid transparent", background: "transparent", color: section === s ? "#0F2A3D" : "#94A3B8", fontWeight: section === s ? 600 : 400, fontSize: "0.875rem", cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif", textTransform: "capitalize" }}>
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {/* RESUMEN */}
      {section === "resumen" && (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "10px", marginBottom: "1.25rem" }}>
            {[
              { label: "Eventos totales",    value: String(totals.totalEvents),            highlight: false },
              { label: "PnL realizado USD",  value: formatUsd(totals.totalPnlUsd),         highlight: true  },
              { label: "PnL realizado CLP",  value: formatClp(totals.totalPnlClp),         highlight: true  },
              { label: "Ingresos netos USD", value: formatUsd(totals.totalProceedsNetUsd), highlight: false },
              { label: "Costo base USD",     value: formatUsd(totals.totalCostBasisUsd),   highlight: false },
            ].map(({ label, value, highlight }) => (
              <div key={label} style={{ background: "#F1F5F9", borderRadius: "10px", padding: "1rem" }}>
                <p style={{ fontSize: "0.6875rem", color: "#64748B", margin: "0 0 6px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</p>
                <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "1.375rem", fontWeight: 700, color: highlight ? pnlColor(totals.totalPnlUsd) : "#0F2A3D", margin: 0, lineHeight: 1 }}>{value}</p>
              </div>
            ))}
          </div>

          <div style={{ marginBottom: "1.25rem" }}>
            <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "0.9375rem", fontWeight: 700, color: "#0F2A3D", margin: "0 0 0.75rem" }}>Distribucion por categoria</h2>
            {taxSummary.categories.length === 0 ? (
              <div style={{ background: "#F8FAFC", border: "1px dashed rgba(15,42,61,0.13)", borderRadius: "10px", padding: "2rem", textAlign: "center", color: "#94A3B8", fontSize: "0.875rem" }}>
                Sin eventos tributarios para el periodo {year}
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {taxSummary.categories.map((cat) => (
                  <div key={cat.normalizedTaxType} style={{ background: "#ffffff", border: "1px solid #E2E8F0", borderRadius: "10px", padding: "1rem 1.25rem", display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: CATEGORY_COLORS[cat.normalizedTaxType], flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: "120px" }}>
                      <p style={{ margin: 0, fontWeight: 600, fontSize: "0.9375rem", color: CATEGORY_COLORS[cat.normalizedTaxType] }}>{cat.label}</p>
                      <p style={{ margin: 0, fontSize: "0.75rem", color: "#94A3B8" }}>{cat.count} evento{cat.count !== 1 ? "s" : ""}</p>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <p style={{ margin: 0, fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: "1rem", color: pnlColor(cat.totalPnlUsd) }}>{formatUsd(cat.totalPnlUsd)}</p>
                      <p style={{ margin: 0, fontSize: "0.75rem", color: "#94A3B8" }}>{formatClp(cat.totalPnlClp)}</p>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <p style={{ margin: 0, fontSize: "0.75rem", color: "#64748B" }}>Ingresos: {formatUsd(cat.totalProceedsNetUsd)}</p>
                      <p style={{ margin: 0, fontSize: "0.75rem", color: "#94A3B8" }}>Costo: {formatUsd(cat.totalCostBasisUsd)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {taxHealth.issues.length > 0 && (
            <div>
              <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "0.9375rem", fontWeight: 700, color: "#0F2A3D", margin: "0 0 0.75rem" }}>Senales detectadas</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {taxHealth.issues.map((issue, i) => (
                  <div key={i} style={{ background: "rgba(245,158,11,0.05)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: "10px", padding: "0.875rem 1rem", display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
                    <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#D97706", flexShrink: 0, marginTop: "5px" }} />
                    <div>
                      <p style={{ margin: 0, fontWeight: 600, fontSize: "0.875rem", color: "#92400E" }}>{issue.count} caso{issue.count !== 1 ? "s" : ""}</p>
                      <p style={{ margin: 0, fontSize: "0.8125rem", color: "#64748B" }}>{issue.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* EVENTOS */}
      {section === "eventos" && (
        <div>
          {events.length === 0 ? (
            <div style={{ background: "#F8FAFC", border: "1px dashed rgba(15,42,61,0.13)", borderRadius: "12px", padding: "3rem", textAlign: "center" }}>
              <p style={{ color: "#94A3B8", margin: "0 0 4px", fontWeight: 600 }}>Sin eventos tributarios para {year}</p>
              <p style={{ color: "#CBD5E1", margin: 0, fontSize: "0.875rem" }}>Registra ventas en Portafolio para generar eventos tributarios.</p>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
                <thead>
                  <tr>
                    {["Fecha","Simbolo","Cantidad","Ingreso neto USD","Costo base USD","PnL USD","PnL CLP","Categoria"].map((col) => (
                      <th key={col} style={{ padding: "0.625rem 0.75rem", textAlign: "left", fontSize: "0.6875rem", fontWeight: 600, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "1px solid #E2E8F0", whiteSpace: "nowrap" }}>
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {events.map((ev) => {
                    const ntt =
                      ev.effectiveTaxCategory === "CAPITAL_GAIN"    ? "CAPITAL"     :
                      ev.effectiveTaxCategory === "ORDINARY_INCOME"  ? "ORDINARY"   :
                      ev.effectiveTaxCategory === "NON_TAXABLE"      ? "NON_TAXABLE" :
                      "PENDING";
                    const catColor = CATEGORY_COLORS[ntt as NormalizedTaxType];
                    return (
                      <tr key={ev.id} style={{ borderBottom: "1px solid #F1F5F9" }}>
                        <td style={cellStyle}>{formatDate(ev.executedAt)}</td>
                        <td style={{ ...cellStyle, fontWeight: 600, color: "#0F2A3D", fontFamily: "'Space Grotesk', sans-serif" }}>{ev.symbol}</td>
                        <td style={cellStyle}>{formatNumber(ev.quantity, 8)}</td>
                        <td style={cellStyle}>{formatUsd(ev.proceedsNetUsd)}</td>
                        <td style={cellStyle}>{formatUsd(ev.costBasisUsd)}</td>
                        <td style={{ ...cellStyle, fontWeight: 700, color: pnlColor(ev.realizedPnlUsd) }}>{formatUsd(ev.realizedPnlUsd)}</td>
                        <td style={{ ...cellStyle, fontWeight: 600, color: pnlColor(ev.realizedPnlClp) }}>{formatClp(ev.realizedPnlClp)}</td>
                        <td style={cellStyle}>
                          <span style={{ display: "inline-block", padding: "2px 10px", borderRadius: "6px", fontSize: "0.75rem", fontWeight: 600, background: `${catColor}15`, color: catColor }}>
                            {ev.effectiveTaxCategory}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* REPORTES */}
      {section === "reportes" && (
        <ReportesSection
          year={year}
          hasEvents={events.length > 0}
          hasPending={taxHealth.status === "RISK"}
          blocked={taxHealth.blocked}
        />
      )}
    </div>
  );
}