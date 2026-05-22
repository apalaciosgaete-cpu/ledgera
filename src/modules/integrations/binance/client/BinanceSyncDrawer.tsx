"use client";

import { useCallback, useEffect, useState } from "react";
import { fonts } from "@/styles/tokens";
import { httpClient, isHttpClientError } from "@/shared/http/httpClient";

// ── Types ──────────────────────────────────────────────────────────────────────

type ConnectionStatus = {
  connected:       boolean;
  status?:         string;
  syncStatus?:     string | null;
  lastSyncAt?:     string | null;
  lastSyncStatus?: string | null;
  lastSyncError?:  string | null;
  pendingCount?:   number;
  apiKeyHint?:     string;
};

type SyncResult = {
  imported:        number;
  skipped:         number;
  autoConfirmed:   number;
  pendingReview:   number;
  taxRebuilt:      boolean;
  errors:          string[];
  allPeriodsSynced?: boolean;
};

type SyncPeriod = {
  id:            string;
  year:          number;
  month:         number;
  status:        string;
  importedCount: number;
  errorCount:    number;
  finishedAt:    string | null;
};

type CalendarData = {
  periods:        SyncPeriod[];
  totalPending:   number;
  totalCompleted: number;
  totalFailed:    number;
  nextPeriod:     { year: number; month: number } | null;
};

type ImportRecord = {
  id:                  string;
  externalId:          string;
  externalType:        string;
  normalizedJson:      string | null;
  normalizedEventType: string | null;
  taxTreatment:        string | null;
  inventoryEffect:     string | null;
  economicEffect:      string | null;
  status:              string;
  occurredAt:          string;
};

type NormalizedJson = { movementType: string; symbol: string; quantity: number; priceUsd: number; feeUsd: number };
type ApiResponse<T> = { ok: boolean; message: string; data: T };

// ── Calendar components ────────────────────────────────────────────────────────

const MONTH_ABBR = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
const MONTH_NAME: Record<number, string> = {
  1:"enero",2:"febrero",3:"marzo",4:"abril",5:"mayo",6:"junio",
  7:"julio",8:"agosto",9:"septiembre",10:"octubre",11:"noviembre",12:"diciembre",
};

function pillStyle(p: SyncPeriod) {
  switch (p.status) {
    case "COMPLETED": return { bg: "rgba(22,163,74,0.12)", border: "rgba(22,163,74,0.25)", color: "#4ADE80", value: p.importedCount > 0 ? (p.importedCount > 99 ? "99+" : String(p.importedCount)) : "✓" };
    case "EMPTY":     return { bg: "rgba(255,255,255,0.02)", border: "rgba(255,255,255,0.07)", color: "#334155", value: "—" };
    case "FAILED":    return { bg: "rgba(239,68,68,0.08)", border: "rgba(239,68,68,0.25)", color: "#F87171", value: "✗" };
    case "RUNNING":   return { bg: "rgba(240,185,11,0.08)", border: "rgba(240,185,11,0.25)", color: "#F0B90B", value: "…" };
    default:          return { bg: "rgba(255,255,255,0.02)", border: "rgba(255,255,255,0.07)", color: "#475569", value: "○" };
  }
}

