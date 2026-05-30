"use client";

import { useCallback, useEffect, useState } from "react";
import { httpClient } from "@/shared/http/httpClient";
import { AssetLogo } from "./AssetLogo";
import { AssetSearch } from "./AssetSearch";

type Position = { symbol: string; quantity: number; totalCostUsd: number; totalCostClp: number };
type Portfolio = { totals: { totalCostClp: number; totalCostUsd: number; symbolCount: number }; fx: { usdToClp: number }; positions: Position[]; hiddenAssets?: string[] };
const names: Record<string, string> = { XLM: "Stellar", XRP: "Ripple", POL: "Polygon", MATIC: "Polygon", ALGO: "Algorand", BTC: "Bitcoin", ETH: "Ethereum", SOL: "Solana" };
const clp = (v: number) => new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }).format(v || 0);
const usd = (v: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(v || 0);
const num = (v: number) => new Intl.NumberFormat("es-CL", { maximumFractionDigits: 8 }).format(v || 0);

function Metric({ label, value, note }: { label: string; value: string; note: string }) {
  return <div className="rounded-2xl border border-slate-200 bg-white p-4"><p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">{label}</p><p className="mt-1 text-xl font-extrabold text-slate-900">{value}</p><p className="mt-1 text-xs text-slate-400">{note}</p></div>;
}

function AssetCard({ p, busy, onHide }: { p: Position; busy: boolean; onHide: (s: string) => void }) {
  const name = names[p.symbol] ?? p.symbol;
  return <div className="grid grid-cols-1 items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 md:grid-cols-[1.7fr_1fr_1fr_1fr_1.1fr]">
    <div className="flex items-center gap-3"><AssetLogo symbol={p.symbol} /><div><p className="font-extrabold text-slate-950">{p.symbol}</p><p className="text-sm text-slate-500">{name}</p></div></div>
    <div><p className="text-xs font-bold uppercase text-slate-400 md:hidden">Cantidad</p><p className="text-sm text-slate-800">{num(p.quantity)}</p></div>
    <div><p className="text-xs font-bold uppercase text-slate-400 md:hidden">Costo USD</p><p className="text-sm text-slate-800">{usd(p.totalCostUsd)}</p></div>
    <div><p className="text-xs font-bold uppercase text-slate-400 md:hidden">Costo CLP</p><p className="text-sm font-extrabold text-slate-950">{clp(p.totalCostClp)}</p></div>
    <div className="md:text-right"><button type="button" disabled={busy} onClick={() => onHide(p.symbol)} className="rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-extrabold text-red-600 disabled:cursor-not-allowed disabled:opacity-50">{busy ? "Ocultando..." : "Ocultar activo"}</button></div>
  </div>;
}

export function ConsolidadoOverviewFinal() {
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [showHidden, setShowHidden] = useState(false);

  const load = useCallback(async () => {
    setError("");
    const res = await fetch("/api/portfolio", { cache: "no-store" });
    const json = await res.json();
    if (!json.ok) throw new Error(json.message || "No se pudo cargar el consolidado.");
    setPortfolio({ ...json.data, positions: [...json.data.positions].sort((a: Position, b: Position) => b.totalCostClp - a.totalCostClp).slice(0, 8) });
  }, []);

  useEffect(() => { void load().catch((e) => setError(e instanceof Error ? e.message : "Error cargando consolidado.")); }, [load]);

  async function hide(symbol: string) {
    const reason = window.prompt(`Motivo para ocultar ${symbol} del consolidado:`)?.trim();
    if (!reason) { setMessage("Acción cancelada. El motivo es obligatorio."); return; }
    setBusy(symbol); setMessage("");
    try { const r = await httpClient<{ message: string }>(`/api/portfolio/assets/${encodeURIComponent(symbol)}`, { method: "DELETE", body: { reason } }); setMessage(r.message); await load(); }
    catch (e) { setMessage(e instanceof Error ? e.message : "No fue posible ocultar el activo."); }
    finally { setBusy(null); }
  }

  async function restore(symbol: string) {
    setBusy(symbol); setMessage("");
    try { const r = await httpClient<{ message: string }>(`/api/portfolio/assets/${encodeURIComponent(symbol)}`, { method: "PATCH" }); setMessage(r.message); await load(); }
    catch (e) { setMessage(e instanceof Error ? e.message : "No fue posible restaurar el activo."); }
    finally { setBusy(null); }
  }

  if (error) return <p className="font-bold text-red-600">{error}</p>;
  if (!portfolio) return <p className="text-slate-500">Cargando consolidado...</p>;
  const hidden = portfolio.hiddenAssets ?? [];

  return <div className="max-w-[1180px] space-y-6">
    <div className="flex flex-wrap items-start justify-between gap-4"><div><h1 className="text-2xl font-extrabold text-slate-950">Consolidado</h1><p className="text-sm text-slate-500">Resumen general de tu patrimonio, actividad financiera y estado tributario.</p></div><a href="/integraciones" className="rounded-xl bg-slate-900 px-4 py-3 text-sm font-extrabold text-white no-underline">Administrar conexiones</a></div>
    {message && <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm font-bold text-slate-700">{message}</div>}
    <div className="grid grid-cols-1 gap-3 md:grid-cols-4"><Metric label="Patrimonio estimado" value={clp(portfolio.totals.totalCostClp)} note="Valor calculado con la información disponible." /><Metric label="Activos" value={String(portfolio.totals.symbolCount)} note="Activos visibles en el consolidado." /><Metric label="Costo total USD" value={usd(portfolio.totals.totalCostUsd)} note="Base de costo histórica visible." /><Metric label="Dólar usado" value={clp(portfolio.fx.usdToClp)} note="Referencia para mostrar valores en pesos." /></div>
    <AssetSearch onMovementCreated={load} />
    <section className="rounded-[22px] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4"><div className="flex items-center gap-4"><div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-xl font-black text-blue-600">☆</div><div><h2 className="text-xl font-extrabold text-slate-950">Activos principales</h2><p className="text-sm text-slate-500">Detalle resumido de los saldos calculados.</p></div></div><button type="button" onClick={() => setShowHidden(!showHidden)} className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-extrabold text-slate-600">{showHidden ? "Ocultar activos ocultos" : "Ver activos ocultos"}</button></div>
      <div className="mb-3 hidden grid-cols-[1.7fr_1fr_1fr_1fr_1.1fr] rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-black uppercase tracking-wider text-slate-500 md:grid"><span>Activo</span><span>Cantidad</span><span>Costo USD</span><span>Costo CLP</span><span className="text-right">Acciones</span></div>
      <div className="space-y-3">{portfolio.positions.length ? portfolio.positions.map((p) => <AssetCard key={p.symbol} p={p} busy={busy === p.symbol} onHide={hide} />) : <div className="rounded-2xl border border-slate-200 p-8 text-center text-slate-500">No hay activos visibles en el consolidado.</div>}</div>
      <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600"><strong className="text-blue-600">i</strong> Al ocultar un activo se excluye del consolidado. Esto no elimina ni modifica tus movimientos históricos.</div>
    </section>
    {showHidden && <section className="rounded-2xl border border-slate-200 bg-white p-5"><h2 className="mb-3 font-extrabold text-slate-950">Activos ocultos</h2>{hidden.length ? <div className="grid grid-cols-1 gap-3 md:grid-cols-3">{hidden.map((s) => <div key={s} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-3"><div className="flex items-center gap-3"><AssetLogo symbol={s} /><div><p className="font-extrabold text-slate-950">{s}</p><p className="text-xs text-slate-500">{names[s] ?? s}</p></div></div><button type="button" disabled={!!busy} onClick={() => void restore(s)} className="rounded-full bg-slate-900 px-3 py-2 text-xs font-extrabold text-white disabled:opacity-50">Restaurar</button></div>)}</div> : <p className="text-sm text-slate-500">No hay activos ocultos.</p>}</section>}
  </div>;
}
