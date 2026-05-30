"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { httpClient } from "@/shared/http/httpClient";
import { AssetSearch } from "./AssetSearch";

type Position = { symbol: string; quantity: number; totalCostUsd: number; totalCostClp: number };
type PageData = { patrimonioClp: number; activos: number; costoUsd: number; dolar: number; estadoTributario: string; estadoAuditoria: string; hiddenAssets: string[]; posiciones: Position[] };
type ApiResponse = { ok: boolean; message: string };

const ASSET_META: Record<string, { name: string; mark: string; bg: string; fg: string }> = {
  XLM: { name: "Stellar", mark: "S", bg: "#EAF2FF", fg: "#2563EB" },
  XRP: { name: "Ripple", mark: "X", bg: "#EEF2F7", fg: "#111827" },
  POL: { name: "Polygon", mark: "P", bg: "#F3E8FF", fg: "#7C3AED" },
  MATIC: { name: "Polygon", mark: "P", bg: "#F3E8FF", fg: "#7C3AED" },
  ALGO: { name: "Algorand", mark: "A", bg: "#F1F5F9", fg: "#111827" },
  BTC: { name: "Bitcoin", mark: "B", bg: "#FFF7ED", fg: "#EA580C" },
  ETH: { name: "Ethereum", mark: "E", bg: "#EEF2FF", fg: "#4F46E5" },
  SOL: { name: "Solana", mark: "S", bg: "#ECFDF5", fg: "#059669" },
};

function meta(symbol: string) { return ASSET_META[symbol] ?? { name: symbol, mark: symbol.slice(0, 1), bg: "#F8FAFC", fg: "#0F2A3D" }; }
function clp(value: number) { return new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }).format(value || 0); }
function usd(value: number) { return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value || 0); }
function number(value: number) { return new Intl.NumberFormat("es-CL", { maximumFractionDigits: 8 }).format(value || 0); }
function resolveTaxStatus(status: string) { if (status === "OK") return "Al día"; if (status === "REVIEW") return "Revisión recomendada"; return "Atención requerida"; }

function Metric({ title, value, note }: { title: string; value: string; note: string }) {
  return <div style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 16, padding: "1rem" }}><p style={{ margin: "0 0 6px", color: "#64748B", fontSize: 11, fontWeight: 800, letterSpacing: "0.06em", textTransform: "uppercase" }}>{title}</p><p style={{ margin: "0 0 4px", color: "#0F2A3D", fontSize: "1.35rem", fontWeight: 800 }}>{value}</p><p style={{ margin: 0, color: "#94A3B8", fontSize: 12 }}>{note}</p></div>;
}

function Status({ title, value, note, href }: { title: string; value: string; note: string; href: string }) {
  return <section style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 16, padding: "1rem" }}><p style={{ margin: "0 0 6px", color: "#64748B", fontSize: 11, fontWeight: 800, letterSpacing: "0.06em", textTransform: "uppercase" }}>{title}</p><p style={{ margin: "0 0 4px", color: "#0F2A3D", fontSize: "1.15rem", fontWeight: 800 }}>{value}</p><p style={{ margin: "0 0 12px", color: "#475569", fontSize: "0.85rem" }}>{note}</p><Link href={href} style={{ color: "#0F2A3D", fontSize: "0.85rem", fontWeight: 800, textDecoration: "none" }}>Ver detalle</Link></section>;
}

