"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ui } from "@/styles/design-system";

type LedgerEntry = {
  id: string;
  taxYear: number;
  taxMonth: number;
  executedAt: string | null;
  ledgerType: string;
  ledgerCategory: string;
  assetSymbol: string;
  quantity: number;
  proceedsClp: number;
  costBasisClp: number;
  realizedGainClp: number;
  taxTreatment: string;
  siiClassification: string;
  source: string;
  movementId: string | null;
  taxEventId: string | null;
  createdAt: string;
};

type YearTotals = { proceedsClp: number; costBasisClp: number; realizedGainClp: number; count: number };

type LedgerResponse = { ok: boolean; message: string; data: { entries: LedgerEntry[]; totals: Record<number, YearTotals>; taxYear: number | null } | null };
type RebuildResponse = { ok: boolean; message: string; data: { created: number; taxYear: number | null } | null };

function clpFormat(n: number) {
  return new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }).format(n);
}

function dateFormat(value: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("es-CL", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function siiBadge(cls: string) {
  if (cls === "MAYOR_VALOR") return <span className="inline-flex rounded-full px-2 py-0.5 text-xs font-medium bg-green-50 text-green-700 border border-green-200">Mayor Valor</span>;
  if (cls === "MENOR_VALOR") return <span className="inline-flex rounded-full px-2 py-0.5 text-xs font-medium bg-red-50 text-red-700 border border-red-200">Menor Valor</span>;
  return <span className="inline-flex rounded-full px-2 py-0.5 text-xs font-medium bg-slate-100 text-slate-500 border border-slate-200">Neutro</span>;
}

function sourceBadge(source: string) {
  if (source === "SYSTEM") return <span className="text-xs text-slate-400">Sistema</span>;
  if (source === "MANUAL") return <span className="text-xs font-medium text-amber-600">Manual</span>;
  if (source === "ACCOUNTANT") return <span className="text-xs font-medium text-purple-600">Contador</span>;
  return <span className="text-xs text-slate-400">{source}</span>;
}

export function LedgerBlock() {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(String(currentYear));
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [totals, setTotals] = useState<Record<number, YearTotals>>({});
  const [loading, setLoading] = useState(true);
  const [rebuilding, setRebuilding] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ text: string; ok: boolean } | null>(null);
  const toastRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const years = useMemo(() => Array.from({ length: currentYear - 2022 }, (_, i) => String(currentYear - i)), [currentYear]);
  const exportBase = year ? `?year=${year}` : "";
  const csvUrl = `/api/tax/ledger/export/csv${exportBase}`;
  const pdfUrl = `/api/tax/ledger/export/pdf${exportBase}`;

  function showToast(text: string, ok = true) {
    if (toastRef.current) clearTimeout(toastRef.current);
    setToast({ text, ok });
    toastRef.current = setTimeout(() => setToast(null), 2500);
  }

  const fetchLedger = useCallback(async (selectedYear: string) => {
    try {
      setLoading(true); setPageError(null);
      const params = selectedYear ? `?year=${selectedYear}&limit=1000` : "?limit=1000";
      const res = await fetch(`/api/tax/ledger${params}`, { credentials: "include", cache: "no-store" });
      const json = (await res.json()) as LedgerResponse;
      if (!res.ok || !json.ok || !json.data) throw new Error(json.message || "Error al cargar el ledger.");
      setEntries(json.data.entries); setTotals(json.data.totals);
    } catch (err) {
      setPageError(err instanceof Error ? err.message : "Error al cargar el ledger tributario.");
      setEntries([]); setTotals({});
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { void fetchLedger(year); return () => { if (toastRef.current) clearTimeout(toastRef.current); }; }, [fetchLedger, year]);

  async function handleRebuild() {
    try {
      setRebuilding(true);
      const body = year ? JSON.stringify({ year: Number(year) }) : "{}";
      const res = await fetch("/api/tax/ledger/rebuild", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body });
      const json = (await res.json()) as RebuildResponse;
      if (!res.ok || !json.ok) throw new Error(json.message || "Error al reconstruir.");
      showToast(`Ledger reconstruido: ${json.data?.created ?? 0} asientos generados.`);
      await fetchLedger(year);
    } catch (err) { showToast(err instanceof Error ? err.message : "Error al reconstruir el ledger.", false); } finally { setRebuilding(false); }
  }

  const yearNum = Number(year);
  const periodTotals: YearTotals = totals[yearNum] ?? { proceedsClp: 0, costBasisClp: 0, realizedGainClp: 0, count: 0 };
  const mayorCount = entries.filter((e) => e.siiClassification === "MAYOR_VALOR").length;
  const menorCount = entries.filter((e) => e.siiClassification === "MENOR_VALOR").length;
  const gainColor = periodTotals.realizedGainClp >= 0 ? "text-green-700" : "text-red-700";

  return (
    <div className="space-y-6">
      {toast && <div className={`fixed right-4 top-4 z-50 rounded-md px-4 py-2 text-sm shadow-md ${toast.ok ? ui.alertOk : ui.alertRisk}`}>{toast.text}</div>}

      <section className={`${ui.card} p-5`}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className={ui.title}>Libro Tributario de Criptoactivos</h1>
            <p className={ui.subtitle}>Chile — Servicio de Impuestos Internos · Método FIFO · Valores en CLP</p>
          </div>
          <div className="flex flex-wrap items-end gap-2">
            <label className="flex flex-col gap-1 text-sm text-slate-700"><span>Período tributario</span>
              <select value={year} onChange={(e) => setYear(e.target.value)} className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500">
                <option value="">Todos</option>{years.map((y) => (<option key={y} value={y}>{y}</option>))}
              </select>
            </label>
            <button type="button" onClick={handleRebuild} disabled={rebuilding || loading} className={`${ui.buttonSecondary} h-10`} title="Regenera los asientos SYSTEM">{rebuilding ? "Reconstruyendo…" : "↺ Reconstruir"}</button>
            <a href={csvUrl} className={`${ui.buttonSecondary} h-10`} download>CSV</a>
            <a href={pdfUrl} className={`${ui.buttonDark} h-10`} target="_blank" rel="noopener noreferrer">PDF</a>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {[{ label: "Ingresos brutos CLP", value: clpFormat(periodTotals.proceedsClp), color: "text-slate-950" }, { label: "Costo tributario CLP", value: clpFormat(periodTotals.costBasisClp), color: "text-slate-950" }, { label: "Mayor valor neto CLP", value: clpFormat(periodTotals.realizedGainClp), color: gainColor }, { label: "Operaciones", value: String(periodTotals.count), color: "text-slate-950" }, { label: "Mayor / Menor valor", value: `${mayorCount} / ${menorCount}`, color: "text-slate-950" }].map(({ label, value, color }) => (
          <article key={label} className={`${ui.card} p-5`}><p className={ui.label}>{label}</p><p className={`mt-2 text-xl font-semibold tabular-nums ${color}`}>{value}</p></article>
        ))}
      </section>

      {pageError && <div className={`rounded-md px-4 py-3 text-sm ${ui.alertRisk}`}>{pageError}</div>}

      <section className={`${ui.card} p-5`}>
        <div className="mb-4 flex items-center justify-between gap-2">
          <div><h2 className="text-base font-semibold text-slate-950">Detalle de enajenaciones</h2><p className={ui.label}>{entries.length} asientos</p></div>
          {loading && <span className={ui.label}>Cargando…</span>}
        </div>
        {!loading && entries.length === 0 && !pageError && <div className={`${ui.cardSoft} px-4 py-6 text-sm text-slate-600`}>No hay asientos para el período seleccionado. Usa "Reconstruir" para generar el ledger.</div>}
        {entries.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-0 text-sm">
              <thead><tr className="text-left text-xs uppercase tracking-wide text-slate-500">{["Fecha", "Activo", "Tipo tributario", "Clasificación SII", "Ingresos CLP", "Costo CLP", "Mayor Valor CLP", "Origen"].map((h) => (<th key={h} className="border-b border-slate-200 px-3 py-3 font-medium whitespace-nowrap">{h}</th>))}</tr></thead>
              <tbody>{entries.map((e, idx) => {
                const gainCls = e.realizedGainClp >= 0 ? "text-green-700 font-medium" : "text-red-700 font-medium";
                return (
                  <tr key={e.id} className={idx % 2 === 0 ? "bg-white" : "bg-slate-50/60"}>
                    <td className="border-b border-slate-100 px-3 py-2.5 text-slate-600 whitespace-nowrap">{dateFormat(e.executedAt)}</td>
                    <td className="border-b border-slate-100 px-3 py-2.5 font-medium text-slate-900 whitespace-nowrap">{e.assetSymbol}</td>
                    <td className="border-b border-slate-100 px-3 py-2.5 text-slate-600 whitespace-nowrap">{e.ledgerCategory === "ENAJENACION_ACTIVO_DIGITAL" ? "Enajenación" : e.ledgerCategory}</td>
                    <td className="border-b border-slate-100 px-3 py-2.5">{siiBadge(e.siiClassification)}</td>
                    <td className="border-b border-slate-100 px-3 py-2.5 text-right tabular-nums text-slate-700 whitespace-nowrap">{clpFormat(e.proceedsClp)}</td>
                    <td className="border-b border-slate-100 px-3 py-2.5 text-right tabular-nums text-slate-700 whitespace-nowrap">{clpFormat(e.costBasisClp)}</td>
                    <td className={`border-b border-slate-100 px-3 py-2.5 text-right tabular-nums whitespace-nowrap ${gainCls}`}>{clpFormat(e.realizedGainClp)}</td>
                    <td className="border-b border-slate-100 px-3 py-2.5">{sourceBadge(e.source)}</td>
                  </tr>
                );
              })}</tbody>
            </table>
          </div>
        )}
      </section>

      <p className="text-center text-xs text-slate-400">Los valores son estimaciones calculadas mediante el método FIFO con tipo de cambio mindicador.cl. Este documento no constituye asesoría tributaria profesional.</p>
    </div>
  );
}