function MonthPill({ label, period, onClick, syncing }: { label: string; period?: SyncPeriod; onClick?: () => void; syncing?: boolean }) {
  if (!period) return (
    <span title={label} style={{ width: "32px", height: "38px", display: "inline-flex", flexDirection: "column", alignItems: "center", justifyContent: "center", borderRadius: "5px", border: "1px dashed rgba(255,255,255,0.04)", flexShrink: 0 }}>
      <span style={{ fontSize: "9px", color: "#1e293b" }}>{label}</span>
    </span>
  );
  const s = pillStyle(period);
  const isLoading = syncing;
  return (
    <span
      onClick={onClick}
      title={`${label}: ${period.status}${period.importedCount > 0 ? ` · ${period.importedCount} op.` : ""}${onClick ? " — clic para re-sincronizar" : ""}`}
      style={{ width: "32px", height: "38px", display: "inline-flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "2px", borderRadius: "5px", background: isLoading ? "rgba(240,185,11,0.15)" : s.bg, border: `1px solid ${isLoading ? "rgba(240,185,11,0.5)" : s.border}`, flexShrink: 0, cursor: onClick ? "pointer" : "default", transition: "opacity 0.15s" }}
    >
      <span style={{ fontSize: "9px", color: "#64748B", lineHeight: 1 }}>{label}</span>
      <span style={{ fontSize: "10px", fontWeight: 700, color: isLoading ? "#F0B90B" : s.color, lineHeight: 1, animation: isLoading ? "bn-blink 1s ease-in-out infinite" : "none" }}>
        {isLoading ? "…" : s.value}
      </span>
    </span>
  );
}

const CALENDAR_START_YEAR = 2018;

function SyncCalendarGrid({ periods, onSyncMonth, syncingMonth }: {
  periods: SyncPeriod[];
  onSyncMonth?: (year: number, month: number) => void;
  syncingMonth?: { year: number; month: number } | null;
}) {
  const byYear = new Map<number, Map<number, SyncPeriod>>();
  for (const p of periods) {
    if (!byYear.has(p.year)) byYear.set(p.year, new Map());
    byYear.get(p.year)!.set(p.month, p);
  }

  const currentYear  = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  const years: number[] = [];
  for (let y = currentYear; y >= CALENDAR_START_YEAR; y--) years.push(y);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      {years.map(year => {
        const monthMap = byYear.get(year);
        const maxMonth = year === currentYear ? currentMonth : 12;
        return (
          <div key={year} style={{ display: "flex", alignItems: "center", gap: "4px", flexWrap: "nowrap" }}>
            <span style={{ fontSize: "11px", fontWeight: 700, color: "#475569", minWidth: "32px", textAlign: "right", flexShrink: 0 }}>{year}</span>
            {MONTH_ABBR.map((label, i) => {
              const month = i + 1;
              if (month > maxMonth) return (
                <span key={i} style={{ width: "32px", height: "38px", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <span style={{ fontSize: "9px", color: "#1e293b" }}>{label}</span>
                </span>
              );
              const isSyncing = syncingMonth?.year === year && syncingMonth?.month === month;
              return (
                <MonthPill
                  key={i}
                  label={label}
                  period={monthMap?.get(month)}
                  onClick={onSyncMonth ? () => onSyncMonth(year, month) : undefined}
                  syncing={isSyncing}
                />
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function reviewReason(r: ImportRecord): string {
  const ev = r.normalizedEventType ?? "UNKNOWN";
  if (ev === "UNKNOWN")          return "Tipo de evento no reconocido por LEDGERA.";
  if (ev === "DUST_CONVERSION")  return "Conversión de polvo: involucra múltiples activos simultáneos.";
  if (ev === "CONVERT")          return "Conversión equivale a venta + compra simultánea — requiere asignar precio justo a cada tramo.";
  if (ev === "STAKING_REWARD")   return "Renta por staking: tratamiento bajo normativa SII requiere revisión.";
  if (ev === "EARN_REWARD")      return "Renta por Earn/Launchpool: clasificación tributaria pendiente.";
  if (ev === "P2P")              return "Operación P2P: requiere verificar precio de mercado en la fecha.";
  if (ev === "FUNDING")          return "Funding fee de futuros: tratamiento como gasto financiero.";
  if (r.taxTreatment === "REVIEW")   return "El tratamiento tributario de este evento es ambiguo.";
  if (r.inventoryEffect === "REVIEW") return "El impacto en inventario FIFO no puede determinarse automáticamente.";
  return "Evento marcado para revisión manual.";
}

function taxTreatmentLabel(tt: string | null): { label: string; color: string } {
  const map: Record<string, { label: string; color: string }> = {
    ACQUISITION: { label: "Adquisición",  color: "#4ADE80" },
    DISPOSAL:    { label: "Enajenación",  color: "#F87171" },
    INCOME:      { label: "Renta",        color: "#A78BFA" },
    EXPENSE:     { label: "Gasto",        color: "#FCD34D" },
    NEUTRAL:     { label: "Neutro",       color: "#64748B" },
    REVIEW:      { label: "⚠ Revisar",   color: "#F59E0B" },
  };
  return map[tt ?? "REVIEW"] ?? map["REVIEW"]!;
}

function evBadgeStyle(type: string | null) {
  const map: Record<string, { bg: string; color: string }> = {
    SPOT_BUY:          { bg: "rgba(22,163,74,0.12)",   color: "#4ADE80" },
    SPOT_SELL:         { bg: "rgba(239,68,68,0.12)",   color: "#F87171" },
    EXTERNAL_DEPOSIT:  { bg: "rgba(96,165,250,0.12)",  color: "#93C5FD" },
    EXTERNAL_WITHDRAW: { bg: "rgba(96,165,250,0.12)",  color: "#93C5FD" },
    STAKING_REWARD:    { bg: "rgba(167,139,250,0.12)", color: "#A78BFA" },
    DUST_CONVERSION:   { bg: "rgba(245,158,11,0.12)",  color: "#FCD34D" },
    CONVERT:           { bg: "rgba(245,158,11,0.12)",  color: "#FCD34D" },
  };
  return map[type ?? ""] ?? { bg: "rgba(100,116,139,0.12)", color: "#64748B" };
}

// ── Main drawer ────────────────────────────────────────────────────────────────

export function BinanceSyncDrawer({ onClose }: { onClose: () => void }) {
  const [conn,           setConn]           = useState<ConnectionStatus | null>(null);
  const [loadingConn,    setLoadingConn]    = useState(true);
  const [syncing,        setSyncing]        = useState(false);
  const [resetting,      setResetting]      = useState(false);
  const [syncResult,     setSyncResult]     = useState<SyncResult | null>(null);
  const [calendar,       setCalendar]       = useState<CalendarData | null>(null);
  const [loadingCal,     setLoadingCal]     = useState(false);
  const [imports,        setImports]        = useState<ImportRecord[]>([]);
  const [loadingImports, setLoadingImports] = useState(false);
  const [confirmingId,   setConfirmingId]   = useState<string | null>(null);
  const [selectedImport, setSelectedImport] = useState<ImportRecord | null>(null);
  const [syncingMonth,    setSyncingMonth]   = useState<{ year: number; month: number } | null>(null);
  const [showPendingList, setShowPendingList] = useState(false);
  const [msg,             setMsg]            = useState<{ type: "success"|"error"|"warn"|"info"; text: string } | null>(null);

  const loadStatus = useCallback(async () => {
    setLoadingConn(true);
    try {
      await httpClient("/api/csrf");
      const res = await httpClient<ApiResponse<ConnectionStatus>>("/api/integrations/binance/connect", { auth: true });
      setConn(res.data);
    } catch {
      setConn({ connected: false });
    } finally {
      setLoadingConn(false);
    }
  }, []);

  const loadCalendar = useCallback(async () => {
    setLoadingCal(true);
    try {
      const res = await httpClient<ApiResponse<CalendarData>>("/api/integrations/binance/sync/calendar", { auth: true });
      setCalendar(res.data);
    } catch { /* calendar is optional */ } finally {
      setLoadingCal(false);
    }
  }, []);

  const loadImports = useCallback(async () => {
    setLoadingImports(true);
    try {
      const res = await httpClient<ApiResponse<ImportRecord[]>>("/api/integrations/binance/imports", { auth: true });
      setImports(res.data ?? []);
    } catch {
      setImports([]);
    } finally {
      setLoadingImports(false);
    }
  }, []);

  useEffect(() => { void loadStatus(); }, [loadStatus]);
  useEffect(() => {
    if (conn?.connected && conn.status === "ACTIVE") {
      void loadCalendar();
      if ((conn.pendingCount ?? 0) > 0) void loadImports();
    }
  }, [conn, loadCalendar, loadImports]);

  async function handleSync() {
    setSyncing(true); setMsg(null); setSyncResult(null);
    try {
      const res = await httpClient<ApiResponse<SyncResult>>("/api/integrations/binance/sync", { method: "POST", auth: true, body: {} });
      setSyncResult(res.data);
      setMsg({ type: res.data.errors.length > 0 ? "warn" : "success", text: res.message });
      // Actualizar precios históricos de depósitos/retiros con priceUsd=0
      await httpClient("/api/portfolio/backfill-prices", { method: "POST", auth: true, body: {} }).catch(() => {});
      await loadStatus();
      await loadCalendar();
      await loadImports();
    } catch (e) {
      setMsg({ type: "error", text: isHttpClientError(e) ? e.message : "Error durante la sincronización." });
    } finally {
      setSyncing(false);
    }
  }

  async function handleReset() {
    setResetting(true); setMsg(null);
    try {
      await httpClient("/api/integrations/binance/sync/reset", { method: "POST", auth: true, body: {} });
      setMsg({ type: "success", text: "Historial reiniciado. Todos los períodos vuelven a PENDING." });
      await loadStatus();
      await loadCalendar();
    } catch (e) {
      setMsg({ type: "error", text: isHttpClientError(e) ? e.message : "Error al reiniciar." });
    } finally {
      setResetting(false);
    }
  }

  async function handleSyncMonth(year: number, month: number) {
    if (syncing || syncingMonth) return;
    setSyncingMonth({ year, month }); setMsg(null);
    try {
      const res = await httpClient<ApiResponse<SyncResult>>("/api/integrations/binance/sync", { method: "POST", auth: true, body: { year, month } });
      setMsg({ type: res.data.errors.length > 0 ? "warn" : "success", text: `${MONTH_NAME[month]} ${year}: ${res.message}` });
      await httpClient("/api/portfolio/backfill-prices", { method: "POST", auth: true, body: {} }).catch(() => {});
      await loadCalendar();
      await loadImports();
    } catch (e) {
      setMsg({ type: "error", text: isHttpClientError(e) ? e.message : "Error al sincronizar el mes." });
    } finally {
      setSyncingMonth(null);
    }
  }

  async function handleImportAction(recordId: string, action: "CONFIRM" | "REJECT" | "REVIEW") {
    setConfirmingId(recordId); setMsg(null);
    try {
      await httpClient("/api/integrations/binance/imports/confirm", { method: "POST", auth: true, body: { recordId, action } });
      if (action === "REVIEW") {
        setImports(prev => prev.map(r => r.id === recordId ? { ...r, status: "REVIEW" } : r));
      } else {
        setImports(prev => prev.filter(r => r.id !== recordId));
        setConn(prev => prev ? { ...prev, pendingCount: Math.max(0, (prev.pendingCount ?? 1) - 1) } : prev);
      }
    } catch (e) {
      setMsg({ type: "error", text: isHttpClientError(e) ? e.message : "Error al procesar el registro." });
    } finally {
      setConfirmingId(null);
    }
  }

  const isConnected = conn?.connected && conn.status === "ACTIVE";
  const isSyncStuck = conn?.syncStatus === "RUNNING" && !syncing;

  return (
    <>
      <style>{`
        @keyframes bn-spin { to { transform: rotate(360deg); } }
        @keyframes bn-pulse { 0%,100% { box-shadow: 0 0 0 0 rgba(22,163,74,0.6); } 50% { box-shadow: 0 0 0 5px rgba(22,163,74,0); } }
        @keyframes bn-blink { 0%,100% { opacity:1; } 50% { opacity:0.25; } }
      `}</style>

      {/* Backdrop */}
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 900 }} />

      {/* Drawer */}
      <div style={{ position: "fixed", top: 0, right: 0, width: "580px", maxWidth: "100vw", height: "100vh", background: "#0F172A", zIndex: 901, display: "flex", flexDirection: "column", boxShadow: "-8px 0 32px rgba(0,0,0,0.4)" }}>

        {/* Header */}
        <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", gap: "12px", flexShrink: 0 }}>
          <div style={{ width: "36px", height: "36px", borderRadius: "9px", background: "rgba(240,185,11,0.1)", border: "1px solid rgba(240,185,11,0.25)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 800, color: "#F0B90B", fontFamily: fonts.body, flexShrink: 0 }}>
            BN
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: "14px", fontWeight: 700, color: "#F1F5F9", margin: 0 }}>Binance</p>
            <p style={{ fontSize: "11px", color: "#475569", margin: 0 }}>Sincronización de operaciones</p>
          </div>
          {conn && (
            <span style={{ fontSize: "11px", fontWeight: 700, padding: "3px 10px", borderRadius: "6px", background: isConnected ? "rgba(22,163,74,0.12)" : "rgba(100,116,139,0.12)", color: isConnected ? "#4ADE80" : "#64748B", border: `1px solid ${isConnected ? "rgba(22,163,74,0.25)" : "rgba(100,116,139,0.2)"}`, whiteSpace: "nowrap" }}>
              {isConnected ? "Conectado" : "No conectado"}
            </span>
          )}
          <button type="button" onClick={onClose} style={{ background: "none", border: "none", color: "#64748B", cursor: "pointer", fontSize: "18px", lineHeight: 1, padding: "4px", flexShrink: 0 }}>✕</button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "1rem 1.25rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>

          {loadingConn ? (
            <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "#475569", fontSize: "13px", padding: "2rem 0" }}>
              <div style={{ width: "16px", height: "16px", border: "2px solid rgba(255,255,255,0.1)", borderTop: "2px solid #F0B90B", borderRadius: "50%", animation: "bn-spin 0.8s linear infinite" }} />
              Verificando conexión...
            </div>
          ) : !isConnected ? (
            <div style={{ padding: "2rem 0", textAlign: "center" }}>
              <p style={{ color: "#475569", fontSize: "13px", margin: "0 0 8px" }}>Sin conexión con Binance.</p>
              <a href="/configuracion" style={{ fontSize: "12px", color: "#4ADE80" }}>Configurar credenciales →</a>
            </div>
          ) : (
            <>
              {/* Alerta */}
              {msg && (
                <div style={{ fontSize: "12px", color: msg.type === "success" ? "#4ADE80" : msg.type === "error" ? "#F87171" : msg.type === "warn" ? "#FCD34D" : "#93C5FD", background: msg.type === "success" ? "rgba(22,163,74,0.06)" : msg.type === "error" ? "rgba(239,68,68,0.06)" : msg.type === "warn" ? "rgba(245,158,11,0.06)" : "rgba(96,165,250,0.06)", border: `1px solid ${msg.type === "success" ? "rgba(22,163,74,0.2)" : msg.type === "error" ? "rgba(239,68,68,0.2)" : msg.type === "warn" ? "rgba(245,158,11,0.2)" : "rgba(96,165,250,0.2)"}`, borderRadius: "8px", padding: "10px 14px" }}>
                  {msg.text}
                </div>
              )}

              {/* Info línea */}
              <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                {conn.apiKeyHint && <span style={{ fontSize: "11px", color: "#334155" }}>Clave …{conn.apiKeyHint}</span>}
                {conn.lastSyncAt && (
                  <span style={{ fontSize: "11px", color: "#475569" }}>
                    Última sync: {new Date(conn.lastSyncAt).toLocaleString("es-CL", { dateStyle: "short", timeStyle: "short" })}
                    {" "}{conn.lastSyncStatus === "OK" ? "✓" : "⚠"}
                  </span>
                )}
                {!conn.lastSyncAt && <span style={{ fontSize: "11px", color: "#334155" }}>Nunca sincronizado</span>}
              </div>

              {/* Controles de sync */}
              <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "10px", padding: "0.75rem 1rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>

                  {syncing && <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#22C55E", display: "inline-block", flexShrink: 0, animation: "bn-blink 1s ease-in-out infinite" }} />}

                  <span style={{ flex: 1, fontSize: "12px", color: "#64748B" }}>
                    {isSyncStuck ? <span style={{ color: "#F87171", fontWeight: 600 }}>Sync atascada</span>
                     : calendar?.nextPeriod ? <span>Siguiente: <strong style={{ color: "#94A3B8" }}>{MONTH_NAME[calendar.nextPeriod.month]} {calendar.nextPeriod.year}</strong></span>
                     : calendar && calendar.periods.length > 0 && !calendar.nextPeriod ? <span style={{ color: "#4ADE80" }}>Historial al día ✓</span>
                     : <span>Listo para sincronizar</span>}
                  </span>

                  <button type="button" onClick={handleReset} disabled={resetting || syncing}
                    title="Devuelve todos los períodos a PENDING para re-consultar el historial completo"
                    style={{ padding: "6px 10px", borderRadius: "7px", border: "1px solid rgba(100,116,139,0.25)", background: "rgba(255,255,255,0.03)", color: "#475569", fontSize: "11px", cursor: resetting || syncing ? "not-allowed" : "pointer", fontFamily: fonts.body, whiteSpace: "nowrap" }}>
                    {resetting ? "Reiniciando..." : "↺ Resetear"}
                  </button>

                  <button type="button" onClick={handleSync} disabled={syncing || isSyncStuck}
                    style={{ padding: "7px 18px", borderRadius: "8px", border: "none", background: "#16A34A", color: "#fff", fontSize: "13px", fontWeight: 700, cursor: syncing || isSyncStuck ? "not-allowed" : "pointer", fontFamily: fonts.body, whiteSpace: "nowrap", animation: syncing ? "bn-pulse 1.2s ease-in-out infinite" : "none", opacity: isSyncStuck ? 0.5 : 1 }}>
                    {syncing ? "Sincronizando..." : isSyncStuck ? "En curso..." : "Sincronizar"}
                  </button>
                </div>

                {conn.lastSyncError && <p style={{ margin: "6px 0 0", fontSize: "11px", color: "#F87171" }}>Error: {conn.lastSyncError}</p>}

                {/* Resultado de sync */}
                {syncResult && !syncing && (
                  <div style={{ marginTop: "0.625rem", paddingTop: "0.625rem", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                    {syncResult.allPeriodsSynced ? (
                      <p style={{ margin: 0, fontSize: "12px", color: "#4ADE80" }}>Todo el historial está sincronizado.</p>
                    ) : (
                      <>
                        {syncResult.autoConfirmed > 0 && <p style={{ margin: "0 0 2px", fontSize: "12px", color: "#4ADE80" }}><strong>{syncResult.autoConfirmed}</strong> {syncResult.autoConfirmed === 1 ? "operación incorporada" : "operaciones incorporadas"} al portafolio.</p>}
                        {syncResult.pendingReview > 0 && <p style={{ margin: "0 0 2px", fontSize: "12px", color: "#F59E0B" }}><strong>{syncResult.pendingReview}</strong> {syncResult.pendingReview === 1 ? "operación pendiente" : "operaciones pendientes"} de revisión.</p>}
                        {syncResult.autoConfirmed === 0 && syncResult.pendingReview === 0 && syncResult.imported === 0 && <p style={{ margin: 0, fontSize: "12px", color: "#64748B" }}>Sin nuevas operaciones en este período.</p>}
                        <div style={{ display: "flex", gap: "1rem", fontSize: "11px", color: "#64748B", flexWrap: "wrap", marginTop: "4px" }}>
                          <span>Importados: <strong style={{ color: "#CBD5E1" }}>{syncResult.imported}</strong></span>
                          <span>Auto-confirmados: <strong style={{ color: "#4ADE80" }}>{syncResult.autoConfirmed}</strong></span>
                          <span>En revisión: <strong style={{ color: "#F59E0B" }}>{syncResult.pendingReview}</strong></span>
                          <span>Omitidos: <strong>{syncResult.skipped}</strong></span>
                          {syncResult.errors.length > 0 && <span>Errores: <strong style={{ color: "#F87171" }}>{syncResult.errors.length}</strong></span>}
                          {syncResult.taxRebuilt && <span style={{ color: "#A78BFA" }}>Motor recalculado ✓</span>}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Calendario */}
              <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "10px", padding: "0.75rem 1rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.625rem" }}>
                  <h4 style={{ fontSize: "12px", fontWeight: 700, color: "#94A3B8", margin: 0, textTransform: "uppercase", letterSpacing: "0.06em" }}>Cobertura</h4>
                  {calendar && (
                    <span style={{ fontSize: "11px", color: "#475569" }}>
                      {calendar.totalCompleted} completados
                      {calendar.totalPending > 0 && (
                        <button type="button" onClick={() => setShowPendingList(v => !v)}
                          style={{ background: "none", border: "none", padding: 0, cursor: "pointer", fontFamily: fonts.body }}>
                          <span style={{ color: "#F59E0B", textDecoration: "underline", fontSize: "11px" }}> · {calendar.totalPending} pendientes</span>
                        </button>
                      )}
                      {calendar.totalFailed > 0 && (
                        <button type="button" onClick={() => setShowPendingList(v => !v)}
                          style={{ background: "none", border: "none", padding: 0, cursor: "pointer", fontFamily: fonts.body }}>
                          <span style={{ color: "#F87171", textDecoration: "underline", fontSize: "11px" }}> · {calendar.totalFailed} fallidos</span>
                        </button>
                      )}
                    </span>
                  )}
                </div>
                {loadingCal && !calendar ? (
                  <p style={{ fontSize: "12px", color: "#475569", margin: 0 }}>Cargando cobertura...</p>
                ) : calendar ? (
                  <>
                    <div style={{ maxHeight: "220px", overflowY: "auto" }}>
                      <SyncCalendarGrid
                        periods={calendar.periods}
                        onSyncMonth={!syncing ? handleSyncMonth : undefined}
                        syncingMonth={syncingMonth}
                      />
                    </div>

                    {/* Lista de meses pendientes/fallidos */}
                    {showPendingList && (() => {
                      const pending = calendar.periods.filter(p => p.status === "PENDING" || p.status === "FAILED");
                      if (pending.length === 0) return null;
                      return (
                        <div style={{ marginTop: "10px", borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "10px" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                            <span style={{ fontSize: "11px", fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                              Meses pendientes ({pending.length})
                            </span>
                            <button type="button" onClick={() => setShowPendingList(false)}
                              style={{ background: "none", border: "none", color: "#475569", cursor: "pointer", fontSize: "12px", fontFamily: fonts.body }}>
                              Cerrar ✕
                            </button>
                          </div>
                          <div style={{ maxHeight: "180px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "4px" }}>
                            {pending.sort((a, b) => a.year !== b.year ? a.year - b.year : a.month - b.month).map(p => {
                              const isSyncing = syncingMonth?.year === p.year && syncingMonth?.month === p.month;
                              return (
                                <div key={p.id} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "6px 8px", borderRadius: "7px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
                                  <span style={{ fontSize: "12px", color: "#94A3B8", fontWeight: 600, minWidth: "80px" }}>
                                    {MONTH_NAME[p.month]?.charAt(0).toUpperCase()}{MONTH_NAME[p.month]?.slice(1)} {p.year}
                                  </span>
                                  <span style={{ flex: 1, fontSize: "11px", color: p.status === "FAILED" ? "#F87171" : "#F59E0B" }}>
                                    {p.status === "FAILED" ? `✗ Falló${p.errorCount > 0 ? ` (${p.errorCount} errores)` : ""}` : "○ Pendiente"}
                                  </span>
                                  <button type="button"
                                    onClick={() => handleSyncMonth(p.year, p.month)}
                                    disabled={!!syncingMonth || syncing}
                                    style={{ padding: "4px 10px", borderRadius: "5px", border: "1px solid rgba(22,163,74,0.3)", background: "rgba(22,163,74,0.08)", color: isSyncing ? "#F0B90B" : "#4ADE80", fontSize: "11px", fontWeight: 600, cursor: syncingMonth || syncing ? "not-allowed" : "pointer", fontFamily: fonts.body, whiteSpace: "nowrap" }}>
                                    {isSyncing ? "…" : "Sincronizar"}
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })()}
                  </>
                ) : null}
              </div>

              {/* Excepciones — solo eventos que requieren decisión humana */}
              {((conn.pendingCount ?? 0) > 0 || imports.length > 0) && (
                <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "10px", overflow: "hidden", position: "relative" }}>

                  {/* Panel de detalle — overlay dentro de la sección */}
                  {selectedImport && (() => {
                    let norm: NormalizedJson = { movementType: selectedImport.externalType, symbol: "—", quantity: 0, priceUsd: 0, feeUsd: 0 };
                    try { norm = JSON.parse(selectedImport.normalizedJson ?? "{}") as NormalizedJson; } catch { /* noop */ }
                    const ev  = evBadgeStyle(selectedImport.normalizedEventType);
                    const tt  = taxTreatmentLabel(selectedImport.taxTreatment);
                    const reason = reviewReason(selectedImport);
                    return (
                      <div style={{ position: "absolute", inset: 0, background: "#0F172A", zIndex: 5, display: "flex", flexDirection: "column", borderRadius: "10px" }}>
                        <div style={{ padding: "0.75rem 1rem", borderBottom: "1px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", gap: "10px" }}>
                          <button type="button" onClick={() => setSelectedImport(null)}
                            style={{ background: "none", border: "none", color: "#64748B", cursor: "pointer", fontSize: "13px", padding: 0, fontFamily: fonts.body }}>
                            ← Volver
                          </button>
                          <span style={{ fontSize: "12px", fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.06em" }}>Detalle del evento</span>
                        </div>
                        <div style={{ flex: 1, overflowY: "auto", padding: "1rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>

                          {/* Evento + símbolo */}
                          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                            <span style={{ fontSize: "11px", fontWeight: 700, color: ev.color, background: ev.bg, border: `1px solid ${ev.color}30`, borderRadius: "4px", padding: "3px 8px" }}>
                              {selectedImport.normalizedEventType ?? selectedImport.externalType}
                            </span>
                            <span style={{ fontSize: "15px", fontWeight: 700, color: "#F1F5F9" }}>{norm.symbol}</span>
                            <span style={{ fontSize: "12px", color: "#64748B" }}>
                              {new Date(selectedImport.occurredAt).toLocaleString("es-CL", { dateStyle: "medium", timeStyle: "short" })}
                            </span>
                          </div>

                          {/* Datos del movimiento */}
                          <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "8px", padding: "0.75rem", display: "flex", flexDirection: "column", gap: "6px" }}>
                            {[
                              ["Cantidad",   norm.quantity > 0 ? norm.quantity.toFixed(8).replace(/\.?0+$/, "") : "—"],
                              ["Precio USD", norm.priceUsd > 0 ? `$${norm.priceUsd.toFixed(2)}` : "—"],
                              ["Fee USD",    norm.feeUsd > 0   ? `$${norm.feeUsd.toFixed(4)}`   : "$0"],
                              ["Fuente",     "Binance · " + (selectedImport.externalType)],
                              ["ID externo", selectedImport.externalId],
                            ].map(([label, value]) => (
                              <div key={label} style={{ display: "flex", justifyContent: "space-between", gap: "8px" }}>
                                <span style={{ fontSize: "11px", color: "#475569" }}>{label}</span>
                                <span style={{ fontSize: "11px", color: "#94A3B8", fontFamily: "monospace", textAlign: "right", wordBreak: "break-all" }}>{value}</span>
                              </div>
                            ))}
                          </div>

                          {/* Clasificación LEDGERA */}
                          <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "8px", padding: "0.75rem", display: "flex", flexDirection: "column", gap: "6px" }}>
                            <p style={{ fontSize: "11px", fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 4px" }}>Clasificación LEDGERA</p>
                            {[
                              ["Tratamiento tributario", <span style={{ color: tt.color, fontWeight: 600 }}>{tt.label}</span>],
                              ["Efecto inventario FIFO", selectedImport.inventoryEffect ?? "—"],
                              ["Efecto económico",       selectedImport.economicEffect  ?? "—"],
                            ].map(([label, value]) => (
                              <div key={String(label)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px" }}>
                                <span style={{ fontSize: "11px", color: "#475569" }}>{label}</span>
                                <span style={{ fontSize: "11px", color: "#94A3B8" }}>{value}</span>
                              </div>
                            ))}
                          </div>

                          {/* Razón de revisión */}
                          <div style={{ background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: "8px", padding: "0.75rem" }}>
                            <p style={{ fontSize: "11px", fontWeight: 700, color: "#F59E0B", margin: "0 0 4px" }}>⚠ Razón de revisión</p>
                            <p style={{ fontSize: "12px", color: "#94A3B8", margin: 0, lineHeight: 1.5 }}>{reason}</p>
                          </div>

                          {/* Acciones */}
                          <div style={{ display: "flex", gap: "8px", paddingTop: "4px" }}>
                            <button type="button"
                              onClick={() => { void handleImportAction(selectedImport.id, "CONFIRM"); setSelectedImport(null); }}
                              disabled={selectedImport.taxTreatment === "REVIEW" || selectedImport.inventoryEffect === "REVIEW"}
                              style={{ flex: 1, padding: "8px", borderRadius: "7px", border: "1px solid rgba(22,163,74,0.3)", background: "rgba(22,163,74,0.08)", color: (selectedImport.taxTreatment === "REVIEW" || selectedImport.inventoryEffect === "REVIEW") ? "#334155" : "#4ADE80", fontSize: "12px", fontWeight: 600, cursor: (selectedImport.taxTreatment === "REVIEW" || selectedImport.inventoryEffect === "REVIEW") ? "not-allowed" : "pointer", fontFamily: fonts.body }}>
                              ✓ Confirmar
                            </button>
                            <button type="button"
                              onClick={() => { void handleImportAction(selectedImport.id, "REJECT"); setSelectedImport(null); }}
                              style={{ flex: 1, padding: "8px", borderRadius: "7px", border: "1px solid rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.08)", color: "#F87171", fontSize: "12px", fontWeight: 600, cursor: "pointer", fontFamily: fonts.body }}>
                              ✗ Rechazar
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  <div style={{ padding: "0.75rem 1rem", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div>
                      <h4 style={{ fontSize: "12px", fontWeight: 700, color: "#94A3B8", margin: "0 0 2px", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                        Excepciones
                        {imports.length > 0 && <span style={{ marginLeft: "6px", fontSize: "11px", fontWeight: 700, color: "#F0B90B", background: "rgba(240,185,11,0.1)", border: "1px solid rgba(240,185,11,0.2)", borderRadius: "4px", padding: "1px 6px" }}>{imports.length}</span>}
                      </h4>
                      <p style={{ fontSize: "11px", color: "#334155", margin: 0 }}>Eventos que no pudieron clasificarse automáticamente.</p>
                    </div>
                    <button type="button" onClick={loadImports} disabled={loadingImports}
                      style={{ padding: "5px 10px", borderRadius: "6px", border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)", color: "#64748B", fontSize: "11px", cursor: loadingImports ? "not-allowed" : "pointer", fontFamily: fonts.body }}>
                      {loadingImports ? "..." : "↺"}
                    </button>
                  </div>

                  {loadingImports ? (
                    <div style={{ padding: "1.5rem", textAlign: "center", color: "#475569", fontSize: "12px" }}>Cargando...</div>
                  ) : imports.length === 0 ? (
                    <div style={{ padding: "1.5rem", textAlign: "center", color: "#334155", fontSize: "12px" }}>Sin excepciones — todo fue clasificado automáticamente.</div>
                  ) : (
                    <div style={{ maxHeight: "280px", overflowY: "auto" }}>
                      {imports.map((record) => {
                        let norm: NormalizedJson = { movementType: record.externalType, symbol: "—", quantity: 0, priceUsd: 0, feeUsd: 0 };
                        try { norm = JSON.parse(record.normalizedJson ?? "{}") as NormalizedJson; } catch { /* noop */ }
                        const isProcessing  = confirmingId === record.id;
                        const cannotConfirm = record.taxTreatment === "REVIEW" || record.inventoryEffect === "REVIEW";
                        const ev = evBadgeStyle(record.normalizedEventType);
                        return (
                          <div key={record.id} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 1rem", borderBottom: "1px solid rgba(255,255,255,0.04)", flexWrap: "wrap" }}>
                            <span style={{ fontSize: "10px", fontWeight: 700, color: ev.color, background: ev.bg, border: `1px solid ${ev.color}30`, borderRadius: "4px", padding: "2px 6px", whiteSpace: "nowrap", flexShrink: 0 }}>
                              {record.normalizedEventType ?? record.externalType}
                            </span>
                            <span style={{ fontSize: "12px", color: "#CBD5E1", fontWeight: 600, flexShrink: 0 }}>{norm.symbol}</span>
                            <span style={{ fontSize: "11px", color: "#64748B", fontFamily: "monospace", flexShrink: 0 }}>
                              {norm.quantity > 0 ? norm.quantity.toFixed(6).replace(/\.?0+$/, "") : "—"}
                            </span>
                            <span style={{ flex: 1, fontSize: "11px", color: "#475569", whiteSpace: "nowrap" }}>
                              {new Date(record.occurredAt).toLocaleDateString("es-CL", { dateStyle: "short" })}
                            </span>
                            <div style={{ display: "flex", gap: "4px", flexShrink: 0 }}>
                              {/* Detalle */}
                              <button type="button" onClick={() => setSelectedImport(record)} title="Ver detalle tributario"
                                style={{ padding: "4px 8px", borderRadius: "5px", border: "1px solid rgba(148,163,184,0.2)", background: "rgba(255,255,255,0.04)", color: "#94A3B8", fontSize: "11px", cursor: "pointer" }}>?</button>
                              {/* Confirmar */}
                              <button type="button" onClick={() => !cannotConfirm && handleImportAction(record.id, "CONFIRM")} disabled={isProcessing || cannotConfirm} title={cannotConfirm ? "Ver detalle para decidir" : "Confirmar"}
                                style={{ padding: "4px 8px", borderRadius: "5px", border: "1px solid rgba(22,163,74,0.3)", background: cannotConfirm ? "rgba(255,255,255,0.03)" : "rgba(22,163,74,0.08)", color: cannotConfirm ? "#334155" : "#4ADE80", fontSize: "11px", cursor: isProcessing || cannotConfirm ? "not-allowed" : "pointer", opacity: isProcessing ? 0.5 : 1 }}>✓</button>
                              {/* Rechazar */}
                              <button type="button" onClick={() => handleImportAction(record.id, "REJECT")} disabled={isProcessing} title="Rechazar"
                                style={{ padding: "4px 8px", borderRadius: "5px", border: "1px solid rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.08)", color: "#F87171", fontSize: "11px", cursor: isProcessing ? "not-allowed" : "pointer", opacity: isProcessing ? 0.5 : 1 }}>✗</button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: "0.75rem 1.25rem", borderTop: "1px solid rgba(255,255,255,0.07)", flexShrink: 0, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <a href="/configuracion" style={{ fontSize: "12px", color: "#475569", textDecoration: "none" }}>
            Configurar credenciales →
          </a>
          <span style={{ fontSize: "11px", color: "#1e293b" }}>Spot · API Read-Only</span>
        </div>
      </div>
    </>
  );
}
