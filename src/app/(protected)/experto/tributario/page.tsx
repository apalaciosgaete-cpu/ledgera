"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { clp, usd, percent } from "@/shared/formatting";
import { round } from "@/shared/utils/math";

type Tab = "estado" | "revision" | "simulador" | "declaracion" | "calendario";

/* ──────────────── Tax summary types ──────────────── */
type TaxStatus = "EMPTY" | "NO_TAX_EVENTS" | "DECLARE_REVIEW" | "PAY_REVIEW" | "LOSS_REVIEW";

type SummaryTotals = {
  eventsCount: number;
  realizedPnlClp: number;
  stakingRewardClp: number;
  stakingCount: number;
  baseImponibleClp: number;
  impuestoEstimadoClp: number;
  confidenceLevel: number;
  quantitySold: number;
  proceedsNetClp: number;
  costBasisClp: number;
  feeClp: number;
};

type SummaryDecision = { status: TaxStatus; label: string; headline: string; detail: string; shouldDeclare: boolean; likelyPayment: boolean };
type TopAsset = { symbol: string; realizedPnlClp: number; eventsCount: number; quantitySold: number; stakingRewardClp: number; stakingCount: number };
type KeyOperations = { totalSales: number; totalBuys: number; totalStaking: number; totalOther: number };
type SummaryData = { decision: SummaryDecision; nextAction: { label: string; href: string }; totals: SummaryTotals; topAssets: TopAsset[]; keyOperations: KeyOperations; availableYears: number[] };

/* ──────────────── Review types ──────────────── */
type ReviewEvent = { movementId: string; symbol: string; executedAt: string; quantity: number; priceUsd: number; costBasisUsd: number; realizedPnlUsd: number; realizedPnlClp: number; proceedsNetClp: number };
type ReviewAlert = { type: string; severity: "high" | "medium" | "low"; label: string; detail: string };
type ReviewData = { events: ReviewEvent[]; totalEvents: number; totalPnlClp: number; availableYears: number[]; availableSymbols: string[]; filters: { year: number | null; symbol: string | null }; alerts: ReviewAlert[]; health: "OK" | "REVIEW" | "RISK"; sellWithoutEvent: number };

/* ──────────────── Simulator types ──────────────── */
type SimulatorAsset = { symbol: string; quantity: number; currentPriceUsd: number; averageCostUsd: number; marketValueClp: number; unrealizedPnlClp: number; returnPercent: number | null };
type SimulatorData = { symbol: string; quantity: number; priceUsd: number; currentPriceUsd: number; avgCostUsd: number; availableQuantity: number; costBasisUsd: number; costBasisClp: number; proceedsGrossUsd: number; proceedsGrossClp: number; realizedPnlUsd: number; realizedPnlClp: number; taxUsd: number; taxClp: number; taxRate: number; usdClp: number; fxSource: string };

/* ──────────────── Calendar types ──────────────── */
type CalendarMilestone = { label: string; date: string; type: "today" | "milestone" | "payment"; daysUntil: number; passed: boolean };
type CalendarAlert = { type: "urgent" | "warning" | "info"; label: string; detail: string };
type CalendarData = { year: number; hasMovements: boolean; hasSell: boolean; hasStaking: boolean; basePositive: boolean; milestones: CalendarMilestone[]; alerts: CalendarAlert[] };

/* ──────────────── Declaration types ──────────────── */
type Declaration = { id: string; taxYear: number; declarationType: string; status: string; contentHash: string; generatedAt: string };

/* ──────────────── Helpers ──────────────── */
function summaryConfig(status: TaxStatus) {
  switch (status) {
    case "EMPTY": return { icon: "◌", iconColor: "#64748B", titleColor: "#475569", bg: "#F8FAFC", border: "#CBD5E1", subtitle: "Sin movimientos registrados" };
    case "NO_TAX_EVENTS": return { icon: "✓", iconColor: "#16A34A", titleColor: "#166534", bg: "#F0FDF4", border: "#86EFAC", subtitle: "Sin acción requerida" };
    case "PAY_REVIEW": return { icon: "✕", iconColor: "#991B1B", titleColor: "#991B1B", bg: "#FEF2F2", border: "#FECACA", subtitle: "Declaración requerida" };
    case "LOSS_REVIEW":
    case "DECLARE_REVIEW": return { icon: "⚠", iconColor: "#B45309", titleColor: "#B45309", bg: "#FFFBEB", border: "#FCD34D", subtitle: "Revisión recomendada" };
    default: return { icon: "✓", iconColor: "#16A34A", titleColor: "#166534", bg: "#F0FDF4", border: "#86EFAC", subtitle: "Sin acción requerida" };
  }
}

function reviewHealthToken(health: ReviewData["health"]) {
  switch (health) {
    case "OK": return { bg: "#F0FDF4", border: "#86EFAC", color: "#166534", label: "Saludable", icon: "✓" };
    case "REVIEW": return { bg: "#FEF9C3", border: "#FDE047", color: "#854D0E", label: "Requiere revisión", icon: "!" };
    case "RISK": return { bg: "#FEF2F2", border: "#FCA5A5", color: "#991B1B", label: "Crítico", icon: "⚠" };
  }
}

function alertToken(type: CalendarAlert["type"]) {
  switch (type) {
    case "urgent": return { bg: "#FEF2F2", border: "#FCA5A5", color: "#991B1B", icon: "⚠" };
    case "warning": return { bg: "#FEF9C3", border: "#FDE047", color: "#854D0E", icon: "!" };
    case "info": return { bg: "#F0FDF4", border: "#86EFAC", color: "#166534", icon: "i" };
  }
}