export function ConsolidadoOverview() {
  const [data, setData] = useState<PageData | null>(null);
  const [error, setError] = useState("");
  const [secondaryLoading, setSecondaryLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [actingSymbol, setActingSymbol] = useState<string | null>(null);
  const [showHidden, setShowHidden] = useState(false);

  const loadSecondaryStatus = useCallback(async () => {
    setSecondaryLoading(true);
    try {
      const [taxResult, integrityResult] = await Promise.allSettled([
        fetch("/api/tax/health", { cache: "no-store" }).then((r) => r.json()),
        fetch("/api/tax/events/integrity", { cache: "no-store" }).then((r) => r.json()),
      ]);
      setData((current) => {
        if (!current) return current;
        let estadoTributario = current.estadoTributario;
        let estadoAuditoria = current.estadoAuditoria;
        if (taxResult.status === "fulfilled" && taxResult.value?.ok) estadoTributario = resolveTaxStatus(String(taxResult.value.data.status));
        if (integrityResult.status === "fulfilled" && integrityResult.value?.ok) {
          const s = integrityResult.value.data.summary;
          estadoAuditoria = Number(s.orphanEvents || 0) + Number(s.sellWithoutEvent || 0) > 0 ? "Revisión pendiente" : "Consistente";
        }
        return { ...current, estadoTributario, estadoAuditoria };
      });
    } finally { setSecondaryLoading(false); }
  }, []);

  const load = useCallback(async () => {
    try {
      setError("");
      const res = await fetch("/api/portfolio", { cache: "no-store" });
      const json = await res.json();
      if (!json.ok) throw new Error(json.message || "No se pudo cargar el patrimonio.");
      setData({ patrimonioClp: json.data.totals.totalCostClp, activos: json.data.totals.symbolCount, costoUsd: json.data.totals.totalCostUsd, dolar: json.data.fx.usdToClp, estadoTributario: "Calculando...", estadoAuditoria: "Calculando...", hiddenAssets: Array.isArray(json.data.hiddenAssets) ? json.data.hiddenAssets : [], posiciones: [...json.data.positions].sort((a: Position, b: Position) => b.totalCostClp - a.totalCostClp).slice(0, 8) });
      void loadSecondaryStatus();
    } catch (err) { setError(err instanceof Error ? err.message : "No se pudo cargar el consolidado."); }
  }, [loadSecondaryStatus]);

  useEffect(() => { void load(); }, [load]);

  async function hideAsset(symbol: string) {
    if (actingSymbol) return;
    const reason = window.prompt(`Motivo para ocultar ${symbol} del consolidado:`);
    const cleanReason = String(reason ?? "").trim();
    if (!cleanReason) { setMessage("Acción cancelada. El motivo es obligatorio."); return; }
    setActingSymbol(symbol); setMessage("");
    try {
      const response = await httpClient<ApiResponse>(`/api/portfolio/assets/${encodeURIComponent(symbol)}`, { method: "DELETE", body: { reason: cleanReason } });
      setMessage(response.message || `Activo ${symbol} ocultado.`);
      await load();
    } catch (err) { setMessage(err instanceof Error ? err.message : `No fue posible ocultar ${symbol}.`); }
    finally { setActingSymbol(null); }
  }

  async function restoreAsset(symbol: string) {
    if (actingSymbol) return;
    setActingSymbol(symbol); setMessage("");
    try {
      const response = await httpClient<ApiResponse>(`/api/portfolio/assets/${encodeURIComponent(symbol)}`, { method: "PATCH" });
      setMessage(response.message || `Activo ${symbol} restaurado.`);
      await load();
    } catch (err) { setMessage(err instanceof Error ? err.message : `No fue posible restaurar ${symbol}.`); }
    finally { setActingSymbol(null); }
  }

  if (error) return <p style={{ color: "#DC2626", fontWeight: 700 }}>{error}</p>;
  if (!data) return <p style={{ color: "#64748B" }}>Cargando consolidado...</p>;

  return <div style={{ maxWidth: 1180 }}>
    <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", marginBottom: "1.5rem", flexWrap: "wrap" }}><div><h1 style={{ margin: "0 0 4px", color: "#0F2A3D", fontSize: "1.5rem", fontWeight: 800 }}>Consolidado</h1><p style={{ margin: 0, color: "#64748B", fontSize: "0.92rem" }}>Resumen general de tu patrimonio, actividad financiera y estado tributario.</p></div><Link href="/integraciones" style={{ background: "#0F2A3D", color: "#fff", borderRadius: 10, padding: "0.7rem 1rem", fontWeight: 800, textDecoration: "none" }}>Administrar conexiones</Link></div>
    {message && <div style={{ background: "#F8FAFC", border: "1px solid #CBD5E1", borderRadius: 12, color: "#334155", fontSize: "0.85rem", fontWeight: 700, marginBottom: "1rem", padding: "0.85rem 1rem" }}>{message}</div>}
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginBottom: "1.5rem" }}><Metric title="Patrimonio estimado" value={clp(data.patrimonioClp)} note="Valor calculado con la información disponible." /><Metric title="Activos" value={String(data.activos)} note="Activos visibles en el consolidado." /><Metric title="Costo total USD" value={usd(data.costoUsd)} note="Base de costo histórica visible." /><Metric title="Dólar usado" value={clp(data.dolar)} note="Referencia para mostrar valores en pesos." /></div>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 12, marginBottom: "1.5rem" }}><Status title="Estado tributario" value={data.estadoTributario} note={secondaryLoading ? "Validando estado tributario..." : "Revisión general de tu situación tributaria."} href="/tributario" /><Status title="Estado de auditoría" value={data.estadoAuditoria} note={secondaryLoading ? "Validando consistencia..." : "Consistencia de la información procesada."} href="/auditoria" /><Status title="Conexiones" value="Fuentes de datos" note="Bancos, exchanges y billeteras conectadas." href="/integraciones" /></div>
    <AssetSearch onMovementCreated={load} />

    <section id="activos-principales" style={{ background: "#fff", border: "1px solid #DDE7F3", borderRadius: 22, padding: "1.2rem", boxShadow: "0 16px 40px rgba(15,42,61,.05)", scrollMarginTop: 96 }}>
      <div style={{ alignItems: "center", display: "flex", justifyContent: "space-between", gap: 16, marginBottom: "1.2rem", flexWrap: "wrap" }}><div style={{ alignItems: "center", display: "flex", gap: 14 }}><div style={{ alignItems: "center", background: "#EEF4FF", borderRadius: 999, color: "#2563EB", display: "flex", fontWeight: 900, height: 46, justifyContent: "center", width: 46 }}>☆</div><div><h2 style={{ margin: 0, color: "#0F2A3D", fontSize: "1.25rem", fontWeight: 900 }}>Activos principales</h2><p style={{ margin: "4px 0 0", color: "#7C8BA1", fontSize: ".9rem" }}>Detalle resumido de los saldos calculados.</p></div></div>{data.hiddenAssets.length > 0 && <button onClick={() => setShowHidden((v) => !v)} type="button" style={{ background: "#fff", border: "1px solid #BFD0E6", borderRadius: 12, color: "#536987", cursor: "pointer", fontWeight: 800, padding: ".7rem 1rem" }}>{showHidden ? "Ocultar lista" : "Ver activos ocultos"}</button>}</div>
      <div style={{ background: "#F8FAFC", border: "1px solid #DDE7F3", borderRadius: 14, display: "grid", gridTemplateColumns: "1.6fr 1fr 1fr 1fr 1.2fr", padding: ".9rem 1rem", color: "#53627A", fontSize: ".75rem", fontWeight: 900, letterSpacing: ".04em", textTransform: "uppercase" }}><span>Activo</span><span>Cantidad</span><span>Costo USD</span><span>Costo CLP</span><span style={{ textAlign: "right" }}>Acciones</span></div>
      <div style={{ display: "grid", gap: 10, marginTop: 10 }}>{data.posiciones.length === 0 ? <div style={{ border: "1px solid #E2E8F0", borderRadius: 16, padding: "2rem", textAlign: "center", color: "#64748B" }}>No hay activos visibles en el consolidado.</div> : data.posiciones.map((position) => { const asset = meta(position.symbol); const isActing = actingSymbol === position.symbol; return <div key={position.symbol} style={{ alignItems: "center", border: "1px solid #E2E8F0", borderRadius: 16, display: "grid", gap: 12, gridTemplateColumns: "1.6fr 1fr 1fr 1fr 1.2fr", padding: "1rem", color: "#0F172A" }}><div style={{ alignItems: "center", display: "flex", gap: 12 }}><div style={{ alignItems: "center", background: asset.bg, borderRadius: 999, color: asset.fg, display: "flex", fontWeight: 900, height: 46, justifyContent: "center", width: 46 }}>{asset.mark}</div><div><p style={{ margin: 0, color: "#0F172A", fontSize: "1rem", fontWeight: 900 }}>{position.symbol}</p><p style={{ margin: "3px 0 0", color: "#718096", fontSize: ".86rem" }}>{asset.name}</p></div></div><div>{number(position.quantity)}</div><div>{usd(position.totalCostUsd)}</div><div style={{ fontWeight: 900 }}>{clp(position.totalCostClp)}</div><div style={{ textAlign: "right" }}><button type="button" onClick={() => void hideAsset(position.symbol)} disabled={Boolean(actingSymbol)} style={{ background: isActing ? "#F1F5F9" : "#fff", border: "1px solid #EF4444", borderRadius: 10, color: isActing ? "#94A3B8" : "#DC2626", cursor: actingSymbol ? "not-allowed" : "pointer", fontWeight: 900, padding: ".65rem .9rem" }}>{isActing ? "Ocultando..." : "Ocultar activo"}</button></div></div>; })}</div>
      <div style={{ alignItems: "center", background: "#F8FAFC", border: "1px solid #DDE7F3", borderRadius: 14, color: "#536987", display: "flex", gap: 12, marginTop: "1.2rem", padding: "1rem" }}><strong style={{ color: "#2563EB" }}>i</strong><div><p style={{ margin: 0, fontWeight: 800 }}>Al ocultar un activo, se excluye del consolidado.</p><p style={{ margin: "4px 0 0" }}>Esto no elimina ni modifica tus movimientos históricos.</p></div></div>
    </section>

    {showHidden && data.hiddenAssets.length > 0 && <section style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 18, marginTop: "1rem", padding: "1rem" }}><h2 style={{ margin: "0 0 .75rem", color: "#0F2A3D", fontSize: "1rem", fontWeight: 900 }}>Activos ocultos</h2><div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>{data.hiddenAssets.map((symbol) => { const isActing = actingSymbol === symbol; return <div key={symbol} style={{ alignItems: "center", background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 14, display: "flex", justifyContent: "space-between", padding: ".85rem" }}><strong>{symbol}</strong><button type="button" onClick={() => void restoreAsset(symbol)} disabled={Boolean(actingSymbol)} style={{ background: isActing ? "#94A3B8" : "#0F2A3D", border: "none", borderRadius: 999, color: "#fff", cursor: actingSymbol ? "not-allowed" : "pointer", fontWeight: 900, padding: ".45rem .75rem" }}>{isActing ? "Restaurando..." : "Restaurar"}</button></div>; })}</div></section>}
  </div>;
}
