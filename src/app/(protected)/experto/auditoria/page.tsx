"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Tab = "estado" | "hallazgos" | "custodia" | "informe";

/* ──────────────── Dashboard types ──────────────── */
type DashboardData = {
  year: number;
  integrity: {
    healthScore: number;
    status: string;
    color: string;
    issues: {
      sellWithoutEvent: number;
      orphanEvents: number;
      unknownTypeCount: number;
      missingPriceCount: number;
      missingQuantityCount: number;
      futureDateCount: number;
      pendingEvents: number;
    };
    totalIssues: number;
  };
  period: {
    year: number;
    status: "OPEN" | "CLOSED" | "REOPENED";
    closedAt: string | null;
    reopenedAt: string | null;
    closedReason: string | null;
    snapshotCount: number;
    logCount: number;
  };
  declarations: {
    counts: { total: number; draft: number; reviewed: number; confirmed: number; voided: number; exported: number };
    recent: { id: string; taxYear: number; type: string; status: string; hash: string; generatedAt: string }[];
  };
  movements: { total: number; inYear: number };
  events: { total: number; pendingEvents: number };
  validations: { total: number; valid: number; revoked: number; recent: { id: string; hash: string; type: string; year: number; issuedAt: string }[] };
  snapshots: { id: string; contentHash: string; createdAt: string }[];
  recentLogs: {
    period: { id: string; action: string; reason: string | null; actorEmail: string | null; createdAt: string }[];
    declarations: { id: string; action: string; declarationId: string; actorEmail: string | null; statusFrom: string | null; statusTo: string | null; createdAt: string }[];
  };
};

/* ──────────────── Integrity/Health types ──────────────── */
type IntegrityData = {
  status: string;
  issues: { type: string; count: number; message: string }[];
  metrics?: Record<string, unknown>;
};

type HealthData = {
  score: number;
  label: string;
  color: string;
  icon: string;
  totalMovements: number;
  totalEvents: number;
  sellWithoutEvent: number;
  orphanEvents: number;
  unknownTypeCount: number;
  missingPriceCount: number;
  missingQuantityCount: number;
  futureDateCount: number;
  problems: { severity: "high" | "medium" | "low"; label: string; detail: string }[];
  recommendations: string[];
};

/* ──────────────── Custodia types ──────────────── */
type Movement = { id: string; type: string; symbol: string; quantity: number; priceUsd: number | null; feeUsd: number | null; executedAt: string };
type TaxEvent = { id: string; movementId: string; symbol: string; executedAt: string | null; quantity: number; effectiveTaxCategory: string; averageCostUsdAtSale: number; proceedsNetUsd: number; costBasisUsd: number; realizedPnlUsd: number; feeUsd: number };
type ConsumedLot = { movementId: string; executedAt: string; quantityConsumed: number; unitCostUsd: number; costBasisUsd: number };
type FifoSale = { movementId: string; symbol: string; executedAt: string; quantity: number; priceUsd: number; feeUsd: number; costBasisUsd: number; realizedPnlUsd: number; averageCostUsdAtSale: number; consumedLots: ConsumedLot[]; missingQuantity: number };
type Declaration = { id: string; taxYear: number; declarationType: string; status: string; contentHash: string; generatedAt: string };
type Validation = { id: string; hash: string; type: string; typeLabel: string; isValid: boolean; issuedAt: string; year: number; symbol: string | null };

/* ──────────────── Helpers ──────────────── */
const formatterUsd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 4 });
function usd(value: number) { return formatterUsd.format(value || 0); }

function periodLabel(status: string) {
  switch (status) {
    case "OPEN": return { text: "Abierto", color: "#16A34A" };
    case "CLOSED": return { text: "Cerrado", color: "#64748B" };
    case "REOPENED": return { text: "Reabierto", color: "#D97706" };
    default: return { text: status, color: "#64748B" };
  }
}

function statusConfig(status: string) {
  switch (status) {
    case "CRITICAL": return { label: "Crítico", color: "#991B1B", bg: "#FEF2F2", border: "#FECACA" };
    case "RISK": return { label: "Riesgo", color: "#92400E", bg: "#FFFBEB", border: "#FCD34D" };
    case "LEGACY_UNVERIFIABLE": return { label: "Legacy no verificable", color: "#475569", bg: "#F1F5F9", border: "#CBD5E1" };
    default: return { label: "OK", color: "#166534", bg: "#F0FDF4", border: "#86EFAC" };
  }
}

function severityStyle(severity: string) {
  const s = severity.toLowerCase();
  if (s === "high" || s === "crítico" || s === "critical") return { bg: "#FEF2F2", border: "#FCA5A5", color: "#991B1B" };
  if (s === "medium" || s === "medio" || s === "riesgo") return { bg: "#FEF9C3", border: "#FDE047", color: "#854D0E" };
  return { bg: "#F0FDF4", border: "#86EFAC", color: "#166534" };
}

function declStatusLabel(status: string) {
  switch (status) {
    case "DRAFT": return { text: "Borrador", bg: "#F1F5F9", color: "#475569" };
    case "REVIEWED": return { text: "Revisada", bg: "#E0F2FE", color: "#075985" };
    case "CONFIRMED": return { text: "Confirmada", bg: "#F0FDF4", color: "#166534" };
    case "VOIDED": return { text: "Anulada", bg: "#FEF2F2", color: "#991B1B" };
    case "EXPORTED": return { text: "Exportada", bg: "#FFFBEB", color: "#92400E" };
    default: return { text: status, bg: "#F1F5F9", color: "#475569" };
  }
}