function milestoneColor(type: CalendarMilestone["type"], passed: boolean) {
  if (passed) return { bg: "#F1F5F9", border: "#CBD5E1", color: "#94A3B8" };
  if (type === "today") return { bg: "#0F766E", border: "#0F766E", color: "#FFFFFF" };
  if (type === "payment") return { bg: "#FEF9C3", border: "#FDE047", color: "#854D0E" };
  return { bg: "#E0F2FE", border: "#7DD3FC", color: "#075985" };
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

function resolveNextHref(href: string) {
  if (href.startsWith("/impuestos") || href.startsWith("/tax")) return "/experto/tributario";
  return href;
}

function Metric({ label, value, note, accent = "neutral" }: { label: string; value: string; note: string; accent?: "neutral" | "good" | "warn" | "info" }) {
  const color = accent === "good" ? "#15803D" : accent === "warn" ? "#B45309" : accent === "info" ? "#0F766E" : "#0F2A3D";
  return (
    <article style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 8, minHeight: 112, padding: 16 }}>
      <p style={{ color: "#64748B", fontSize: 11, fontWeight: 850, letterSpacing: "0.04em", margin: "0 0 8px", textTransform: "uppercase" }}>{label}</p>
      <p style={{ color, fontSize: "1.45rem", fontWeight: 850, lineHeight: 1.15, margin: "0 0 6px" }}>{value}</p>
      <p style={{ color: "#64748B", fontSize: 13, lineHeight: 1.45, margin: 0 }}>{note}</p>
    </article>
  );
}

/* ──────────────── Sub-components ──────────────── */
function EstadoHeader({ summary }: { summary: SummaryData }) {
  const cfg = summaryConfig(summary.decision.status);
  return (
    <section style={{ background: cfg.bg, border: `2px solid ${cfg.border}`, borderRadius: 14, marginBottom: 24, padding: 28 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <span style={{ color: cfg.iconColor, fontSize: 20 }}>{cfg.icon}</span>
        <h2 style={{ color: cfg.titleColor, fontSize: "1.35rem", fontWeight: 850, margin: 0 }}>{cfg.subtitle}</h2>
      </div>
      <p style={{ color: "#475569", fontSize: 15, lineHeight: 1.55, margin: "0 0 20px", maxWidth: 640 }}>{summary.decision.detail}</p>
      {summary.decision.status !== "EMPTY" && summary.totals.impuestoEstimadoClp > 0 && (
        <div style={{ marginBottom: 20 }}>
          <p style={{ color: "#64748B", fontSize: 11, fontWeight: 850, letterSpacing: "0.04em", margin: "0 0 4px", textTransform: "uppercase" }}>Impuesto estimado</p>
          <p style={{ color: "#0F2A3D", fontSize: "2rem", fontWeight: 850, lineHeight: 1.1, margin: 0 }}>{clp(summary.totals.impuestoEstimadoClp)}</p>
        </div>
      )}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
        <Link href={resolveNextHref(summary.nextAction.href)} style={{ background: cfg.titleColor, borderRadius: 8, color: "#FFFFFF", display: "inline-flex", fontSize: 14, fontWeight: 850, padding: "12px 22px", textDecoration: "none" }}>
          {summary.nextAction.label} →
        </Link>
      </div>
    </section>
  );
}

function RevisionHeader({ review }: { review: ReviewData }) {
  const health = reviewHealthToken(review.health);
  return (
    <section style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", marginBottom: 20 }}>
      <article style={{ background: health.bg, border: `2px solid ${health.border}`, borderRadius: 8, padding: 16 }}>
        <p style={{ color: "#64748B", fontSize: 11, fontWeight: 850, letterSpacing: "0.04em", margin: "0 0 8px", textTransform: "uppercase" }}>Estado</p>
        <p style={{ color: health.color, fontSize: "1.45rem", fontWeight: 850, lineHeight: 1.15, margin: "0 0 6px" }}>{health.icon} {health.label}</p>
        <p style={{ color: "#64748B", fontSize: 13, margin: 0 }}>{review.totalEvents} eventos revisados</p>
      </article>
      <article style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 8, padding: 16 }}>
        <p style={{ color: "#64748B", fontSize: 11, fontWeight: 850, letterSpacing: "0.04em", margin: "0 0 8px", textTransform: "uppercase" }}>Resultado neto</p>
        <p style={{ color: review.totalPnlClp >= 0 ? "#15803D" : "#B45309", fontSize: "1.45rem", fontWeight: 850, lineHeight: 1.15, margin: "0 0 6px" }}>{clp(review.totalPnlClp)}</p>
        <p style={{ color: "#64748B", fontSize: 13, margin: 0 }}>Suma de eventos filtrados</p>
      </article>
      <article style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 8, padding: 16 }}>
        <p style={{ color: "#64748B", fontSize: 11, fontWeight: 850, letterSpacing: "0.04em", margin: "0 0 8px", textTransform: "uppercase" }}>Ventas sin evento</p>
        <p style={{ color: review.sellWithoutEvent > 0 ? "#B45309" : "#15803D", fontSize: "1.45rem", fontWeight: 850, lineHeight: 1.15, margin: "0 0 6px" }}>{review.sellWithoutEvent}</p>
        <p style={{ color: "#64748B", fontSize: 13, margin: 0 }}>{review.sellWithoutEvent > 0 ? "Revisar inconsistencias" : "Sin inconsistencias"}</p>
      </article>
    </section>
  );
}

