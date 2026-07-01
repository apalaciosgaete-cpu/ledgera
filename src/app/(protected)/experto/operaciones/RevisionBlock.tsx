"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ui } from "@/styles/design-system";

type TaxEvent = {
  id: string;
  movementId: string;
  eventType: string;
  symbol: string;
  executedAt: string;
  quantity: number;
  realizedPnlUsd: number;
  realizedPnlClp: number;
  effectiveTaxCategory: string;
};

type Issue = { type: string; movementId: string; detail: string };
type IssueSeverity = "HIGH" | "MEDIUM" | "LOW";
type TaxHealthStatus = "OK" | "REVIEW" | "RISK";
type TaxCategory = "CAPITAL_GAIN" | "ORDINARY_INCOME" | "NON_TAXABLE" | "UNCLASSIFIED";
type EventCategoryFilter = "ALL" | TaxCategory;
type EnrichedIssue = Issue & { severity: IssueSeverity };

type TaxReviewResponse = { ok: boolean; message: string; data: { events: TaxEvent[]; issues: Issue[] } | null };
type RebuildResponse = { ok: boolean; message: string; data?: unknown };

function getSeverity(type: string): IssueSeverity {
  if (type === "SELL_WITHOUT_EVENT" || type === "NEGATIVE_INVENTORY") return "HIGH";
  if (type === "ORPHAN_EVENT" || type === "UNCLASSIFIED_EVENT") return "MEDIUM";
  return "LOW";
}

function getSeverityLabel(s: IssueSeverity) {
  if (s === "HIGH") return "Crítico"; if (s === "MEDIUM") return "Medio"; return "Bajo";
}

function getIssueTypeLabel(type: string) {
  switch (type) {
    case "SELL_WITHOUT_EVENT": return "Venta sin evento tributario";
    case "ORPHAN_EVENT": return "Evento tributario huérfano";
    case "NEGATIVE_INVENTORY": return "Inventario negativo";
    case "UNCLASSIFIED_EVENT": return "Evento sin clasificación";
    default: return type;
  }
}

function getCategoryLabel(c: string) {
  switch (c) {
    case "CAPITAL_GAIN": return "Mayor valor";
    case "ORDINARY_INCOME": return "Renta ordinaria";
    case "NON_TAXABLE": return "No afecto";
    case "UNCLASSIFIED": return "Sin clasificar";
    default: return c;
  }
}

function formatUsd(v: number) {
  return new Intl.NumberFormat("es-CL", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format(v || 0);
}

function formatClp(v: number) {
  return new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }).format(v || 0);
}

function formatNumber(v: number) {
  return new Intl.NumberFormat("es-CL", { maximumFractionDigits: 8 }).format(v || 0);
}