function categoryLabel(category: string) {
  switch (category) {
    case "CAPITAL_GAIN": return { text: "Mayor valor", color: "#166534", bg: "#F0FDF4" };
    case "ORDINARY_INCOME": return { text: "Renta ordinaria", color: "#92400E", bg: "#FFFBEB" };
    case "NON_TAXABLE": return { text: "No afecto", color: "#075985", bg: "#E0F2FE" };
    case "UNCLASSIFIED": return { text: "Pendiente", color: "#991B1B", bg: "#FEF2F2" };
    default: return { text: category, color: "#475569", bg: "#F1F5F9" };
  }
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("es-CL", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleDateString("es-CL", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function issueTypeToAction(type: string): string {
  const map: Record<string, string> = {
    SELL_WITHOUT_EVENT: "Revisar en Operaciones → Movimientos",
    ORPHAN_EVENT: "Reconstruir eventos en Operaciones → Revisión",
    NEGATIVE_INVENTORY: "Verificar compras previas en Operaciones → Movimientos",
    UNCLASSIFIED_EVENT: "Clasificar evento en Operaciones → Revisión",
    BROKEN_DECLARATION_CHAIN: "Revisar cadena en Declaraciones → Auditoría",
    ORPHANED_DECLARATION: "Verificar declaraciones huérfanas",
    LEGACY_UNVERIFIABLE: "Evidencia previa al protocolo de cadena",
  };
  return map[type] ?? "Revisar en detalle técnico";
}

/* ──────────────── Page ──────────────── */
export default function ExpertoAuditoriaPage() {
  const [tab, setTab] = useState<Tab>("estado");
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);

  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [integrity, setIntegrity] = useState<IntegrityData | null>(null);
  const [health, setHealth] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /* Custodia state */
  const [movements, setMovements] = useState<Movement[]>([]);
  const [events, setEvents] = useState<TaxEvent[]>([]);
  const [fifoSales, setFifoSales] = useState<FifoSale[]>([]);
  const [declarations, setDeclarations] = useState<Declaration[]>([]);
  const [validations, setValidations] = useState<Validation[]>([]);
  const [custodiaLoading, setCustodiaLoading] = useState(true);
  const [custodiaError, setCustodiaError] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  /* Load estado + hallazgos */
  useEffect(() => {
    async function load() {
      setLoading(true); setError("");
      try {
        const [dRes, iRes, hRes] = await Promise.all([
          fetch("/api/audit/dashboard", { cache: "no-store" }),
          fetch("/api/tax/audit/integrity", { cache: "no-store" }),
          fetch("/api/tax/health", { cache: "no-store" }),
        ]);
        const dJson = await dRes.json();
        const iJson = await iRes.json();
        const hJson = await hRes.json();
        if (dRes.ok && dJson.ok) setDashboard(dJson.data);
        if (iRes.ok && iJson.ok) setIntegrity(iJson.data);
        if (hRes.ok && hJson.ok) setHealth(hJson.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error cargando auditoría.");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  /* Load custodia */
  useEffect(() => {
    async function loadCustodia() {
      setCustodiaLoading(true); setCustodiaError("");
      try {
        const [mRes, eRes, fRes, dRes, vRes] = await Promise.all([
          fetch(`/api/movements?type=SELL&limit=500&year=${year}`, { cache: "no-store" }),
          fetch(`/api/tax/events?year=${year}`, { cache: "no-store" }),
          fetch(`/api/audit/fifo?year=${year}`, { cache: "no-store" }),
          fetch(`/api/tax/declarations?year=${year}`, { cache: "no-store" }),
          fetch(`/api/report-validations?year=${year}`, { cache: "no-store" }),
        ]);
        const mJson = await mRes.json();
        const eJson = await eRes.json();
        const fJson = await fRes.json();
        const dJson = await dRes.json();
        const vJson = await vRes.json();
        if (!mRes.ok || !mJson.ok) throw new Error(mJson.message || "Error movimientos.");
        if (!eRes.ok || !eJson.ok) throw new Error(eJson.message || "Error eventos.");
        if (!fRes.ok || !fJson.ok) throw new Error(fJson.message || "Error FIFO.");
        setMovements(mJson.data.movements || []);
        setEvents(eJson.data.events || []);
        setFifoSales(fJson.data.sales || []);
        setDeclarations(dRes.ok && dJson.ok ? dJson.data.declarations : []);
        setValidations(vRes.ok && vJson.ok ? vJson.data.validations : []);
      } catch (err) {
        setCustodiaError(err instanceof Error ? err.message : "Error inesperado.");
      } finally {
        setCustodiaLoading(false);
      }
    }
    void loadCustodia();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year]);

  const eventByMovementId = useMemo(() => {
    const map = new Map<string, TaxEvent>();
    for (const e of events) map.set(e.movementId, e);
    return map;
  }, [events]);

  const fifoByMovementId = useMemo(() => {
    const map = new Map<string, FifoSale>();
    for (const s of fifoSales) map.set(s.movementId, s);
    return map;
  }, [fifoSales]);

  const chainItems = useMemo(() => movements.map((m) => ({ movement: m, event: eventByMovementId.get(m.id) || null, fifo: fifoByMovementId.get(m.id) || null })), [movements, eventByMovementId, fifoByMovementId]);

  const overallStatus = useMemo(() => {
    if (!dashboard && !integrity && !health) return null;
    const score = dashboard?.integrity.healthScore ?? health?.score ?? 100;
    const intStatus = integrity?.status ?? "OK";
    if (intStatus === "CRITICAL" || score < 40) return { label: "Crítico", color: "#991B1B", bg: "#FEF2F2", border: "#FECACA", icon: "✕" };
    if (intStatus === "RISK" || score < 70) return { label: "Requiere revisión", color: "#92400E", bg: "#FFFBEB", border: "#FCD34D", icon: "⚠" };
    return { label: "Sin observaciones", color: "#166534", bg: "#F0FDF4", border: "#86EFAC", icon: "✓" };
  }, [dashboard, integrity, health]);

  const tabBtn = (key: Tab, label: string) => {
    const active = tab === key;
    return (
      <button
        key={key}
        onClick={() => setTab(key)}
        style={{ padding: "10px 16px", borderRadius: 8, border: "none", background: active ? "rgba(22,163,74,0.18)" : "transparent", color: active ? "#4ADE80" : "#94A3B8", fontSize: 13, fontWeight: active ? 700 : 500, cursor: "pointer" }}
      >
        {label}
      </button>
    );
  };

  return (
    <div style={{ maxWidth: 1180, width: "100%" }}>
      <section style={{ alignItems: "flex-start", display: "flex", flexWrap: "wrap", gap: 16, justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <p style={{ color: "#0F766E", fontSize: 12, fontWeight: 850, letterSpacing: "0.06em", margin: "0 0 7px", textTransform: "uppercase" }}>Modo Experto</p>
          <h1 style={{ color: "#0F2A3D", fontSize: "1.85rem", fontWeight: 850, lineHeight: 1.12, margin: "0 0 8px" }}>Auditoría</h1>
          <p style={{ color: "#64748B", fontSize: "0.95rem", lineHeight: 1.55, margin: 0 }}>Confiabilidad del cálculo, hallazgos, cadena de custodia e informes.</p>
        </div>
        <Link href="/experto" style={{ border: "1px solid #CBD5E1", borderRadius: 8, color: "#0F2A3D", display: "inline-flex", fontSize: 13, fontWeight: 850, padding: "10px 14px", textDecoration: "none" }}>Volver a Experto</Link>
      </section>

      {/* Acciones principales */}
      <section style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", marginBottom: 20 }}>
        {[
          { label: "Revisar operaciones", href: "/experto/operaciones", desc: "Período, eventos, ledger y movimientos" },
          { label: "Ver declaraciones", href: "/experto/declaraciones", desc: "Cadena de custodia DDJJ" },
          { label: "Abrir verificaciones", href: "/experto/verificaciones", desc: "Hashes y códigos públicos" },
          { label: "Generar informe", href: "/experto/reportes", desc: "PDF y exportaciones" },
        ].map((a) => (
          <Link key={a.href} href={a.href} style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 8, padding: 16, textDecoration: "none", display: "block" }}>
            <p style={{ color: "#0F2A3D", fontSize: 14, fontWeight: 850, margin: "0 0 4px" }}>{a.label} →</p>
            <p style={{ color: "#64748B", fontSize: 12, lineHeight: 1.45, margin: 0 }}>{a.desc}</p>
          </Link>
        ))}
      </section>

      <div style={{ display: "flex", gap: 4, marginBottom: 20, background: "#FFFFFF", borderRadius: 10, padding: 4, border: "1px solid #E2E8F0" }}>
        {tabBtn("estado", "Estado")}
        {tabBtn("hallazgos", "Hallazgos")}
        {tabBtn("custodia", "Custodia")}
        {tabBtn("informe", "Informe")}
      </div>

      {loading && <p style={{ color: "#64748B", fontSize: 14, fontWeight: 750 }}>Cargando auditoría…</p>}
      {error && <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8, color: "#991B1B", fontWeight: 750, padding: 16 }}>{error}</div>}

      {tab === "estado" && !loading && (
        <>
          {overallStatus && (
            <section style={{ background: overallStatus.bg, border: `2px solid ${overallStatus.border}`, borderRadius: 12, marginBottom: 20, padding: 22 }}>
              <div style={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 8 }}>
                <span style={{ fontSize: 20 }}>{overallStatus.icon}</span>
                <span style={{ background: "#FFFFFF", borderRadius: 999, color: overallStatus.color, display: "inline-flex", fontSize: 13, fontWeight: 850, padding: "6px 12px" }}>{overallStatus.label}</span>
              </div>
              <p style={{ color: "#475569", fontSize: 14, lineHeight: 1.55, margin: 0 }}>
                {overallStatus.label === "Sin observaciones"
                  ? "Los datos tributarios están en buen estado. La integridad es suficiente para auditoría."
                  : "Se detectaron problemas que afectan la integridad tributaria. Revisa los hallazgos."}
              </p>
            </section>
          )}

          {dashboard && (
            <section style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", marginBottom: 20 }}>
              {[
                { label: "Health score", value: `${dashboard.integrity.healthScore}/100`, color: dashboard.integrity.color },
                { label: "Integridad", value: statusConfig(integrity?.status ?? "OK").label, color: statusConfig(integrity?.status ?? "OK").color },
                { label: "Eventos pendientes", value: dashboard.events.pendingEvents, color: dashboard.events.pendingEvents > 0 ? "#92400E" : "#166534" },
                { label: "Declaraciones", value: dashboard.declarations.counts.total, color: "#0F2A3D" },
                { label: "Verificaciones", value: dashboard.validations.total, color: "#0F2A3D" },
                { label: "Snapshots", value: dashboard.period.snapshotCount, color: "#0F2A3D" },
              ].map((item) => (
                <article key={item.label} style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 8, padding: 16, textAlign: "center" }}>
                  <p style={{ color: "#64748B", fontSize: 11, fontWeight: 850, letterSpacing: "0.04em", margin: "0 0 8px", textTransform: "uppercase" }}>{item.label}</p>
                  <p style={{ color: item.color, fontSize: "1.45rem", fontWeight: 850, margin: 0 }}>{item.value}</p>
                </article>
              ))}
            </section>
          )}

          {dashboard && (
            <section style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", marginBottom: 20 }}>
              {[
                { label: "Ventas sin evento", value: dashboard.integrity.issues.sellWithoutEvent, color: dashboard.integrity.issues.sellWithoutEvent > 0 ? "#991B1B" : "#166534" },
                { label: "Eventos huérfanos", value: dashboard.integrity.issues.orphanEvents, color: dashboard.integrity.issues.orphanEvents > 0 ? "#991B1B" : "#166534" },
                { label: "Sin precio", value: dashboard.integrity.issues.missingPriceCount, color: dashboard.integrity.issues.missingPriceCount > 0 ? "#92400E" : "#166534" },
                { label: "Sin cantidad", value: dashboard.integrity.issues.missingQuantityCount, color: dashboard.integrity.issues.missingQuantityCount > 0 ? "#92400E" : "#166534" },
                { label: "Tipos desconocidos", value: dashboard.integrity.issues.unknownTypeCount, color: dashboard.integrity.issues.unknownTypeCount > 0 ? "#92400E" : "#166534" },
                { label: "Fechas futuras", value: dashboard.integrity.issues.futureDateCount, color: dashboard.integrity.issues.futureDateCount > 0 ? "#92400E" : "#166534" },
              ].map((item) => (
                <article key={item.label} style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 8, padding: 14 }}>
                  <p style={{ color: "#64748B", fontSize: 11, fontWeight: 850, letterSpacing: "0.04em", margin: "0 0 6px", textTransform: "uppercase" }}>{item.label}</p>
                  <p style={{ color: item.color, fontSize: "1.35rem", fontWeight: 850, margin: 0 }}>{item.value}</p>
                </article>
              ))}
            </section>
          )}

          {dashboard && (
            <section style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", marginBottom: 20 }}>
              <article style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 8, padding: 16 }}>
                <p style={{ color: "#64748B", fontSize: 11, fontWeight: 850, letterSpacing: "0.04em", margin: "0 0 8px", textTransform: "uppercase" }}>Período {dashboard.period.year}</p>
                <p style={{ color: periodLabel(dashboard.period.status).color, fontSize: "1.45rem", fontWeight: 850, margin: 0 }}>{periodLabel(dashboard.period.status).text}</p>
              </article>
              <article style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 8, padding: 16 }}>
                <p style={{ color: "#64748B", fontSize: 11, fontWeight: 850, letterSpacing: "0.04em", margin: "0 0 8px", textTransform: "uppercase" }}>Movimientos</p>
                <p style={{ color: "#0F2A3D", fontSize: "1.45rem", fontWeight: 850, margin: 0 }}>{dashboard.movements.total}</p>
              </article>
              <article style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 8, padding: 16 }}>
                <p style={{ color: "#64748B", fontSize: 11, fontWeight: 850, letterSpacing: "0.04em", margin: "0 0 8px", textTransform: "uppercase" }}>Eventos</p>
                <p style={{ color: "#0F2A3D", fontSize: "1.45rem", fontWeight: 850, margin: 0 }}>{dashboard.events.total}</p>
              </article>
              <article style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 8, padding: 16 }}>
                <p style={{ color: "#64748B", fontSize: 11, fontWeight: 850, letterSpacing: "0.04em", margin: "0 0 8px", textTransform: "uppercase" }}>Validaciones válidas</p>
                <p style={{ color: "#166534", fontSize: "1.45rem", fontWeight: 850, margin: 0 }}>{dashboard.validations.valid}</p>
              </article>
            </section>
          )}
        </>
      )}

      {tab === "hallazgos" && !loading && (
        <>
          {integrity && integrity.issues.length > 0 ? (
            <section style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 8, marginBottom: 20, overflow: "hidden" }}>
              <div style={{ padding: "16px 18px", borderBottom: "1px solid #E2E8F0" }}>
                <h3 style={{ color: "#0F2A3D", fontSize: "1rem", fontWeight: 850, margin: 0 }}>Hallazgos de integridad</h3>
              </div>
              <div style={{ display: "grid", gap: 0 }}>
                {integrity.issues.map((issue, i) => (
                  <div key={i} style={{ alignItems: "center", borderTop: i > 0 ? "1px solid #E2E8F0" : "none", display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "space-between", padding: "14px 18px" }}>
                    <div>
                      <p style={{ color: "#0F2A3D", fontSize: 14, fontWeight: 750, margin: "0 0 2px" }}>{issue.message}</p>
                      <p style={{ color: "#64748B", fontSize: 12, margin: 0 }}>Tipo: {issue.type} · Acción: {issueTypeToAction(issue.type)}</p>
                    </div>
                    <span style={{ background: "#FEF2F2", borderRadius: 999, color: "#991B1B", fontSize: 13, fontWeight: 850, padding: "4px 12px" }}>{issue.count} afectado{issue.count !== 1 ? "s" : ""}</span>
                  </div>
                ))}
              </div>
            </section>
          ) : (
            <section style={{ background: "#F0FDF4", border: "1px solid #86EFAC", borderRadius: 8, marginBottom: 20, padding: 18 }}>
              <p style={{ color: "#166534", fontWeight: 750, margin: 0 }}>✓ Sin hallazgos de integridad críticos</p>
            </section>
          )}

          {health && health.problems.length > 0 && (
            <section style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 8, marginBottom: 20, overflow: "hidden" }}>
              <div style={{ padding: "16px 18px", borderBottom: "1px solid #E2E8F0" }}>
                <h3 style={{ color: "#0F2A3D", fontSize: "1rem", fontWeight: 850, margin: 0 }}>Problemas de salud ({health.problems.length})</h3>
              </div>
              <div style={{ display: "grid", gap: 0 }}>
                {health.problems.map((p, i) => {
                  const token = severityStyle(p.severity);
                  return (
                    <div key={i} style={{ alignItems: "flex-start", borderTop: i > 0 ? "1px solid #E2E8F0" : "none", display: "flex", flexWrap: "wrap", gap: 10, padding: "14px 18px" }}>
                      <span style={{ background: token.bg, borderRadius: 999, color: token.color, flexShrink: 0, fontSize: 11, fontWeight: 800, marginTop: 2, padding: "2px 8px", textTransform: "uppercase" }}>{p.severity}</span>
                      <div>
                        <p style={{ color: "#0F2A3D", fontSize: 14, fontWeight: 750, margin: "0 0 2px" }}>{p.label}</p>
                        <p style={{ color: "#64748B", fontSize: 12, margin: 0 }}>{p.detail}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {health && health.recommendations.length > 0 && (
            <section style={{ background: "#F8FAFC", border: "1px solid #CBD5E1", borderRadius: 8, padding: 20 }}>
              <h3 style={{ color: "#0F2A3D", fontSize: "1rem", fontWeight: 850, margin: "0 0 12px" }}>Recomendaciones</h3>
              <ul style={{ color: "#475569", display: "grid", gap: 8, listStyle: "none", margin: 0, padding: 0 }}>
                {health.recommendations.map((r, i) => (
                  <li key={i} style={{ alignItems: "flex-start", display: "flex", gap: 8 }}>
                    <span style={{ color: "#0F766E", flexShrink: 0, fontSize: 14, fontWeight: 850 }}>→</span>
                    <span style={{ fontSize: 14, lineHeight: 1.5 }}>{r}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}

      {tab === "custodia" && (
        <>
          <section style={{ alignItems: "end", background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 8, display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", marginBottom: 20, padding: 16 }}>
            <label style={{ color: "#475569", display: "grid", fontSize: 13, fontWeight: 750, gap: 6 }}>
              Año
              <select value={year} onChange={(e) => setYear(Number(e.target.value))} style={{ border: "1px solid #CBD5E1", borderRadius: 8, color: "#0F2A3D", minHeight: 40, padding: "0 10px" }}>
                <option value={currentYear}>{currentYear}</option>
                <option value={currentYear - 1}>{currentYear - 1}</option>
                <option value={currentYear - 2}>{currentYear - 2}</option>
              </select>
            </label>
          </section>

          {custodiaLoading && <p style={{ color: "#64748B", fontSize: 14, fontWeight: 750 }}>Cargando cadena de custodia…</p>}
          {custodiaError && <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8, color: "#991B1B", fontWeight: 750, padding: 16 }}>{custodiaError}</div>}

          {!custodiaLoading && (
            <>
              <section style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", marginBottom: 20 }}>
                <article style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 8, padding: 16, textAlign: "center" }}>
                  <p style={{ color: "#64748B", fontSize: 11, fontWeight: 850, letterSpacing: "0.04em", margin: "0 0 8px", textTransform: "uppercase" }}>Ventas</p>
                  <p style={{ color: "#0F2A3D", fontSize: "1.45rem", fontWeight: 850, margin: 0 }}>{movements.length}</p>
                </article>
                <article style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 8, padding: 16, textAlign: "center" }}>
                  <p style={{ color: "#64748B", fontSize: 11, fontWeight: 850, letterSpacing: "0.04em", margin: "0 0 8px", textTransform: "uppercase" }}>Eventos</p>
                  <p style={{ color: "#0F2A3D", fontSize: "1.45rem", fontWeight: 850, margin: 0 }}>{events.length}</p>
                </article>
                <article style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 8, padding: 16, textAlign: "center" }}>
                  <p style={{ color: "#64748B", fontSize: 11, fontWeight: 850, letterSpacing: "0.04em", margin: "0 0 8px", textTransform: "uppercase" }}>DDJJ</p>
                  <p style={{ color: "#0F2A3D", fontSize: "1.45rem", fontWeight: 850, margin: 0 }}>{declarations.length}</p>
                </article>
                <article style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 8, padding: 16, textAlign: "center" }}>
                  <p style={{ color: "#64748B", fontSize: 11, fontWeight: 850, letterSpacing: "0.04em", margin: "0 0 8px", textTransform: "uppercase" }}>Validaciones</p>
                  <p style={{ color: "#0F2A3D", fontSize: "1.45rem", fontWeight: 850, margin: 0 }}>{validations.length}</p>
                </article>
              </section>

              {chainItems.length === 0 && (
                <section style={{ background: "#FFFFFF", border: "1px dashed #CBD5E1", borderRadius: 8, padding: 28, textAlign: "center" }}>
                  <h2 style={{ color: "#0F2A3D", fontSize: "1.15rem", fontWeight: 850, margin: "0 0 8px" }}>Sin ventas en {year}</h2>
                  <p style={{ color: "#64748B", fontSize: 14, lineHeight: 1.55, margin: 0 }}>No hay movimientos de venta para mostrar la cadena de custodia.</p>
                </section>
              )}

              <section style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {chainItems.map((item) => {
                  const isExpanded = expandedId === item.movement.id;
                  const m = item.movement;
                  const e = item.event;
                  const f = item.fifo;
                  return (
                    <div key={m.id} style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 12, overflow: "hidden" }}>
                      <button onClick={() => setExpandedId(isExpanded ? null : m.id)} style={{ alignItems: "center", background: "transparent", border: "none", cursor: "pointer", display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "space-between", padding: "16px 20px", width: "100%", textAlign: "left" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                          <span style={{ background: "#FEF2F2", borderRadius: 999, color: "#991B1B", fontSize: 12, fontWeight: 800, padding: "4px 12px" }}>Venta</span>
                          <span style={{ color: "#0F2A3D", fontSize: 15, fontWeight: 850 }}>{m.symbol}</span>
                          <span style={{ color: "#64748B", fontSize: 13 }}>{m.executedAt ? formatDate(m.executedAt) : "—"}</span>
                          <span style={{ color: "#64748B", fontSize: 13 }}>{m.quantity} @ {usd(m.priceUsd || 0)}</span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                          {e && <span style={{ color: e.realizedPnlUsd >= 0 ? "#15803D" : "#B45309", fontSize: 14, fontWeight: 750 }}>{usd(e.realizedPnlUsd)}</span>}
                          <span style={{ color: "#94A3B8", fontSize: 18 }}>{isExpanded ? "▾" : "▸"}</span>
                        </div>
                      </button>

                      {isExpanded && (
                        <div style={{ borderTop: "1px solid #E2E8F0", padding: "20px" }}>
                          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                            {/* Movimiento */}
                            <div style={{ display: "flex", gap: 12 }}>
                              <div style={{ alignItems: "center", display: "flex", flexDirection: "column", flexShrink: 0, width: 28 }}>
                                <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#0F2A3D", color: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800 }}>1</div>
                                <div style={{ width: 2, flex: 1, background: "#E2E8F0", marginTop: 4 }} />
                              </div>
                              <div style={{ flex: 1, background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 10, padding: 14 }}>
                                <p style={{ color: "#0F2A3D", fontSize: 13, fontWeight: 850, margin: "0 0 6px" }}>Movimiento origen</p>
                                <div style={{ display: "grid", gap: 4, gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))" }}>
                                  <div><span style={{ color: "#94A3B8", fontSize: 11 }}>ID </span><span style={{ color: "#334155", fontSize: 12, fontFamily: "monospace" }}>{m.id.slice(0, 10)}…</span></div>
                                  <div><span style={{ color: "#94A3B8", fontSize: 11 }}>Fecha </span><span style={{ color: "#334155", fontSize: 12 }}>{m.executedAt ? formatDate(m.executedAt) : "—"}</span></div>
                                  <div><span style={{ color: "#94A3B8", fontSize: 11 }}>Cantidad </span><span style={{ color: "#334155", fontSize: 12 }}>{m.quantity}</span></div>
                                  <div><span style={{ color: "#94A3B8", fontSize: 11 }}>Precio </span><span style={{ color: "#334155", fontSize: 12 }}>{usd(m.priceUsd || 0)}</span></div>
                                  <div><span style={{ color: "#94A3B8", fontSize: 11 }}>Fee </span><span style={{ color: "#334155", fontSize: 12 }}>{usd(m.feeUsd || 0)}</span></div>
                                </div>
                              </div>
                            </div>

                            {/* FIFO */}
                            <div style={{ display: "flex", gap: 12 }}>
                              <div style={{ alignItems: "center", display: "flex", flexDirection: "column", flexShrink: 0, width: 28 }}>
                                <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#0F766E", color: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800 }}>2</div>
                                <div style={{ width: 2, flex: 1, background: "#E2E8F0", marginTop: 4 }} />
                              </div>
                              <div style={{ flex: 1, background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 10, padding: 14 }}>
                                <p style={{ color: "#0F2A3D", fontSize: 13, fontWeight: 850, margin: "0 0 6px" }}>FIFO — Lotes consumidos</p>
                                {f && f.consumedLots.length > 0 ? (
                                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                    {f.consumedLots.map((lot, i) => (
                                      <div key={i} style={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "space-between" }}>
                                        <span style={{ color: "#334155", fontSize: 12 }}>Lote {i + 1}: {lot.quantityConsumed} unidades @ {usd(lot.unitCostUsd)}</span>
                                        <span style={{ color: "#64748B", fontSize: 12 }}>{usd(lot.costBasisUsd)}</span>
                                      </div>
                                    ))}
                                    <div style={{ borderTop: "1px solid #E2E8F0", marginTop: 4, paddingTop: 6 }}>
                                      <span style={{ color: "#0F2A3D", fontSize: 12, fontWeight: 750 }}>Costo FIFO total: {usd(f.costBasisUsd)}</span>
                                      {f.missingQuantity > 0 && <span style={{ color: "#DC2626", fontSize: 12, marginLeft: 12 }}>⚠ Inventario insuficiente (-{f.missingQuantity})</span>}
                                    </div>
                                  </div>
                                ) : <p style={{ color: "#94A3B8", fontSize: 12, margin: 0 }}>Sin datos FIFO</p>}
                              </div>
                            </div>

                            {/* Tax Event */}
                            <div style={{ display: "flex", gap: 12 }}>
                              <div style={{ alignItems: "center", display: "flex", flexDirection: "column", flexShrink: 0, width: 28 }}>
                                <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#D97706", color: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800 }}>3</div>
                                <div style={{ width: 2, flex: 1, background: "#E2E8F0", marginTop: 4 }} />
                              </div>
                              <div style={{ flex: 1, background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 10, padding: 14 }}>
                                <p style={{ color: "#0F2A3D", fontSize: 13, fontWeight: 850, margin: "0 0 6px" }}>Tax Event</p>
                                {e ? (
                                  <div style={{ display: "grid", gap: 4, gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))" }}>
                                    <div><span style={{ color: "#94A3B8", fontSize: 11 }}>ID </span><span style={{ color: "#334155", fontSize: 12, fontFamily: "monospace" }}>{e.id.slice(0, 10)}…</span></div>
                                    <div><span style={{ color: "#94A3B8", fontSize: 11 }}>Clasificación </span><span style={{ background: categoryLabel(e.effectiveTaxCategory).bg, borderRadius: 999, color: categoryLabel(e.effectiveTaxCategory).color, fontSize: 11, fontWeight: 800, padding: "1px 8px" }}>{categoryLabel(e.effectiveTaxCategory).text}</span></div>
                                    <div><span style={{ color: "#94A3B8", fontSize: 11 }}>Ingreso neto </span><span style={{ color: "#334155", fontSize: 12 }}>{usd(e.proceedsNetUsd)}</span></div>
                                    <div><span style={{ color: "#94A3B8", fontSize: 11 }}>Costo FIFO </span><span style={{ color: "#334155", fontSize: 12 }}>{usd(e.costBasisUsd)}</span></div>
                                    <div><span style={{ color: "#94A3B8", fontSize: 11 }}>PnL </span><span style={{ color: e.realizedPnlUsd >= 0 ? "#15803D" : "#B45309", fontSize: 12, fontWeight: 750 }}>{usd(e.realizedPnlUsd)}</span></div>
                                  </div>
                                ) : <p style={{ color: "#DC2626", fontSize: 12, margin: 0 }}>⚠ No hay tax event asociado</p>}
                              </div>
                            </div>

                            {/* DDJJ */}
                            <div style={{ display: "flex", gap: 12 }}>
                              <div style={{ alignItems: "center", display: "flex", flexDirection: "column", flexShrink: 0, width: 28 }}>
                                <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#64748B", color: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800 }}>4</div>
                                <div style={{ width: 2, flex: 1, background: "#E2E8F0", marginTop: 4 }} />
                              </div>
                              <div style={{ flex: 1, background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 10, padding: 14 }}>
                                <p style={{ color: "#0F2A3D", fontSize: 13, fontWeight: 850, margin: "0 0 6px" }}>Declaraciones relacionadas</p>
                                {declarations.length > 0 ? (
                                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                    {declarations.map((d) => (
                                      <div key={d.id} style={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 8 }}>
                                        <span style={{ background: declStatusLabel(d.status).bg, borderRadius: 999, color: declStatusLabel(d.status).color, fontSize: 11, fontWeight: 800, padding: "2px 8px" }}>{declStatusLabel(d.status).text}</span>
                                        <span style={{ color: "#334155", fontSize: 12 }}>{d.declarationType}</span>
                                        <span style={{ color: "#94A3B8", fontSize: 11, fontFamily: "monospace" }}>{d.contentHash.slice(0, 12)}…</span>
                                      </div>
                                    ))}
                                  </div>
                                ) : <p style={{ color: "#94A3B8", fontSize: 12, margin: 0 }}>Sin declaraciones para {year}</p>}
                              </div>
                            </div>

                            {/* Validaciones */}
                            <div style={{ display: "flex", gap: 12 }}>
                              <div style={{ alignItems: "center", display: "flex", flexDirection: "column", flexShrink: 0, width: 28 }}>
                                <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#16A34A", color: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800 }}>5</div>
                              </div>
                              <div style={{ flex: 1, background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 10, padding: 14 }}>
                                <p style={{ color: "#0F2A3D", fontSize: 13, fontWeight: 850, margin: "0 0 6px" }}>Verificación pública</p>
                                {validations.length > 0 ? (
                                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                    {validations.slice(0, 3).map((v) => (
                                      <div key={v.id} style={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 8 }}>
                                        <span style={{ background: v.isValid ? "rgba(22,163,74,0.08)" : "rgba(220,38,38,0.08)", borderRadius: 999, color: v.isValid ? "#16A34A" : "#DC2626", fontSize: 11, fontWeight: 800, padding: "2px 8px" }}>{v.isValid ? "Válido" : "Revocado"}</span>
                                        <span style={{ color: "#334155", fontSize: 12 }}>{v.typeLabel}</span>
                                        <span style={{ color: "#94A3B8", fontSize: 11, fontFamily: "monospace" }}>{v.hash.slice(0, 12)}…</span>
                                      </div>
                                    ))}
                                    {validations.length > 3 && <span style={{ color: "#94A3B8", fontSize: 11 }}>+{validations.length - 3} más</span>}
                                  </div>
                                ) : <p style={{ color: "#94A3B8", fontSize: 12, margin: 0 }}>Sin validaciones para {year}</p>}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </section>
            </>
          )}
        </>
      )}

      {tab === "informe" && !loading && dashboard && (
        <>
          <section style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", marginBottom: 24 }}>
            <article style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 8, padding: 18 }}>
              <p style={{ color: "#64748B", fontSize: 11, fontWeight: 850, letterSpacing: "0.04em", margin: "0 0 8px", textTransform: "uppercase" }}>Período {dashboard.year}</p>
              <p style={{ color: periodLabel(dashboard.period.status).color, fontSize: "1.45rem", fontWeight: 850, margin: 0 }}>{periodLabel(dashboard.period.status).text}</p>
            </article>
            <article style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 8, padding: 18 }}>
              <p style={{ color: "#64748B", fontSize: 11, fontWeight: 850, letterSpacing: "0.04em", margin: "0 0 8px", textTransform: "uppercase" }}>Declaraciones</p>
              <p style={{ color: "#0F2A3D", fontSize: "1.45rem", fontWeight: 850, margin: 0 }}>{dashboard.declarations.counts.total}</p>
            </article>
            <article style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 8, padding: 18 }}>
              <p style={{ color: "#64748B", fontSize: 11, fontWeight: 850, letterSpacing: "0.04em", margin: "0 0 8px", textTransform: "uppercase" }}>Integridad</p>
              <p style={{ color: integrity?.status === "OK" ? "#16A34A" : "#991B1B", fontSize: "1.45rem", fontWeight: 850, margin: 0 }}>{integrity?.status ?? "OK"}</p>
            </article>
            <article style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 8, padding: 18 }}>
              <p style={{ color: "#64748B", fontSize: 11, fontWeight: 850, letterSpacing: "0.04em", margin: "0 0 8px", textTransform: "uppercase" }}>Salud datos</p>
              <p style={{ color: dashboard.integrity.healthScore >= 70 ? "#15803D" : "#991B1B", fontSize: "1.45rem", fontWeight: 850, margin: 0 }}>{dashboard.integrity.healthScore}/100</p>
            </article>
          </section>

          <section style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))", marginBottom: 24 }}>
            <article style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 8, padding: 20 }}>
              <h3 style={{ color: "#0F2A3D", fontSize: "1rem", fontWeight: 850, margin: "0 0 10px" }}>Trazabilidad de período</h3>
              <p style={{ color: "#64748B", fontSize: 13, lineHeight: 1.55, margin: "0 0 14px" }}>PDF con historial de cierres, reaperturas, snapshots y registros de auditoría del período {dashboard.year}.</p>
              <a href={`/api/tax/periods/audit/export/pdf?year=${dashboard.year}`} download={`ledgera-auditoria-periodo-${dashboard.year}.pdf`} style={{ background: "#0F2A3D", borderRadius: 8, color: "#FFFFFF", display: "inline-flex", fontSize: 13, fontWeight: 850, padding: "10px 16px", textDecoration: "none" }}>Descargar PDF período</a>
            </article>
            <article style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 8, padding: 20 }}>
              <h3 style={{ color: "#0F2A3D", fontSize: "1rem", fontWeight: 850, margin: "0 0 10px" }}>Trazabilidad CSV</h3>
              <p style={{ color: "#64748B", fontSize: 13, lineHeight: 1.55, margin: "0 0 14px" }}>CSV con historial de acciones, hashes de verificación y registros de cierre del período {dashboard.year}.</p>
              <a href={`/api/tax/periods/audit/export/csv?year=${dashboard.year}`} download={`ledgera-auditoria-periodo-${dashboard.year}.csv`} style={{ background: "#FFFFFF", border: "1px solid #CBD5E1", borderRadius: 8, color: "#0F2A3D", display: "inline-flex", fontSize: 13, fontWeight: 850, padding: "10px 16px", textDecoration: "none" }}>Descargar CSV período</a>
            </article>
            {dashboard.declarations.recent.map((d) => (
              <article key={d.id} style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 8, padding: 20 }}>
                <h3 style={{ color: "#0F2A3D", fontSize: "1rem", fontWeight: 850, margin: "0 0 10px" }}>Declaración {d.type}</h3>
                <p style={{ color: "#64748B", fontSize: 13, lineHeight: 1.55, margin: "0 0 14px" }}>Año {d.taxYear} · Estado: {d.status}</p>
                <a href={`/api/tax/declarations/${d.id}/audit-pdf`} download={`ledgera-auditoria-declaracion-${d.id}.pdf`} style={{ background: "#0F2A3D", borderRadius: 8, color: "#FFFFFF", display: "inline-flex", fontSize: 13, fontWeight: 850, padding: "10px 16px", textDecoration: "none" }}>Descargar PDF auditoría</a>
              </article>
            ))}
          </section>

          {(dashboard.recentLogs.period.length > 0 || dashboard.recentLogs.declarations.length > 0) && (
            <section style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 8, overflow: "hidden" }}>
              <div style={{ padding: "16px 18px", borderBottom: "1px solid #E2E8F0" }}>
                <h3 style={{ color: "#0F2A3D", fontSize: "1rem", fontWeight: 850, margin: 0 }}>Registros recientes</h3>
              </div>
              <div style={{ display: "grid", gap: 0 }}>
                {dashboard.recentLogs.period.map((log) => (
                  <div key={log.id} style={{ alignItems: "center", borderTop: "1px solid #E2E8F0", display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "space-between", padding: "12px 18px" }}>
                    <div>
                      <p style={{ color: "#0F2A3D", fontSize: 13, fontWeight: 750, margin: "0 0 2px" }}>{log.action}{log.reason ? ` · "${log.reason}"` : ""}</p>
                      {log.actorEmail && <p style={{ color: "#64748B", fontSize: 12, margin: 0 }}>{log.actorEmail}</p>}
                    </div>
                    <span style={{ color: "#94A3B8", fontSize: 12 }}>{formatDateTime(log.createdAt)}</span>
                  </div>
                ))}
                {dashboard.recentLogs.declarations.map((log) => (
                  <div key={log.id} style={{ alignItems: "center", borderTop: "1px solid #E2E8F0", display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "space-between", padding: "12px 18px" }}>
                    <div>
                      <p style={{ color: "#0F2A3D", fontSize: 13, fontWeight: 750, margin: "0 0 2px" }}>{log.action} · Declaración {log.declarationId.slice(0, 8)}…</p>
                      {log.actorEmail && <p style={{ color: "#64748B", fontSize: 12, margin: 0 }}>{log.actorEmail}</p>}
                    </div>
                    <span style={{ color: "#94A3B8", fontSize: 12 }}>{formatDateTime(log.createdAt)}</span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