/* ──────────────── Page ──────────────── */
export default function ExpertoTributarioPage() {
  const [tab, setTab] = useState<Tab>("estado");
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState<string>(String(currentYear));

  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [summaryError, setSummaryError] = useState("");

  const [review, setReview] = useState<ReviewData | null>(null);
  const [reviewLoading, setReviewLoading] = useState(true);
  const [reviewError, setReviewError] = useState("");
  const [reviewYear, setReviewYear] = useState<string>("");
  const [reviewSymbol, setReviewSymbol] = useState<string>("");

  const [assets, setAssets] = useState<SimulatorAsset[]>([]);
  const [selectedSymbol, setSelectedSymbol] = useState("");
  const [quantityInput, setQuantityInput] = useState("");
  const [priceInput, setPriceInput] = useState("");
  const [simulatorLoading, setSimulatorLoading] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [simResult, setSimResult] = useState<SimulatorData | null>(null);
  const [simError, setSimError] = useState("");

  const [declarations, setDeclarations] = useState<Declaration[]>([]);
  const [declLoading, setDeclLoading] = useState(true);
  const [declError, setDeclError] = useState("");

  const [calendar, setCalendar] = useState<CalendarData | null>(null);
  const [calendarLoading, setCalendarLoading] = useState(true);
  const [calendarError, setCalendarError] = useState("");

  useEffect(() => {
    async function loadSummary() {
      setSummaryLoading(true); setSummaryError("");
      try {
        const res = await fetch(`/api/tax/summary?year=${year}`, { cache: "no-store" });
        const json = await res.json();
        if (!res.ok || !json.ok) throw new Error(json.message || "No se pudo cargar el estado tributario.");
        setSummary(json.data);
      } catch (err) {
        setSummaryError(err instanceof Error ? err.message : "Error cargando estado tributario.");
      } finally {
        setSummaryLoading(false);
      }
    }
    void loadSummary();
  }, [year]);

  useEffect(() => {
    async function loadReview(y?: string, s?: string) {
      setReviewLoading(true); setReviewError("");
      try {
        const params = new URLSearchParams();
        if (y) params.set("year", y);
        if (s) params.set("symbol", s);
        const res = await fetch(`/api/tax/review?${params.toString()}`, { cache: "no-store" });
        const json = await res.json();
        if (!res.ok || !json.ok) throw new Error(json.message || "No se pudo cargar la revisión.");
        setReview(json.data);
      } catch (err) {
        setReviewError(err instanceof Error ? err.message : "Error cargando revisión.");
      } finally {
        setReviewLoading(false);
      }
    }
    void loadReview();
  }, []);

  useEffect(() => {
    if (!review) return;
    const timer = setTimeout(() => {
      async function load() {
        setReviewLoading(true); setReviewError("");
        try {
          const params = new URLSearchParams();
          if (reviewYear) params.set("year", reviewYear);
          if (reviewSymbol) params.set("symbol", reviewSymbol);
          const res = await fetch(`/api/tax/review?${params.toString()}`, { cache: "no-store" });
          const json = await res.json();
          if (!res.ok || !json.ok) throw new Error(json.message || "No se pudo cargar la revisión.");
          setReview(json.data);
        } catch (err) {
          setReviewError(err instanceof Error ? err.message : "Error cargando revisión.");
        } finally {
          setReviewLoading(false);
        }
      }
      void load();
    }, 300);
    return () => clearTimeout(timer);
  }, [reviewYear, reviewSymbol]);

  useEffect(() => {
    async function load() {
      try {
        setSimulatorLoading(true);
        const res = await fetch("/api/investor/dashboard", { cache: "no-store" });
        const json = await res.json();
        if (!res.ok || !json.ok) throw new Error(json.message || "No se pudieron cargar los activos.");
        const list: SimulatorAsset[] = (json.data?.activos ?? [])
          .filter((a: SimulatorAsset) => a.quantity > 0)
          .sort((a: SimulatorAsset, b: SimulatorAsset) => b.marketValueClp - a.marketValueClp);
        setAssets(list);
        if (list.length > 0) {
          setSelectedSymbol(list[0].symbol);
          setPriceInput(String(list[0].currentPriceUsd));
        }
      } catch (err) {
        setSimError(err instanceof Error ? err.message : "Error cargando activos.");
      } finally {
        setSimulatorLoading(false);
      }
    }
    void load();
  }, []);

  useEffect(() => {
    const asset = assets.find((a) => a.symbol === selectedSymbol);
    if (asset) {
      setPriceInput(String(asset.currentPriceUsd));
      setQuantityInput("");
      setSimResult(null);
      setSimError("");
    }
  }, [selectedSymbol, assets]);

  useEffect(() => {
    async function load() {
      setDeclLoading(true); setDeclError("");
      try {
        const res = await fetch(`/api/tax/declarations?year=${currentYear}`, { cache: "no-store" });
        const json = await res.json();
        if (!res.ok || !json.ok) throw new Error(json.message || "No se pudieron cargar declaraciones.");
        setDeclarations(json.data.declarations || []);
      } catch (err) {
        setDeclError(err instanceof Error ? err.message : "Error cargando declaraciones.");
      } finally {
        setDeclLoading(false);
      }
    }
    void load();
  }, [currentYear]);

  useEffect(() => {
    async function load() {
      setCalendarLoading(true); setCalendarError("");
      try {
        const res = await fetch("/api/tax/calendar", { cache: "no-store" });
        const json = await res.json();
        if (!res.ok || !json.ok) throw new Error(json.message || "No se pudo cargar el calendario.");
        setCalendar(json.data);
      } catch (err) {
        setCalendarError(err instanceof Error ? err.message : "Error cargando calendario.");
      } finally {
        setCalendarLoading(false);
      }
    }
    void load();
  }, []);

  const selectedAsset = useMemo(() => assets.find((a) => a.symbol === selectedSymbol), [assets, selectedSymbol]);
  const quickPercentages = useMemo(() => {
    if (!selectedAsset) return [];
    return [
      { label: "25%", value: selectedAsset.quantity * 0.25 },
      { label: "50%", value: selectedAsset.quantity * 0.5 },
      { label: "75%", value: selectedAsset.quantity * 0.75 },
      { label: "100%", value: selectedAsset.quantity },
    ];
  }, [selectedAsset]);

  async function handleSimulate() {
    if (!selectedAsset) return;
    const quantity = Number(quantityInput);
    const priceUsd = Number(priceInput);
    if (!quantity || quantity <= 0) { setSimError("Indica una cantidad válida."); return; }
    if (!priceUsd || priceUsd <= 0) { setSimError("Indica un precio estimado válido."); return; }
    try {
      setSimulating(true); setSimError("");
      const res = await fetch(`/api/tax/simulator?symbol=${encodeURIComponent(selectedAsset.symbol)}&quantity=${quantity}&priceUsd=${priceUsd}`, { cache: "no-store" });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.message || "Error al simular.");
      setSimResult(json.data);
    } catch (err) {
      setSimResult(null);
      setSimError(err instanceof Error ? err.message : "Error al simular.");
    } finally {
      setSimulating(false);
    }
  }

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
          <h1 style={{ color: "#0F2A3D", fontSize: "1.85rem", fontWeight: 850, lineHeight: 1.12, margin: "0 0 8px" }}>Tributario</h1>
          <p style={{ color: "#64748B", fontSize: "0.95rem", lineHeight: 1.55, margin: 0 }}>Estado completo, revisión, simulador, declaraciones y calendario en un solo lugar.</p>
        </div>
        <Link href="/experto" style={{ border: "1px solid #CBD5E1", borderRadius: 8, color: "#0F2A3D", display: "inline-flex", fontSize: 13, fontWeight: 850, padding: "10px 14px", textDecoration: "none" }}>Volver a Experto</Link>
      </section>

      <section style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", marginBottom: 20 }}>
        {[
          { label: "Memoria Tributaria", href: "/experto/memoria-tributaria", desc: "Historial inteligente con insights" },
          { label: "Operaciones", href: "/experto/operaciones", desc: "Revisar eventos y ledger" },
          { label: "Declaraciones", href: "/experto/declaraciones", desc: "DDJJ y cadena de custodia" },
          { label: "Reportes", href: "/experto/reportes", desc: "PDF y exportaciones" },
          { label: "Auditoría", href: "/experto/auditoria", desc: "Integridad y hallazgos" },
          { label: "Verificaciones", href: "/experto/verificaciones", desc: "Hashes y códigos públicos" },
        ].map((a) => (
          <Link key={a.href} href={a.href} style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 8, padding: 16, textDecoration: "none", display: "block" }}>
            <p style={{ color: "#0F2A3D", fontSize: 14, fontWeight: 850, margin: "0 0 4px" }}>{a.label} →</p>
            <p style={{ color: "#64748B", fontSize: 12, lineHeight: 1.45, margin: 0 }}>{a.desc}</p>
          </Link>
        ))}
      </section>

      <div style={{ display: "flex", gap: 4, marginBottom: 20, background: "#FFFFFF", borderRadius: 10, padding: 4, border: "1px solid #E2E8F0" }}>
        {tabBtn("estado", "Estado")}
        {tabBtn("revision", "Revisión")}
        {tabBtn("simulador", "Simulador")}
        {tabBtn("declaracion", "Declaración")}
        {tabBtn("calendario", "Calendario")}
      </div>

      {tab === "estado" && (
        <>
          {summaryLoading && !summary ? (
            <p style={{ color: "#64748B", fontSize: 14, fontWeight: 750 }}>Cargando estado tributario…</p>
          ) : summaryError ? (
            <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8, color: "#991B1B", fontWeight: 750, padding: 16 }}>{summaryError}</div>
          ) : summary ? (
            <>
              <section style={{ alignItems: "end", background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 8, display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", marginBottom: 20, padding: 16 }}>
                <label style={{ color: "#475569", display: "grid", fontSize: 13, fontWeight: 750, gap: 6 }}>
                  Año
                  <select value={year} onChange={(e) => setYear(e.target.value)} style={{ border: "1px solid #CBD5E1", borderRadius: 8, color: "#0F2A3D", minHeight: 40, padding: "0 10px" }}>
                    {[currentYear, currentYear - 1, currentYear - 2].map((y) => (<option key={y} value={String(y)}>{y}</option>))}
                  </select>
                </label>
              </section>

              <EstadoHeader summary={summary} />

              <section style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", marginBottom: 24 }}>
                <Metric label="Base imponible" value={clp(summary.totals.baseImponibleClp)} note={summary.totals.baseImponibleClp > 0 ? "Máx entre PnL + staking" : "Sin base imponible"} accent={summary.totals.baseImponibleClp > 0 ? "warn" : "good"} />
                <Metric label="Impuesto estimado" value={clp(summary.totals.impuestoEstimadoClp)} note="6,5% base imponible" accent={summary.totals.impuestoEstimadoClp > 0 ? "warn" : "good"} />
                <Metric label="Ventas gravadas" value={String(summary.totals.eventsCount)} note={`${clp(summary.totals.proceedsNetClp)} ingreso neto`} accent="info" />
                <Metric label="Staking" value={clp(summary.totals.stakingRewardClp)} note={`${summary.totals.stakingCount} eventos`} accent={summary.totals.stakingRewardClp > 0 ? "warn" : "good"} />
                <Metric label="Pérdidas compensables" value={clp(Math.min(0, summary.totals.realizedPnlClp) * -1)} note={summary.totals.realizedPnlClp < 0 ? "Pérdida realizada" : "Sin pérdida"} accent="neutral" />
                <Metric label="Confianza datos" value={`${summary.totals.confidenceLevel}%`} note="Basado en integridad" accent={summary.totals.confidenceLevel >= 80 ? "good" : summary.totals.confidenceLevel >= 50 ? "warn" : "info"} />
              </section>

              {summary.decision.status !== "EMPTY" && (
                <section style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 240px), 1fr))", marginBottom: 24 }}>
                  <article style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 8, padding: 18 }}>
                    <p style={{ color: "#64748B", fontSize: 11, fontWeight: 850, letterSpacing: "0.04em", margin: "0 0 8px", textTransform: "uppercase" }}>Operaciones</p>
                    <div style={{ display: "grid", gap: 6 }}>
                      <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "#475569", fontSize: 13 }}>Ventas</span><span style={{ color: "#0F2A3D", fontWeight: 750 }}>{summary.keyOperations.totalSales}</span></div>
                      <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "#475569", fontSize: 13 }}>Compras</span><span style={{ color: "#0F2A3D", fontWeight: 750 }}>{summary.keyOperations.totalBuys}</span></div>
                      <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "#475569", fontSize: 13 }}>Staking</span><span style={{ color: "#0F2A3D", fontWeight: 750 }}>{summary.keyOperations.totalStaking}</span></div>
                      <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "#475569", fontSize: 13 }}>Otras</span><span style={{ color: "#0F2A3D", fontWeight: 750 }}>{summary.keyOperations.totalOther}</span></div>
                    </div>
                  </article>

                  {summary.topAssets.length > 0 && (
                    <article style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 8, padding: 18 }}>
                      <p style={{ color: "#64748B", fontSize: 11, fontWeight: 850, letterSpacing: "0.04em", margin: "0 0 12px", textTransform: "uppercase" }}>Top activos</p>
                      <div style={{ display: "grid", gap: 8 }}>
                        {summary.topAssets.slice(0, 5).map((asset) => (
                          <div key={asset.symbol} style={{ alignItems: "center", display: "flex", justifyContent: "space-between" }}>
                            <span style={{ color: "#0F2A3D", fontSize: 14, fontWeight: 850 }}>{asset.symbol}</span>
                            <span style={{ color: asset.realizedPnlClp >= 0 ? "#15803D" : "#B45309", fontSize: 13, fontWeight: 750 }}>{clp(asset.realizedPnlClp)}</span>
                          </div>
                        ))}
                      </div>
                    </article>
                  )}

                  <article style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 8, padding: 18 }}>
                    <p style={{ color: "#64748B", fontSize: 11, fontWeight: 850, letterSpacing: "0.04em", margin: "0 0 12px", textTransform: "uppercase" }}>Próximo paso</p>
                    <p style={{ color: "#0F2A3D", fontSize: 14, fontWeight: 750, margin: "0 0 8px" }}>{summary.decision.shouldDeclare ? "Revisar operaciones antes de declarar" : "Revisar movimientos registrados"}</p>
                    <p style={{ color: "#64748B", fontSize: 13, lineHeight: 1.5, margin: 0 }}>Cierre anual: <strong>31 de diciembre</strong></p>
                  </article>
                </section>
              )}
            </>
          ) : null}
        </>
      )}

      {tab === "revision" && (
        <>
          {reviewLoading && !review ? (
            <p style={{ color: "#64748B", fontSize: 14, fontWeight: 750 }}>Cargando revisión…</p>
          ) : reviewError ? (
            <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8, color: "#991B1B", fontWeight: 750, padding: 16 }}>{reviewError}</div>
          ) : review ? (
            <>
              <RevisionHeader review={review} />

              {review.alerts.length > 0 && (
                <section style={{ marginBottom: 20 }}>
                  {review.alerts.map((alert, i) => (
                    <div key={i} style={{ background: alert.severity === "high" ? "#FEF2F2" : "#FEF9C3", border: `1px solid ${alert.severity === "high" ? "#FCA5A5" : "#FDE047"}`, borderRadius: 8, color: alert.severity === "high" ? "#991B1B" : "#854D0E", fontWeight: 750, marginBottom: 8, padding: "14px 16px" }}>
                      <p style={{ margin: "0 0 4px" }}>{alert.label}</p>
                      <p style={{ fontSize: 13, fontWeight: 400, lineHeight: 1.5, margin: 0 }}>{alert.detail}</p>
                    </div>
                  ))}
                </section>
              )}

              <section style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 8, marginBottom: 20, padding: 16 }}>
                <div style={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 14, justifyContent: "space-between" }}>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
                    <label style={{ alignItems: "center", color: "#475569", display: "inline-flex", fontSize: 13, fontWeight: 750, gap: 8 }}>
                      Año
                      <select value={reviewYear} onChange={(e) => setReviewYear(e.target.value)} style={{ background: "#FFFFFF", border: "1px solid #CBD5E1", borderRadius: 8, color: "#0F2A3D", fontSize: 13, fontWeight: 750, minHeight: 38, padding: "0 10px" }}>
                        <option value="">Todos</option>
                        {review.availableYears.map((y) => (<option key={y} value={String(y)}>{y}</option>))}
                      </select>
                    </label>
                    <label style={{ alignItems: "center", color: "#475569", display: "inline-flex", fontSize: 13, fontWeight: 750, gap: 8 }}>
                      Activo
                      <select value={reviewSymbol} onChange={(e) => setReviewSymbol(e.target.value)} style={{ background: "#FFFFFF", border: "1px solid #CBD5E1", borderRadius: 8, color: "#0F2A3D", fontSize: 13, fontWeight: 750, minHeight: 38, padding: "0 10px" }}>
                        <option value="">Todos</option>
                        {review.availableSymbols.map((s) => (<option key={s} value={s}>{s}</option>))}
                      </select>
                    </label>
                  </div>
                  <Link href="/experto/operaciones" style={{ background: "#0F2A3D", borderRadius: 8, color: "#FFFFFF", display: "inline-flex", fontSize: 13, fontWeight: 850, padding: "10px 16px", textDecoration: "none" }}>Abrir operaciones</Link>
                </div>

                {review.events.length === 0 ? (
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
                        {review.events.map((event) => {
                          const positive = event.realizedPnlClp >= 0;
                          return (
                            <tr key={event.movementId} style={{ borderTop: "1px solid #E2E8F0" }}>
                              <td style={{ color: "#334155", fontSize: 13, padding: "14px" }}>{new Date(event.executedAt).toLocaleDateString("es-CL")}</td>
                              <td style={{ color: "#0F2A3D", fontSize: 14, fontWeight: 850, padding: "14px" }}>{event.symbol}</td>
                              <td style={{ color: "#334155", fontSize: 13, padding: "14px", textAlign: "right" }}>{event.quantity}</td>
                              <td style={{ color: "#334155", fontSize: 13, padding: "14px", textAlign: "right" }}>{usd(event.priceUsd)}</td>
                              <td style={{ color: "#334155", fontSize: 13, padding: "14px", textAlign: "right" }}>{usd(event.costBasisUsd)}</td>
                              <td style={{ color: positive ? "#15803D" : "#B45309", fontSize: 13, fontWeight: 850, padding: "14px", textAlign: "right" }}>{clp(event.realizedPnlClp)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>

              <section style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                <Link href="/experto/operaciones" style={{ background: "#0F2A3D", borderRadius: 8, color: "#FFFFFF", display: "inline-flex", fontSize: 14, fontWeight: 850, padding: "12px 22px", textDecoration: "none" }}>Reconstruir eventos en Operaciones</Link>
              </section>
            </>
          ) : null}
        </>
      )}

      {tab === "simulador" && (
        <>
          {simulatorLoading ? (
            <p style={{ color: "#64748B", fontSize: 14, fontWeight: 750 }}>Cargando simulador…</p>
          ) : simError && assets.length === 0 ? (
            <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8, color: "#991B1B", fontWeight: 750, padding: 16 }}>{simError}</div>
          ) : assets.length === 0 ? (
            <section style={{ background: "#FFFFFF", border: "1px dashed #CBD5E1", borderRadius: 8, padding: 28, textAlign: "center" }}>
              <h2 style={{ color: "#0F2A3D", fontSize: "1.15rem", fontWeight: 850, margin: "0 0 8px" }}>Aún no hay activos para simular</h2>
              <p style={{ color: "#64748B", fontSize: 14, lineHeight: 1.55, margin: "0 auto 16px", maxWidth: 520 }}>Carga movimientos de compra o depósito para tener activos disponibles en el simulador.</p>
              <Link href="/importaciones" style={{ background: "#0F766E", borderRadius: 8, color: "#FFFFFF", display: "inline-flex", fontSize: 13, fontWeight: 850, padding: "10px 14px", textDecoration: "none" }}>Cargar movimientos</Link>
            </section>
          ) : (
            <>
              <section style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 8, marginBottom: 20, padding: 20 }}>
                <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
                  <div>
                    <label style={{ color: "#475569", display: "block", fontSize: 13, fontWeight: 750, marginBottom: 6 }}>Activo</label>
                    <select value={selectedSymbol} onChange={(e) => setSelectedSymbol(e.target.value)} style={{ background: "#FFFFFF", border: "1px solid #CBD5E1", borderRadius: 8, color: "#0F2A3D", fontSize: 14, fontWeight: 750, minHeight: 44, padding: "0 12px", width: "100%" }}>
                      {assets.map((a) => (<option key={a.symbol} value={a.symbol}>{a.symbol} — {usd(a.currentPriceUsd)} — {a.quantity} disp.</option>))}
                    </select>
                  </div>
                  <div>
                    <label style={{ color: "#475569", display: "block", fontSize: 13, fontWeight: 750, marginBottom: 6 }}>Cantidad a vender</label>
                    <input type="number" step="any" min="0" max={selectedAsset?.quantity} value={quantityInput} onChange={(e) => setQuantityInput(e.target.value)} placeholder={`Máx: ${selectedAsset?.quantity ?? 0}`} style={{ background: "#FFFFFF", border: "1px solid #CBD5E1", borderRadius: 8, color: "#0F2A3D", fontSize: 14, fontWeight: 750, minHeight: 44, padding: "0 12px", width: "100%" }} />
                    {selectedAsset && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
                        {quickPercentages.map((q) => (
                          <button key={q.label} type="button" onClick={() => setQuantityInput(String(round(q.value, 8)))} style={{ background: "#F1F5F9", border: "1px solid #CBD5E1", borderRadius: 6, color: "#475569", cursor: "pointer", fontSize: 12, fontWeight: 750, padding: "5px 10px" }}>{q.label}</button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div>
                    <label style={{ color: "#475569", display: "block", fontSize: 13, fontWeight: 750, marginBottom: 6 }}>Precio estimado (USD)</label>
                    <input type="number" step="any" min="0" value={priceInput} onChange={(e) => setPriceInput(e.target.value)} placeholder="Precio estimado" style={{ background: "#FFFFFF", border: "1px solid #CBD5E1", borderRadius: 8, color: "#0F2A3D", fontSize: 14, fontWeight: 750, minHeight: 44, padding: "0 12px", width: "100%" }} />
                    {selectedAsset && selectedAsset.currentPriceUsd > 0 && <p style={{ color: "#64748B", fontSize: 12, margin: "6px 0 0" }}>Precio actual: {usd(selectedAsset.currentPriceUsd)}</p>}
                  </div>
                </div>
                <div style={{ marginTop: 18 }}>
                  <button type="button" onClick={handleSimulate} disabled={simulating || !quantityInput || !priceInput} style={{ background: simulating || !quantityInput || !priceInput ? "#94A3B8" : "#0F766E", border: "none", borderRadius: 8, color: "#FFFFFF", cursor: simulating || !quantityInput || !priceInput ? "not-allowed" : "pointer", fontSize: 14, fontWeight: 850, padding: "12px 20px" }}>
                    {simulating ? "Simulando…" : "Simular venta"}
                  </button>
                </div>
                {simError && <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8, color: "#991B1B", fontWeight: 750, marginTop: 14, padding: 12 }}>{simError}</div>}
              </section>

              {simResult && (
                <>
                  <section style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", marginBottom: 20 }}>
                    <Metric label="Venta estimada" value={usd(simResult.proceedsGrossUsd)} note={clp(simResult.proceedsGrossClp)} accent="info" />
                    <Metric label="Ganancia / pérdida" value={clp(simResult.realizedPnlClp)} note={`${usd(simResult.realizedPnlUsd)} · ${percent((simResult.realizedPnlUsd / (simResult.costBasisUsd || 1)) * 100)} vs costo`} accent={simResult.realizedPnlClp >= 0 ? "good" : "warn"} />
                    <Metric label="Impuesto estimado" value={clp(simResult.taxClp)} note={`${usd(simResult.taxUsd)} · ${(simResult.taxRate * 100).toFixed(1)}% de la ganancia`} accent={simResult.taxClp > 0 ? "warn" : "good"} />
                    <Metric label="Neto después de impuesto" value={clp(simResult.proceedsGrossClp - simResult.taxClp)} note={`${usd(simResult.proceedsGrossUsd - simResult.taxUsd)} estimado`} accent="neutral" />
                  </section>

                  <section style={{ background: "#F8FAFC", border: "1px solid #CBD5E1", borderRadius: 8, marginBottom: 20, padding: 16 }}>
                    <p style={{ color: "#0F2A3D", fontSize: 14, fontWeight: 850, margin: "0 0 6px" }}>Detalle de la simulación</p>
                    <div style={{ display: "grid", gap: 8 }}>
                      {[
                        { label: "Activo", value: simResult.symbol },
                        { label: "Cantidad a vender", value: String(simResult.quantity) },
                        { label: "Cantidad disponible", value: String(simResult.availableQuantity) },
                        { label: "Costo promedio", value: usd(simResult.avgCostUsd) },
                        { label: "Precio estimado", value: usd(simResult.priceUsd) },
                        { label: "Costo total estimado", value: clp(simResult.costBasisClp) },
                        { label: "Tipo de cambio", value: clp(simResult.usdClp) },
                      ].map((row) => (
                        <div key={row.label} style={{ alignItems: "center", display: "flex", justifyContent: "space-between" }}>
                          <span style={{ color: "#475569", fontSize: 13 }}>{row.label}</span>
                          <strong style={{ color: "#0F2A3D", fontSize: 13 }}>{row.value}</strong>
                        </div>
                      ))}
                    </div>
                  </section>
                </>
              )}
            </>
          )}
        </>
      )}

      {tab === "declaracion" && (
        <>
          {declLoading ? (
            <p style={{ color: "#64748B", fontSize: 14, fontWeight: 750 }}>Cargando declaraciones…</p>
          ) : declError ? (
            <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8, color: "#991B1B", fontWeight: 750, padding: 16 }}>{declError}</div>
          ) : (
            <>
              <section style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", marginBottom: 24 }}>
                <article style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 8, padding: 16, textAlign: "center" }}>
                  <p style={{ color: "#64748B", fontSize: 11, fontWeight: 850, letterSpacing: "0.04em", margin: "0 0 8px", textTransform: "uppercase" }}>DDJJ {currentYear}</p>
                  <p style={{ color: "#0F2A3D", fontSize: "1.45rem", fontWeight: 850, margin: 0 }}>{declarations.length}</p>
                </article>
                <article style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 8, padding: 16, textAlign: "center" }}>
                  <p style={{ color: "#64748B", fontSize: 11, fontWeight: 850, letterSpacing: "0.04em", margin: "0 0 8px", textTransform: "uppercase" }}>Confirmadas</p>
                  <p style={{ color: "#16A34A", fontSize: "1.45rem", fontWeight: 850, margin: 0 }}>{declarations.filter((d) => d.status === "CONFIRMED").length}</p>
                </article>
                <article style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 8, padding: 16, textAlign: "center" }}>
                  <p style={{ color: "#64748B", fontSize: 11, fontWeight: 850, letterSpacing: "0.04em", margin: "0 0 8px", textTransform: "uppercase" }}>Pendientes</p>
                  <p style={{ color: "#B45309", fontSize: "1.45rem", fontWeight: 850, margin: 0 }}>{declarations.filter((d) => d.status === "DRAFT" || d.status === "REVIEWED").length}</p>
                </article>
              </section>

              {declarations.length === 0 ? (
                <section style={{ background: "#FFFFFF", border: "1px dashed #CBD5E1", borderRadius: 8, padding: 28, textAlign: "center" }}>
                  <h2 style={{ color: "#0F2A3D", fontSize: "1.15rem", fontWeight: 850, margin: "0 0 8px" }}>Sin declaraciones para {currentYear}</h2>
                  <p style={{ color: "#64748B", fontSize: 14, lineHeight: 1.55, margin: "0 auto 16px", maxWidth: 520 }}>Genera tu primera declaración desde el centro de declaraciones.</p>
                  <Link href="/experto/declaraciones" style={{ background: "#0F2A3D", borderRadius: 8, color: "#FFFFFF", display: "inline-flex", fontSize: 13, fontWeight: 850, padding: "10px 16px", textDecoration: "none" }}>Abrir declaraciones</Link>
                </section>
              ) : (
                <section style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 8, marginBottom: 24, overflow: "hidden" }}>
                  <div style={{ padding: "16px 18px", borderBottom: "1px solid #E2E8F0" }}>
                    <h3 style={{ color: "#0F2A3D", fontSize: "1rem", fontWeight: 850, margin: 0 }}>Declaraciones recientes</h3>
                  </div>
                  <div style={{ display: "grid", gap: 0 }}>
                    {declarations.slice(0, 5).map((d) => {
                      const cfg = declStatusLabel(d.status);
                      return (
                        <div key={d.id} style={{ alignItems: "center", borderTop: "1px solid #E2E8F0", display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "space-between", padding: "14px 18px" }}>
                          <div>
                            <p style={{ color: "#0F2A3D", fontSize: 14, fontWeight: 750, margin: "0 0 2px" }}>{d.declarationType} · Año {d.taxYear}</p>
                            <p style={{ color: "#94A3B8", fontSize: 12, fontFamily: "monospace", margin: 0 }}>Hash: {d.contentHash.slice(0, 14)}…</p>
                          </div>
                          <span style={{ background: cfg.bg, borderRadius: 999, color: cfg.color, fontSize: 12, fontWeight: 800, padding: "4px 12px" }}>{cfg.text}</span>
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}

              <section style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                <Link href="/experto/declaraciones" style={{ background: "#0F2A3D", borderRadius: 8, color: "#FFFFFF", display: "inline-flex", fontSize: 14, fontWeight: 850, padding: "12px 22px", textDecoration: "none" }}>Gestionar declaraciones</Link>
              </section>
            </>
          )}
        </>
      )}

      {tab === "calendario" && (
        <>
          {calendarLoading ? (
            <p style={{ color: "#64748B", fontSize: 14, fontWeight: 750 }}>Cargando calendario…</p>
          ) : calendarError ? (
            <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8, color: "#991B1B", fontWeight: 750, padding: 16 }}>{calendarError}</div>
          ) : calendar ? (
            <>
              {calendar.alerts.length > 0 && (
                <section style={{ marginBottom: 24 }}>
                  {calendar.alerts.map((alert, i) => {
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
                <h2 style={{ color: "#0F2A3D", fontSize: "1rem", fontWeight: 850, margin: "0 0 14px" }}>Línea de tiempo {calendar.year}</h2>
                <div style={{ display: "grid", gap: 10 }}>
                  {calendar.milestones.map((m, i) => {
                    const token = milestoneColor(m.type, m.passed);
                    const dateStr = new Date(m.date).toLocaleDateString("es-CL", { day: "numeric", month: "long" });
                    return (
                      <div key={i} style={{ alignItems: "center", background: token.bg, border: `1px solid ${token.border}`, borderRadius: 8, display: "flex", flexWrap: "wrap", gap: 12, padding: "12px 16px" }}>
                        <div style={{ background: token.color, borderRadius: 999, flexShrink: 0, height: 10, width: 10 }} />
                        <div style={{ flex: 1, minWidth: 160 }}>
                          <p style={{ color: token.color, fontSize: 14, fontWeight: 850, margin: 0 }}>{m.label}</p>
                        </div>
                        <p style={{ color: m.passed ? "#94A3B8" : "#475569", fontSize: 13, fontWeight: 750, margin: 0 }}>{dateStr}</p>
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
                <p style={{ color: "#64748B", fontSize: 13, lineHeight: 1.55, margin: "0 0 10px" }}>Las fechas son referenciales para el calendario tributario chileno. Valida con tu contador las fechas exactas del año en curso.</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                  <Link href="/experto/tributario" style={{ color: "#0F766E", fontSize: 13, fontWeight: 850, textDecoration: "none" }}>Ver resumen →</Link>
                  <Link href="/experto/tributario?tab=simulador" style={{ color: "#0F766E", fontSize: 13, fontWeight: 850, textDecoration: "none" }}>Simular venta →</Link>
                  <Link href="/experto/operaciones" style={{ color: "#0F766E", fontSize: 13, fontWeight: 850, textDecoration: "none" }}>Revisar eventos →</Link>
                </div>
              </section>
            </>
          ) : null}
        </>
      )}
    </div>
  );
}