function formatDate(v: string) {
  const d = new Date(v); return Number.isNaN(d.getTime()) ? "-" : new Intl.DateTimeFormat("es-CL", { year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
}

function SeverityBadge({ severity }: { severity: IssueSeverity }) {
  const styles: Record<IssueSeverity, string> = {
    HIGH: ui.badgeRisk,
    MEDIUM: ui.badgeWarning,
    LOW: "border border-slate-300 bg-slate-100 text-slate-700",
  };
  return <span className={`rounded px-2 py-1 text-xs font-medium ${styles[severity]}`}>{getSeverityLabel(severity)}</span>;
}

function HealthBadge({ status }: { status: TaxHealthStatus }) {
  if (status === "OK") return <span className={`rounded px-3 py-1 text-xs font-medium ${ui.badgeOk}`}>Operativo</span>;
  if (status === "REVIEW") return <span className={`rounded px-3 py-1 text-xs font-medium ${ui.badgeWarning}`}>Requiere revisión</span>;
  return <span className={`rounded px-3 py-1 text-xs font-medium ${ui.badgeRisk}`}>Riesgo tributario</span>;
}

const CATEGORIES: { value: TaxCategory; label: string; color: string; bg: string }[] = [
  { value: "CAPITAL_GAIN", label: "Mayor valor", color: "var(--accent)", bg: "rgba(37,99,235,0.08)" },
  { value: "ORDINARY_INCOME", label: "Renta ordinaria", color: "var(--text)", bg: "rgba(71,85,105,0.08)" },
  { value: "NON_TAXABLE", label: "No afecto", color: "var(--accent)", bg: "rgba(21,128,61,0.08)" },
  { value: "UNCLASSIFIED", label: "Sin clasificar", color: "var(--warn)", bg: "rgba(146,64,14,0.08)" },
];

function getCategoryStyle(category: string) {
  return CATEGORIES.find((c) => c.value === category) ?? { color: "var(--warn)", bg: "rgba(146,64,14,0.08)", label: getCategoryLabel(category) };
}

function CategoryBadge({ category, movementId, onClassified }: { category: string; movementId: string; onClassified: (movementId: string, newCategory: string) => void }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const style = getCategoryStyle(category);

  async function handleSelect(value: TaxCategory) {
    setSaving(true);
    try {
      const res = await fetch("/api/tax/classification", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ movementId, appliedTaxCategory: value, taxClassificationSource: "USER" }) });
      const json = await res.json();
      if (json.ok) onClassified(movementId, value);
    } finally { setSaving(false); setOpen(false); }
  }

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <button type="button" onClick={() => setOpen((p) => !p)} disabled={saving} style={{ padding: "2px 10px", borderRadius: "6px", fontSize: "0.75rem", fontWeight: 600, cursor: saving ? "wait" : "pointer", border: "1px solid transparent", background: style.bg, color: style.color, display: "flex", alignItems: "center", gap: "4px", whiteSpace: "nowrap" }}>
        {saving ? "Guardando…" : style.label}{!saving && <span style={{ fontSize: "0.625rem", opacity: 0.6 }}>▾</span>}
      </button>
      {open && (
        <>
          <div style={{ position: "fixed", inset: 0, zIndex: 40 }} onClick={() => setOpen(false)} />
          <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, zIndex: 50, background: "var(--bg-elev)", border: "1px solid var(--border)", borderRadius: "10px", boxShadow: "0 4px 16px rgba(15,42,61,0.12)", padding: "6px", minWidth: "170px" }}>
            {CATEGORIES.map((cat) => (
              <button key={cat.value} type="button" onClick={() => handleSelect(cat.value)} style={{ display: "block", width: "100%", textAlign: "left", padding: "6px 10px", borderRadius: "6px", fontSize: "0.8125rem", fontWeight: cat.value === category ? 700 : 400, color: cat.color, background: cat.value === category ? cat.bg : "transparent", border: "none", cursor: "pointer" }}>
                {cat.value === category ? `✓ ${cat.label}` : cat.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export function RevisionBlock() {
  const router = useRouter();
  const [events, setEvents] = useState<TaxEvent[]>([]);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [rebuilding, setRebuilding] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [symbolFilter, setSymbolFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<EventCategoryFilter>("ALL");

  async function fetchReview() {
    setLoading(true); setMessage(null);
    try {
      const res = await fetch("/api/tax/events");
      const json: TaxReviewResponse = await res.json();
      if (!json.ok || !json.data) { setEvents([]); setIssues([]); setMessage(json.message || "No fue posible cargar la revisión."); return; }
      setEvents(json.data.events || []); setIssues(json.data.issues || []);
    } catch { setEvents([]); setIssues([]); setMessage("Error cargando revisión tributaria."); } finally { setLoading(false); }
  }

  async function handleRebuild() {
    setRebuilding(true); setMessage(null);
    try {
      const res = await fetch("/api/tax/events/rebuild", { method: "POST" });
      const json: RebuildResponse = await res.json();
      if (!json.ok) { setMessage(json.message || "No fue posible reconstruir eventos."); return; }
      setMessage(json.message || "Eventos tributarios reconstruidos."); await fetchReview();
    } catch { setMessage("Error reconstruyendo eventos tributarios."); } finally { setRebuilding(false); }
  }

  function handleClassified(movementId: string, newCategory: string) {
    setEvents((prev) => prev.map((e) => e.movementId === movementId ? { ...e, effectiveTaxCategory: newCategory } : e));
  }

  useEffect(() => { fetchReview(); }, []);

  const sortedIssues: EnrichedIssue[] = useMemo(() => {
    const order: Record<IssueSeverity, number> = { HIGH: 0, MEDIUM: 1, LOW: 2 };
    return issues.map((i) => ({ ...i, severity: getSeverity(i.type) })).sort((a, b) => order[a.severity] - order[b.severity]);
  }, [issues]);

  const issueSummary = useMemo(() => ({
    HIGH: sortedIssues.filter((i) => i.severity === "HIGH").length,
    MEDIUM: sortedIssues.filter((i) => i.severity === "MEDIUM").length,
    LOW: sortedIssues.filter((i) => i.severity === "LOW").length,
  }), [sortedIssues]);

  const availableSymbols = useMemo(() => Array.from(new Set(events.map((e) => e.symbol).filter(Boolean))).sort(), [events]);

  const filteredEvents = useMemo(() => events.filter((e) => {
    if (symbolFilter && e.symbol.toUpperCase() !== symbolFilter.toUpperCase()) return false;
    if (categoryFilter !== "ALL" && e.effectiveTaxCategory !== categoryFilter) return false;
    return true;
  }).sort((a, b) => new Date(b.executedAt).getTime() - new Date(a.executedAt).getTime()), [events, symbolFilter, categoryFilter]);

  const taxTotals = useMemo(() => events.reduce((acc, e) => {
    acc.realizedPnlUsd += e.realizedPnlUsd || 0; acc.realizedPnlClp += e.realizedPnlClp || 0;
    if (e.effectiveTaxCategory === "CAPITAL_GAIN") acc.capitalGainCount++;
    if (e.effectiveTaxCategory === "ORDINARY_INCOME") acc.ordinaryIncomeCount++;
    if (e.effectiveTaxCategory === "NON_TAXABLE") acc.nonTaxableCount++;
    if (e.effectiveTaxCategory === "UNCLASSIFIED") acc.unclassifiedCount++;
    return acc;
  }, { realizedPnlUsd: 0, realizedPnlClp: 0, capitalGainCount: 0, ordinaryIncomeCount: 0, nonTaxableCount: 0, unclassifiedCount: 0 }), [events]);

  const taxHealth = useMemo(() => {
    if (issueSummary.HIGH > 0) return { status: "RISK" as TaxHealthStatus, title: "Riesgo tributario detectado", detail: "Existen problemas críticos que pueden afectar la base tributaria." };
    if (issueSummary.MEDIUM > 0 || issueSummary.LOW > 0) return { status: "REVIEW" as TaxHealthStatus, title: "Revisión requerida", detail: "Existen advertencias que deben revisarse antes de cerrar reportes." };
    if (events.length === 0) return { status: "REVIEW" as TaxHealthStatus, title: "Sin eventos tributarios", detail: "No existen eventos tributarios generados." };
    return { status: "OK" as TaxHealthStatus, title: "Revisión tributaria operativa", detail: "No se detectan problemas estructurales." };
  }, [issueSummary, events.length]);

  if (loading) return <section className="p-6"><div className={`${ui.card} p-4 text-sm text-slate-600`}>Cargando revisión tributaria…</div></section>;

  return (
    <section className={`${ui.page} text-slate-900`}>
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className={ui.title}>Revisión tributaria</h1>
          <p className={ui.label}>Centro de control para eventos tributarios reconstruidos desde movimientos.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button type="button" onClick={handleRebuild} disabled={rebuilding} className={`${ui.buttonPrimary} disabled:opacity-50`}>{rebuilding ? "Reconstruyendo…" : "Reconstruir eventos"}</button>
          <button type="button" onClick={() => router.push("/movements")} className={ui.buttonSecondary}>Ver movimientos</button>
        </div>
      </div>

      {message && <div className={`${ui.cardSoft} p-4 text-sm text-slate-700`}>{message}</div>}

      <div className={`${ui.cardSoft} p-4`}>
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-medium text-slate-900">{taxHealth.title}</p>
            <p className="mt-1 text-sm text-slate-600">{taxHealth.detail}</p>
          </div>
          <HealthBadge status={taxHealth.status} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
        {[{ label: "Eventos", value: events.length, color: "text-slate-950" }, { label: "Críticos", value: issueSummary.HIGH, color: "text-[var(--loss)]" }, { label: "Medios", value: issueSummary.MEDIUM, color: "text-[var(--warn)]" }, { label: "Bajos", value: issueSummary.LOW, color: "text-slate-950" }, { label: "Sin clasificar", value: taxTotals.unclassifiedCount, color: "text-slate-950" }].map((item) => (
          <div key={item.label} className={`${ui.card} p-4`}><p className={ui.label}>{item.label}</p><p className={`text-2xl font-semibold ${item.color}`}>{item.value}</p></div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className={`${ui.card} p-4`}><p className={ui.label}>Resultado realizado USD</p><p className={`text-2xl font-semibold ${taxTotals.realizedPnlUsd >= 0 ? "text-[var(--text-faint)]" : "text-[var(--text-soft)]"}`}>{formatUsd(taxTotals.realizedPnlUsd)}</p></div>
        <div className={`${ui.card} p-4`}><p className={ui.label}>Resultado realizado CLP</p><p className={`text-2xl font-semibold ${taxTotals.realizedPnlClp >= 0 ? "text-[var(--text-faint)]" : "text-[var(--text-soft)]"}`}>{formatClp(taxTotals.realizedPnlClp)}</p></div>
      </div>

      <div className="space-y-3">
        <div><h2 className="text-lg font-semibold text-slate-950">Problemas detectados</h2><p className={ui.label}>Ordenados por severidad. Resuelve primero los críticos.</p></div>
        {sortedIssues.length === 0 ? <div className={`${ui.card} p-4 text-sm text-slate-600`}>Sin problemas estructurales detectados.</div> : (
          <div className="overflow-auto rounded border border-slate-200 bg-white">
            <table className="min-w-full text-sm"><thead className="bg-slate-100 text-left text-slate-700"><tr><th className="p-2">Severidad</th><th className="p-2">Tipo</th><th className="p-2">Detalle</th><th className="p-2">Movimiento</th></tr></thead>
              <tbody>{sortedIssues.map((issue, idx) => (<tr key={`${issue.type}-${issue.movementId}-${idx}`} className="border-t border-slate-200"><td className="p-2"><SeverityBadge severity={issue.severity} /></td><td className="p-2">{getIssueTypeLabel(issue.type)}</td><td className="p-2">{issue.detail}</td><td className="p-2"><button type="button" onClick={() => router.push(`/movements?highlight=${issue.movementId}`)} className={`${ui.buttonSecondary} px-3 py-1 text-xs`}>Ver movimiento</button></td></tr>))}</tbody>
            </table>
          </div>
        )}
      </div>

      <div className={`${ui.card} space-y-4 p-4`}>
        <div><h2 className="text-lg font-semibold text-slate-950">Filtros de eventos</h2><p className={ui.label}>Filtra eventos sin alterar su origen ni sus cálculos.</p></div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="space-y-1"><label className="text-sm font-medium text-slate-800">Activo</label><select value={symbolFilter} onChange={(e) => setSymbolFilter(e.target.value)} className="w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700"><option value="">Todos</option>{availableSymbols.map((s) => (<option key={s} value={s}>{s}</option>))}</select></div>
          <div className="space-y-1"><label className="text-sm font-medium text-slate-800">Categoría</label><select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value as EventCategoryFilter)} className="w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700"><option value="ALL">Todas</option><option value="CAPITAL_GAIN">Mayor valor</option><option value="ORDINARY_INCOME">Renta ordinaria</option><option value="NON_TAXABLE">No afecto</option><option value="UNCLASSIFIED">Sin clasificar</option></select></div>
          <div className="flex items-end"><button type="button" onClick={() => { setSymbolFilter(""); setCategoryFilter("ALL"); }} className={ui.buttonSecondary}>Limpiar filtros</button></div>
        </div>
        <p className={ui.label}>Mostrando {filteredEvents.length} de {events.length} eventos.</p>
      </div>

      <div className="space-y-3">
        <div><h2 className="text-lg font-semibold text-slate-950">Eventos tributarios generados</h2><p className={ui.label}>Haz clic en la categoría para clasificar el evento.</p></div>
        {filteredEvents.length === 0 ? <div className={`${ui.card} p-4 text-sm text-slate-600`}>No hay eventos para los filtros seleccionados.</div> : (
          <div className="overflow-auto rounded border border-slate-200 bg-white">
            <table className="min-w-full text-sm"><thead className="bg-slate-100 text-left text-slate-700"><tr><th className="p-2">Fecha</th><th className="p-2">Activo</th><th className="p-2">Cantidad</th><th className="p-2">PnL USD</th><th className="p-2">PnL CLP</th><th className="p-2">Categoría</th><th className="p-2">Movimiento</th></tr></thead>
              <tbody>{filteredEvents.map((event) => (<tr key={event.id} className="border-t border-slate-200"><td className="p-2">{formatDate(event.executedAt)}</td><td className="p-2 font-medium text-slate-950">{event.symbol}</td><td className="p-2">{formatNumber(event.quantity)}</td><td className={`p-2 ${event.realizedPnlUsd >= 0 ? "text-[var(--text-faint)]" : "text-[var(--text-soft)]"}`}>{formatUsd(event.realizedPnlUsd)}</td><td className={`p-2 ${event.realizedPnlClp >= 0 ? "text-[var(--text-faint)]" : "text-[var(--text-soft)]"}`}>{formatClp(event.realizedPnlClp)}</td><td className="p-2"><CategoryBadge category={event.effectiveTaxCategory} movementId={event.movementId} onClassified={handleClassified} /></td><td className="p-2"><button type="button" onClick={() => router.push(`/movements?highlight=${event.movementId}`)} className={`${ui.buttonSecondary} px-3 py-1 text-xs`}>Ver movimiento</button></td></tr>))}</tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
