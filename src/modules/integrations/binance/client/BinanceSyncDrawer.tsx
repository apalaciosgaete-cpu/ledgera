"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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

type TaxConnectionStatus = {
  connected:      boolean;
  status?:        string;
  lastSyncAt?:    string | null;
  lastSyncStatus?: string | null;
  lastSyncError?: string | null;
  apiKeyHint?:    string;
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

// ── Constants ─────────────────────────────────────────────────────────────────

const MONTH_ABBR = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
const MONTH_NAME: Record<number, string> = {
  1:"enero",2:"febrero",3:"marzo",4:"abril",5:"mayo",6:"junio",
  7:"julio",8:"agosto",9:"septiembre",10:"octubre",11:"noviembre",12:"diciembre",
};
const CALENDAR_START_YEAR = 2018;

// ── Calendar helpers ───────────────────────────────────────────────────────────

function pillStyle(p: SyncPeriod) {
  switch (p.status) {
    case "COMPLETED": return { bg: "rgba(22,163,74,0.12)",   border: "rgba(22,163,74,0.25)",   color: "#4ADE80", value: p.importedCount > 0 ? (p.importedCount > 99 ? "99+" : String(p.importedCount)) : "✓" };
    case "EMPTY":     return { bg: "rgba(255,255,255,0.02)", border: "rgba(255,255,255,0.07)", color: "#334155", value: "—" };
    case "FAILED":    return { bg: "rgba(239,68,68,0.08)",   border: "rgba(239,68,68,0.25)",   color: "#F87171", value: "!" };
    case "RUNNING":   return { bg: "rgba(240,185,11,0.08)",  border: "rgba(240,185,11,0.25)",  color: "#F0B90B", value: "…" };
    default:          return { bg: "rgba(255,255,255,0.02)", border: "rgba(255,255,255,0.07)", color: "#475569", value: "○" };
  }
}

function MonthPill({ label, period, pendingCount, onClick, syncing }: {
  label:        string;
  period?:      SyncPeriod;
  pendingCount?: number;
  onClick?:     () => void;
  syncing?:     boolean;
}) {
  if (!period) return (
    <span title={label} style={{ width: "32px", height: "38px", display: "inline-flex", flexDirection: "column", alignItems: "center", justifyContent: "center", borderRadius: "5px", border: "1px dashed rgba(255,255,255,0.04)", flexShrink: 0 }}>
      <span style={{ fontSize: "9px", color: "#1e293b" }}>{label}</span>
    </span>
  );

  const hasPending = (pendingCount ?? 0) > 0;
  const s = hasPending
    ? { bg: "rgba(245,158,11,0.1)", border: "rgba(245,158,11,0.35)", color: "#F59E0B", value: pendingCount! > 99 ? "99+" : String(pendingCount) }
    : pillStyle(period);

  const tooltip = hasPending
    ? `${label}: ${pendingCount} operación${pendingCount !== 1 ? "es" : ""} pendiente${pendingCount !== 1 ? "s" : ""} de revisión — clic para revisar`
    : `${label}: ${period.status}${period.importedCount > 0 ? ` · ${period.importedCount} op.` : ""}${onClick ? " — clic para revisar" : ""}`;

  return (
    <span
      onClick={onClick}
      title={tooltip}
      style={{ width: "32px", height: "38px", display: "inline-flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "2px", borderRadius: "5px", background: syncing ? "rgba(240,185,11,0.15)" : s.bg, border: `1px solid ${syncing ? "rgba(240,185,11,0.5)" : s.border}`, flexShrink: 0, cursor: onClick ? "pointer" : "default", transition: "opacity 0.15s" }}
    >
      <span style={{ fontSize: "9px", color: "#64748B", lineHeight: 1 }}>{label}</span>
      <span style={{ fontSize: "10px", fontWeight: 700, color: syncing ? "#F0B90B" : s.color, lineHeight: 1, animation: syncing ? "bn-blink 1s ease-in-out infinite" : "none" }}>
        {syncing ? "…" : s.value}
      </span>
    </span>
  );
}

function YearSummaryBadges({ monthMap, maxMonth }: { monthMap?: Map<number, SyncPeriod>; maxMonth: number }) {
  if (!monthMap) return <span style={{ fontSize: "10px", color: "#1e293b" }}>sin datos</span>;
  let done = 0, pending = 0, failed = 0;
  for (let m = 1; m <= maxMonth; m++) {
    const s = monthMap.get(m)?.status;
    if (s === "COMPLETED" || s === "EMPTY") done++;
    else if (s === "FAILED") failed++;
    else if (s === "PENDING") pending++;
  }
  return (
    <span style={{ display: "flex", gap: "6px", fontSize: "10px" }}>
      {done   > 0 && <span style={{ color: "#4ADE80" }}>{done}✓</span>}
      {pending > 0 && <span style={{ color: "#F59E0B" }}>{pending}○</span>}
      {failed  > 0 && <span style={{ color: "#F87171" }}>{failed}!</span>}
      {done === 0 && pending === 0 && failed === 0 && <span style={{ color: "#1e293b" }}>vacío</span>}
    </span>
  );
}

function SyncCalendarGrid({ periods, pendingByMonth, onClickMonth, syncingMonth }: {
  periods:        SyncPeriod[];
  pendingByMonth: Map<string, number>;
  onClickMonth?:  (year: number, month: number) => void;
  syncingMonth?:  { year: number; month: number } | null;
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

  const [expandedYears, setExpandedYears] = useState<Set<number>>(
    () => new Set([currentYear, currentYear - 1]),
  );

  function toggleYear(y: number) {
    setExpandedYears(prev => {
      const next = new Set(prev);
      next.has(y) ? next.delete(y) : next.add(y);
      return next;
    });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
      {years.map(year => {
        const monthMap = byYear.get(year);
        const maxMonth = year === currentYear ? currentMonth : 12;
        const expanded = expandedYears.has(year);
        return (
          <div key={year}>
            <button type="button" onClick={() => toggleYear(year)}
              style={{ display: "flex", alignItems: "center", gap: "8px", width: "100%", background: "none", border: "none", padding: "4px 0", cursor: "pointer", textAlign: "left" }}>
              <span style={{ fontSize: "11px", fontWeight: 700, color: expanded ? "#94A3B8" : "#475569", minWidth: "32px", textAlign: "right", flexShrink: 0 }}>{year}</span>
              {!expanded && <YearSummaryBadges monthMap={monthMap} maxMonth={maxMonth} />}
              <span style={{ marginLeft: "auto", fontSize: "9px", color: "#334155", flexShrink: 0 }}>{expanded ? "▲" : "▼"}</span>
            </button>

            {expanded && (
              <div style={{ display: "flex", alignItems: "center", gap: "4px", flexWrap: "nowrap", paddingLeft: "40px", paddingBottom: "4px" }}>
                {MONTH_ABBR.map((label, i) => {
                  const month = i + 1;
                  if (month > maxMonth) return (
                    <span key={i} style={{ width: "32px", height: "38px", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <span style={{ fontSize: "9px", color: "#1e293b" }}>{label}</span>
                    </span>
                  );
                  const isSyncing = syncingMonth?.year === year && syncingMonth?.month === month;
                  const pending   = pendingByMonth.get(`${year}-${month}`) ?? 0;
                  return (
                    <MonthPill
                      key={i}
                      label={label}
                      period={monthMap?.get(month)}
                      pendingCount={pending}
                      onClick={onClickMonth ? () => onClickMonth(year, month) : undefined}
                      syncing={isSyncing}
                    />
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Import display helpers ─────────────────────────────────────────────────────

function reviewReason(r: ImportRecord): string {
  const ev = r.normalizedEventType ?? "UNKNOWN";
  if (ev === "UNKNOWN")         return "Tipo de evento no reconocido por LEDGERA.";
  if (ev === "DUST_CONVERSION") return "Conversión de polvo: involucra múltiples activos simultáneos.";
  if (ev === "CONVERT")         return "Conversión equivale a venta + compra simultánea — requiere asignar precio justo a cada tramo.";
  if (ev === "STAKING_REWARD")  return "Renta por staking: tratamiento bajo normativa SII requiere revisión.";
  if (ev === "EARN_REWARD")     return "Renta por Earn/Launchpool: clasificación tributaria pendiente.";
  if (ev === "P2P")             return "Operación P2P: requiere verificar precio de mercado en la fecha.";
  if (ev === "FUNDING")         return "Funding fee de futuros: tratamiento como gasto financiero.";
  if (r.taxTreatment    === "REVIEW") return "El tratamiento tributario de este evento es ambiguo.";
  if (r.inventoryEffect === "REVIEW") return "El impacto en inventario FIFO no puede determinarse automáticamente.";
  return "Evento marcado para revisión manual.";
}

function taxTreatmentLabel(tt: string | null): { label: string; color: string } {
  const map: Record<string, { label: string; color: string }> = {
    ACQUISITION: { label: "Adquisición", color: "#4ADE80" },
    DISPOSAL:    { label: "Enajenación", color: "#F87171" },
    INCOME:      { label: "Renta",       color: "#A78BFA" },
    EXPENSE:     { label: "Gasto",       color: "#FCD34D" },
    NEUTRAL:     { label: "Neutro",      color: "#64748B" },
    REVIEW:      { label: "⚠ Revisar",  color: "#F59E0B" },
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

export function BinanceSyncDrawer({ onClose, onSyncComplete }: { onClose: () => void; onSyncComplete?: () => void }) {
  const [conn,           setConn]           = useState<ConnectionStatus | null>(null);
  const [loadingConn,    setLoadingConn]    = useState(true);
  const [syncing,        setSyncing]        = useState(false);
  const [resetting,      setResetting]      = useState(false);
  const [syncResult,     setSyncResult]     = useState<SyncResult | null>(null);
  const [calendar,       setCalendar]       = useState<CalendarData | null>(null);
  const [loadingCal,     setLoadingCal]     = useState(false);
  const [allImports,     setAllImports]     = useState<ImportRecord[]>([]);
  const [loadingImports, setLoadingImports] = useState(false);
  const [confirmingId,   setConfirmingId]   = useState<string | null>(null);
  const [confirmingAll,  setConfirmingAll]  = useState(false);
  const [selectedImport, setSelectedImport] = useState<ImportRecord | null>(null);
  const [overrideForm,   setOverrideForm]   = useState({ movementType: "BUY", priceUsd: "", feeUsd: "0" });
  const [selectedMonth,  setSelectedMonth]  = useState<{ year: number; month: number } | null>(null);
  const [syncingMonth,   setSyncingMonth]   = useState<{ year: number; month: number } | null>(null);
  const [taxConn,        setTaxConn]        = useState<TaxConnectionStatus | null>(null);
  const [loadingTaxConn, setLoadingTaxConn] = useState(false);
  const [msg,            setMsg]            = useState<{ type: "success"|"error"|"warn"|"info"; text: string } | null>(null);

  // Pending imports keyed by "year-month"
  const pendingByMonth = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of allImports) {
      const d = new Date(r.occurredAt);
      const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    return map;
  }, [allImports]);

  // Imports for the currently selected month (filtered locally)
  const monthImports = useMemo(() => {
    if (!selectedMonth) return [];
    return allImports.filter(r => {
      const d = new Date(r.occurredAt);
      return d.getFullYear() === selectedMonth.year && (d.getMonth() + 1) === selectedMonth.month;
    });
  }, [allImports, selectedMonth]);

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
      setAllImports(res.data ?? []);
    } catch {
      setAllImports([]);
    } finally {
      setLoadingImports(false);
    }
  }, []);

  const loadTaxStatus = useCallback(async () => {
    setLoadingTaxConn(true);
    try {
      const res = await httpClient<ApiResponse<TaxConnectionStatus>>("/api/integrations/binance/tax/connect", { auth: true });
      setTaxConn(res.data);
    } catch {
      setTaxConn({ connected: false });
    } finally {
      setLoadingTaxConn(false);
    }
  }, []);

  useEffect(() => { void loadStatus(); }, [loadStatus]);
  useEffect(() => {
    if (conn?.connected && conn.status === "ACTIVE") {
      void loadCalendar();
      void loadImports();
      void loadTaxStatus();
    }
  }, [conn, loadCalendar, loadImports, loadTaxStatus]);

  async function handleSync() {
    setSyncing(true); setMsg(null); setSyncResult(null);
    try {
      const res = await httpClient<ApiResponse<SyncResult>>("/api/integrations/binance/sync", { method: "POST", auth: true, body: {} });
      setSyncResult(res.data);
      setMsg({ type: res.data.errors.length > 0 ? "warn" : "success", text: res.message });
      await httpClient("/api/portfolio/backfill-prices", { method: "POST", auth: true, body: {} }).catch(() => {});
      await loadStatus();
      await loadCalendar();
      await loadImports();
      if (res.data.autoConfirmed > 0) onSyncComplete?.();
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
      if (res.data.autoConfirmed > 0) onSyncComplete?.();
    } catch (e) {
      setMsg({ type: "error", text: isHttpClientError(e) ? e.message : "Error al sincronizar el mes." });
    } finally {
      setSyncingMonth(null);
    }
  }

  function handleClickMonth(year: number, month: number) {
    setSelectedMonth({ year, month });
    setSelectedImport(null);
    setMsg(null);
  }

  async function handleConfirmMonth(year: number, month: number) {
    setConfirmingAll(true); setMsg(null);
    try {
      const res = await httpClient<ApiResponse<{ confirmed: number; skippedReview: number; taxRebuilt: boolean }>>(
        "/api/integrations/binance/imports/bulk-confirm",
        { method: "POST", auth: true, body: { year, month } },
      );
      setMsg({ type: "success", text: res.message });
      await loadImports();
      if (res.data.confirmed > 0) onSyncComplete?.();
    } catch (e) {
      setMsg({ type: "error", text: isHttpClientError(e) ? e.message : "Error al confirmar." });
    } finally {
      setConfirmingAll(false);
    }
  }

  async function handleImportAction(
    recordId: string,
    action:   "CONFIRM" | "REJECT" | "REVIEW",
    override?: { movementType: string; priceUsd: number; feeUsd: number },
  ) {
    setConfirmingId(recordId); setMsg(null);
    try {
      await httpClient("/api/integrations/binance/imports/confirm", {
        method: "POST", auth: true,
        body:   override ? { recordId, action, override } : { recordId, action },
      });
      setAllImports(prev => action === "REVIEW"
        ? prev.map(r => r.id === recordId ? { ...r, status: "REVIEW" } : r)
        : prev.filter(r => r.id !== recordId),
      );
      setSelectedImport(null);
      if (action === "CONFIRM") onSyncComplete?.();
    } catch (e) {
      setMsg({ type: "error", text: isHttpClientError(e) ? e.message : "Error al procesar el registro." });
    } finally {
      setConfirmingId(null);
    }
  }

  const isConnected = conn?.connected && conn.status === "ACTIVE";
  const isSyncStuck = conn?.syncStatus === "RUNNING" && !syncing;

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <>
      <style>{`
        @keyframes bn-spin  { to { transform: rotate(360deg); } }
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
        <div style={{ flex: 1, overflow: "hidden", position: "relative" }}>

          {loadingConn ? (
            <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "#475569", fontSize: "13px", padding: "2rem 1.25rem" }}>
              <div style={{ width: "16px", height: "16px", border: "2px solid rgba(255,255,255,0.1)", borderTop: "2px solid #F0B90B", borderRadius: "50%", animation: "bn-spin 0.8s linear infinite" }} />
              Verificando conexión...
            </div>
          ) : !isConnected ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", padding: "2rem 1.25rem", textAlign: "center", gap: "8px" }}>
              <p style={{ color: "#475569", fontSize: "13px", margin: 0 }}>Sin conexión con Binance.</p>
              <a href="/configuracion" style={{ fontSize: "12px", color: "#4ADE80" }}>Configurar credenciales →</a>
            </div>
          ) : (
            <>
              {/* ── Vista principal: sync + calendario ───────────────────── */}
              <div style={{ height: "100%", overflowY: "auto", padding: "0.75rem 1.25rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>

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

                {/* APIs Binance */}
                <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "10px", padding: "0.75rem 1rem" }}>
                  <h4 style={{ fontSize: "12px", fontWeight: 700, color: "#94A3B8", margin: "0 0 8px", textTransform: "uppercase", letterSpacing: "0.06em" }}>APIs Binance</h4>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: "10px" }}>
                      <div>
                        <p style={{ margin: 0, fontSize: "12px", color: "#CBD5E1", fontWeight: 700 }}>API Spot</p>
                        <p style={{ margin: "2px 0 0", fontSize: "11px", color: "#64748B" }}>Balances, depósitos/retiros y Spot parcial.</p>
                      </div>
                      <span style={{ fontSize: "11px", color: isConnected ? "#4ADE80" : "#64748B", fontWeight: 700, flexShrink: 0 }}>
                        {isConnected ? "Conectada" : "No conectada"}
                      </span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: "10px" }}>
                      <div>
                        <p style={{ margin: 0, fontSize: "12px", color: "#CBD5E1", fontWeight: 700 }}>API Tributaria</p>
                        <p style={{ margin: "2px 0 0", fontSize: "11px", color: "#64748B" }}>Historial tributario multi-año de Binance.</p>
                      </div>
                      <span style={{ fontSize: "11px", color: taxConn?.connected ? "#4ADE80" : "#F59E0B", fontWeight: 700, flexShrink: 0 }}>
                        {loadingTaxConn ? "Verificando..." : taxConn?.connected ? "Conectada" : "Pendiente"}
                      </span>
                    </div>
                  </div>
                  {!taxConn?.connected && !loadingTaxConn && (
                    <a href="/integrations/binance/tax" style={{ display: "inline-flex", marginTop: "8px", fontSize: "12px", color: "#F0B90B", textDecoration: "none", fontWeight: 700 }}>
                      Conectar API tributaria →
                    </a>
                  )}
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
                  {syncResult && !syncing && (
                    <div style={{ marginTop: "0.625rem", paddingTop: "0.625rem", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                      {syncResult.allPeriodsSynced ? (
                        <p style={{ margin: 0, fontSize: "12px", color: "#4ADE80" }}>Todo el historial está sincronizado.</p>
                      ) : (
                        <>
                          {syncResult.autoConfirmed > 0 && <p style={{ margin: "0 0 2px", fontSize: "12px", color: "#4ADE80" }}><strong>{syncResult.autoConfirmed}</strong> {syncResult.autoConfirmed === 1 ? "operación incorporada" : "operaciones incorporadas"} al portafolio.</p>}
                          {syncResult.pendingReview > 0 && <p style={{ margin: "0 0 2px", fontSize: "12px", color: "#F59E0B" }}><strong>{syncResult.pendingReview}</strong> {syncResult.pendingReview === 1 ? "operación" : "operaciones"} — haz clic en el mes para revisar.</p>}
                          {syncResult.autoConfirmed === 0 && syncResult.pendingReview === 0 && syncResult.imported === 0 && <p style={{ margin: 0, fontSize: "12px", color: "#64748B" }}>Sin nuevas operaciones en este período.</p>}
                          <div style={{ display: "flex", gap: "1rem", fontSize: "11px", color: "#64748B", flexWrap: "wrap", marginTop: "4px" }}>
                            <span>Importados: <strong style={{ color: "#CBD5E1" }}>{syncResult.imported}</strong></span>
                            <span>Auto-confirmados: <strong style={{ color: "#4ADE80" }}>{syncResult.autoConfirmed}</strong></span>
                            {syncResult.pendingReview > 0 && <span>En revisión: <strong style={{ color: "#F59E0B" }}>{syncResult.pendingReview}</strong></span>}
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
                        {calendar.totalPending > 0 && <span style={{ color: "#F59E0B" }}> · {calendar.totalPending} pendientes</span>}
                        {calendar.totalFailed  > 0 && <span style={{ color: "#F87171" }}> · {calendar.totalFailed} con error</span>}
                      </span>
                    )}
                  </div>
                  {loadingCal && !calendar ? (
                    <p style={{ fontSize: "12px", color: "#475569", margin: 0 }}>Cargando cobertura...</p>
                  ) : calendar ? (
                    <SyncCalendarGrid
                      periods={calendar.periods}
                      pendingByMonth={pendingByMonth}
                      onClickMonth={handleClickMonth}
                      syncingMonth={syncingMonth}
                    />
                  ) : null}
                  <p style={{ fontSize: "10px", color: "#334155", margin: "8px 0 0" }}>
                    Los meses en ámbar tienen operaciones pendientes de revisión — haz clic para aprobar.
                  </p>
                </div>

                {/* Acceso rápido a importar archivo */}
                <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "10px", padding: "0.75rem 1rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <p style={{ fontSize: "12px", fontWeight: 600, color: "#94A3B8", margin: 0 }}>Importar archivo CSV</p>
                    <p style={{ fontSize: "11px", color: "#475569", margin: "2px 0 0" }}>Alternativa a la API — sube tu historial de Binance directamente.</p>
                  </div>
                  <a href="/import/binance" style={{ padding: "6px 14px", borderRadius: "7px", border: "1px solid rgba(240,185,11,0.25)", background: "rgba(240,185,11,0.08)", color: "#F0B90B", fontSize: "12px", fontWeight: 600, textDecoration: "none", whiteSpace: "nowrap" }}>
                    Importar →
                  </a>
                </div>

              </div>

              {/* ── Overlay: revisión de mes ─────────────────────────────── */}
              {selectedMonth && (
                <MonthReviewOverlay
                  month={selectedMonth}
                  imports={monthImports}
                  loadingImports={loadingImports}
                  confirmingId={confirmingId}
                  confirmingAll={confirmingAll}
                  selectedImport={selectedImport}
                  overrideForm={overrideForm}
                  msg={msg}
                  onBack={() => { setSelectedMonth(null); setSelectedImport(null); setMsg(null); }}
                  onSyncMonth={handleSyncMonth}
                  onConfirmAll={() => handleConfirmMonth(selectedMonth.year, selectedMonth.month)}
                  onSelectImport={(r) => { setSelectedImport(r); setOverrideForm({ movementType: "BUY", priceUsd: "", feeUsd: "0" }); }}
                  onImportAction={handleImportAction}
                  onOverrideChange={setOverrideForm}
                  onClearSelectedImport={() => setSelectedImport(null)}
                  isSyncing={syncingMonth?.year === selectedMonth.year && syncingMonth?.month === selectedMonth.month}
                />
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

// ── MonthReviewOverlay ─────────────────────────────────────────────────────────

function MonthReviewOverlay({
  month, imports, loadingImports, confirmingId, confirmingAll,
  selectedImport, overrideForm, msg,
  onBack, onSyncMonth, onConfirmAll, onSelectImport, onImportAction,
  onOverrideChange, onClearSelectedImport, isSyncing,
}: {
  month:                 { year: number; month: number };
  imports:               ImportRecord[];
  loadingImports:        boolean;
  confirmingId:          string | null;
  confirmingAll:         boolean;
  selectedImport:        ImportRecord | null;
  overrideForm:          { movementType: string; priceUsd: string; feeUsd: string };
  msg:                   { type: string; text: string } | null;
  onBack:                () => void;
  onSyncMonth:           (year: number, month: number) => void;
  onConfirmAll:          () => void;
  onSelectImport:        (r: ImportRecord) => void;
  onImportAction:        (id: string, action: "CONFIRM"|"REJECT"|"REVIEW", override?: { movementType: string; priceUsd: number; feeUsd: number }) => void;
  onOverrideChange:      (v: { movementType: string; priceUsd: string; feeUsd: string }) => void;
  onClearSelectedImport: () => void;
  isSyncing:             boolean;
}) {
  const monthLabel = `${MONTH_NAME[month.month]?.charAt(0).toUpperCase()}${MONTH_NAME[month.month]?.slice(1)} ${month.year}`;
  const pendingCount = imports.filter(r => r.status === "PENDING").length;
  const reviewCount  = imports.filter(r => r.status === "REVIEW").length;

  return (
    <div style={{ position: "absolute", inset: 0, background: "#0F172A", zIndex: 10, display: "flex", flexDirection: "column" }}>

      {/* Overlay header */}
      <div style={{ padding: "0.75rem 1.25rem", borderBottom: "1px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", gap: "12px", flexShrink: 0 }}>
        <button type="button" onClick={onBack} style={{ background: "none", border: "none", color: "#64748B", cursor: "pointer", fontSize: "13px", padding: 0, fontFamily: fonts.body }}>← Volver</button>
        <span style={{ fontSize: "13px", fontWeight: 700, color: "#F1F5F9", flex: 1 }}>{monthLabel}</span>
        {pendingCount > 0 && (
          <span style={{ fontSize: "11px", fontWeight: 700, color: "#F59E0B", background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: "4px", padding: "2px 8px" }}>
            {pendingCount} pendiente{pendingCount !== 1 ? "s" : ""}
          </span>
        )}
        {reviewCount > 0 && (
          <span style={{ fontSize: "11px", fontWeight: 700, color: "#FCD34D", background: "rgba(252,211,77,0.08)", border: "1px solid rgba(252,211,77,0.2)", borderRadius: "4px", padding: "2px 8px" }}>
            {reviewCount} revisión
          </span>
        )}
      </div>

      {/* Overlay body */}
      <div style={{ flex: 1, overflow: "hidden", position: "relative" }}>

        {/* Import detail overlay (on top of month review) */}
        {selectedImport && (() => {
          let norm: NormalizedJson = { movementType: selectedImport.externalType, symbol: "—", quantity: 0, priceUsd: 0, feeUsd: 0 };
          try { norm = JSON.parse(selectedImport.normalizedJson ?? "{}") as NormalizedJson; } catch { /* noop */ }
          const ev            = evBadgeStyle(selectedImport.normalizedEventType);
          const tt            = taxTreatmentLabel(selectedImport.taxTreatment);
          const reason        = reviewReason(selectedImport);
          const needsReview   = selectedImport.taxTreatment === "REVIEW" || selectedImport.inventoryEffect === "REVIEW";
          const priceValid    = !needsReview || (overrideForm.priceUsd !== "" && Number(overrideForm.priceUsd) >= 0);
          const inputBase     = { width: "100%", padding: "5px 8px", borderRadius: "6px", border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.06)", color: "#F1F5F9", fontSize: "12px", fontFamily: fonts.body, boxSizing: "border-box" as const, outline: "none" };

          return (
            <div style={{ position: "absolute", inset: 0, background: "#0F172A", zIndex: 5, display: "flex", flexDirection: "column" }}>
              <div style={{ padding: "0.75rem 1rem", borderBottom: "1px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
                <button type="button" onClick={onClearSelectedImport} style={{ background: "none", border: "none", color: "#64748B", cursor: "pointer", fontSize: "13px", padding: 0, fontFamily: fonts.body }}>← Volver</button>
                <span style={{ fontSize: "12px", fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.06em" }}>Detalle del evento</span>
              </div>
              <div style={{ flex: 1, overflowY: "auto", padding: "1rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                  <span style={{ fontSize: "11px", fontWeight: 700, color: ev.color, background: ev.bg, border: `1px solid ${ev.color}30`, borderRadius: "4px", padding: "3px 8px" }}>{selectedImport.normalizedEventType ?? selectedImport.externalType}</span>
                  <span style={{ fontSize: "15px", fontWeight: 700, color: "#F1F5F9" }}>{norm.symbol}</span>
                  <span style={{ fontSize: "12px", color: "#64748B" }}>{new Date(selectedImport.occurredAt).toLocaleString("es-CL", { dateStyle: "medium", timeStyle: "short" })}</span>
                </div>
                <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "8px", padding: "0.75rem", display: "flex", flexDirection: "column", gap: "6px" }}>
                  {([
                    ["Cantidad",   norm.quantity > 0 ? norm.quantity.toFixed(8).replace(/\.?0+$/, "") : "—"],
                    ["Precio USD", norm.priceUsd > 0 ? `$${norm.priceUsd.toFixed(2)}` : "—"],
                    ["Fee USD",    norm.feeUsd > 0   ? `$${norm.feeUsd.toFixed(4)}`   : "$0"],
                    ["Fuente",     "Binance · " + selectedImport.externalType],
                    ["ID externo", selectedImport.externalId],
                  ] as [string, string][]).map(([label, value]) => (
                    <div key={label} style={{ display: "flex", justifyContent: "space-between", gap: "8px" }}>
                      <span style={{ fontSize: "11px", color: "#475569" }}>{label}</span>
                      <span style={{ fontSize: "11px", color: "#94A3B8", fontFamily: "monospace", textAlign: "right", wordBreak: "break-all" }}>{value}</span>
                    </div>
                  ))}
                </div>
                <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "8px", padding: "0.75rem", display: "flex", flexDirection: "column", gap: "6px" }}>
                  <p style={{ fontSize: "11px", fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 4px" }}>Clasificación LEDGERA</p>
                  {([
                    ["Tratamiento tributario", <span key="tt" style={{ color: tt.color, fontWeight: 600 }}>{tt.label}</span>],
                    ["Efecto inventario FIFO", selectedImport.inventoryEffect ?? "—"],
                    ["Efecto económico",       selectedImport.economicEffect  ?? "—"],
                  ] as [string, React.ReactNode][]).map(([label, value]) => (
                    <div key={String(label)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px" }}>
                      <span style={{ fontSize: "11px", color: "#475569" }}>{label}</span>
                      <span style={{ fontSize: "11px", color: "#94A3B8" }}>{value}</span>
                    </div>
                  ))}
                </div>
                <div style={{ background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: "8px", padding: "0.75rem" }}>
                  <p style={{ fontSize: "11px", fontWeight: 700, color: "#F59E0B", margin: "0 0 4px" }}>⚠ Razón de revisión</p>
                  <p style={{ fontSize: "12px", color: "#94A3B8", margin: 0, lineHeight: 1.5 }}>{reason}</p>
                </div>

                {needsReview && (
                  <div style={{ background: "rgba(96,165,250,0.06)", border: "1px solid rgba(96,165,250,0.2)", borderRadius: "8px", padding: "0.875rem" }}>
                    <p style={{ fontSize: "11px", fontWeight: 700, color: "#93C5FD", margin: "0 0 10px", textTransform: "uppercase", letterSpacing: "0.06em" }}>Resolver manualmente</p>
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      <div>
                        <p style={{ fontSize: "10px", color: "#64748B", margin: "0 0 4px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Tipo de movimiento</p>
                        <div style={{ display: "flex", gap: "6px" }}>
                          {(["BUY","SELL","DEPOSIT","WITHDRAW"] as const).map(t => (
                            <button key={t} type="button"
                              onClick={() => onOverrideChange({ ...overrideForm, movementType: t })}
                              style={{ flex: 1, padding: "5px 4px", borderRadius: "5px", border: `1px solid ${overrideForm.movementType === t ? "rgba(96,165,250,0.5)" : "rgba(255,255,255,0.08)"}`, background: overrideForm.movementType === t ? "rgba(96,165,250,0.15)" : "rgba(255,255,255,0.03)", color: overrideForm.movementType === t ? "#93C5FD" : "#475569", fontSize: "10px", fontWeight: 700, cursor: "pointer", fontFamily: fonts.body }}>
                              {t}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                        <div>
                          <p style={{ fontSize: "10px", color: "#64748B", margin: "0 0 4px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Precio USD</p>
                          <input type="number" min="0" step="any" placeholder={norm.priceUsd > 0 ? norm.priceUsd.toFixed(2) : "0.00"} value={overrideForm.priceUsd} onChange={e => onOverrideChange({ ...overrideForm, priceUsd: e.target.value })} style={inputBase} />
                        </div>
                        <div>
                          <p style={{ fontSize: "10px", color: "#64748B", margin: "0 0 4px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Fee USD</p>
                          <input type="number" min="0" step="any" placeholder="0.00" value={overrideForm.feeUsd} onChange={e => onOverrideChange({ ...overrideForm, feeUsd: e.target.value })} style={inputBase} />
                        </div>
                      </div>
                    </div>
                    <button type="button"
                      disabled={!priceValid || confirmingId === selectedImport.id}
                      onClick={() => onImportAction(selectedImport.id, "CONFIRM", { movementType: overrideForm.movementType, priceUsd: Number(overrideForm.priceUsd || norm.priceUsd), feeUsd: Number(overrideForm.feeUsd || 0) })}
                      style={{ marginTop: "10px", width: "100%", padding: "8px", borderRadius: "7px", border: "1px solid rgba(96,165,250,0.3)", background: priceValid ? "rgba(96,165,250,0.12)" : "rgba(255,255,255,0.03)", color: priceValid ? "#93C5FD" : "#334155", fontSize: "12px", fontWeight: 600, cursor: priceValid ? "pointer" : "not-allowed", fontFamily: fonts.body }}>
                      {confirmingId === selectedImport.id ? "Confirmando..." : "✓ Confirmar con ajustes"}
                    </button>
                  </div>
                )}

                <div style={{ display: "flex", gap: "8px", paddingTop: "4px" }}>
                  {!needsReview && (
                    <button type="button" onClick={() => onImportAction(selectedImport.id, "CONFIRM")}
                      style={{ flex: 1, padding: "8px", borderRadius: "7px", border: "1px solid rgba(22,163,74,0.3)", background: "rgba(22,163,74,0.08)", color: "#4ADE80", fontSize: "12px", fontWeight: 600, cursor: "pointer", fontFamily: fonts.body }}>
                      ✓ Confirmar
                    </button>
                  )}
                  <button type="button" onClick={() => onImportAction(selectedImport.id, "REJECT")}
                    style={{ flex: needsReview ? undefined : 1, width: needsReview ? "100%" : undefined, padding: "8px", borderRadius: "7px", border: "1px solid rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.08)", color: "#F87171", fontSize: "12px", fontWeight: 600, cursor: "pointer", fontFamily: fonts.body }}>
                    ✗ Rechazar
                  </button>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Month imports list */}
        <div style={{ height: "100%", overflowY: "auto", display: "flex", flexDirection: "column" }}>

          {/* CTA: confirmar todo */}
          {pendingCount > 0 && (
            <div style={{ padding: "0.75rem 1.25rem", borderBottom: "1px solid rgba(255,255,255,0.06)", flexShrink: 0 }}>
              <button type="button" onClick={onConfirmAll} disabled={confirmingAll}
                style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "none", background: confirmingAll ? "rgba(22,163,74,0.3)" : "#16A34A", color: "#fff", fontSize: "13px", fontWeight: 700, cursor: confirmingAll ? "not-allowed" : "pointer", fontFamily: fonts.body }}>
                {confirmingAll ? "Confirmando…" : `Confirmar ${pendingCount} operación${pendingCount !== 1 ? "es" : ""} segura${pendingCount !== 1 ? "s" : ""}`}
              </button>
              {reviewCount > 0 && (
                <p style={{ fontSize: "11px", color: "#64748B", margin: "6px 0 0", textAlign: "center" }}>
                  {reviewCount} event{reviewCount !== 1 ? "os requieren" : "o requiere"} revisión manual — aparecen abajo.
                </p>
              )}
            </div>
          )}

          {/* Alert inside overlay */}
          {msg && (
            <div style={{ margin: "0.75rem 1.25rem 0", fontSize: "12px", color: msg.type === "success" ? "#4ADE80" : msg.type === "error" ? "#F87171" : "#FCD34D", background: msg.type === "success" ? "rgba(22,163,74,0.06)" : msg.type === "error" ? "rgba(239,68,68,0.06)" : "rgba(245,158,11,0.06)", border: `1px solid ${msg.type === "success" ? "rgba(22,163,74,0.2)" : msg.type === "error" ? "rgba(239,68,68,0.2)" : "rgba(245,158,11,0.2)"}`, borderRadius: "8px", padding: "10px 14px" }}>
              {msg.text}
            </div>
          )}

          {loadingImports ? (
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "#475569", fontSize: "12px" }}>Cargando...</div>
          ) : imports.length === 0 ? (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "12px", padding: "2rem 1.25rem", textAlign: "center" }}>
              <p style={{ color: "#334155", fontSize: "13px", margin: 0 }}>Sin operaciones en {monthLabel.toLowerCase()}.</p>
              <button type="button" onClick={() => onSyncMonth(month.year, month.month)} disabled={isSyncing}
                style={{ padding: "7px 16px", borderRadius: "7px", border: "1px solid rgba(22,163,74,0.3)", background: "rgba(22,163,74,0.08)", color: isSyncing ? "#475569" : "#4ADE80", fontSize: "12px", fontWeight: 600, cursor: isSyncing ? "not-allowed" : "pointer", fontFamily: fonts.body }}>
                {isSyncing ? "Sincronizando…" : "Sincronizar este mes"}
              </button>
            </div>
          ) : (
            imports.map(record => {
              let norm: NormalizedJson = { movementType: record.externalType, symbol: "—", quantity: 0, priceUsd: 0, feeUsd: 0 };
              try { norm = JSON.parse(record.normalizedJson ?? "{}") as NormalizedJson; } catch { /* noop */ }
              const isProcessing  = confirmingId === record.id;
              const cannotConfirm = record.taxTreatment === "REVIEW" || record.inventoryEffect === "REVIEW";
              const isReview      = record.status === "REVIEW";
              const ev            = evBadgeStyle(record.normalizedEventType);
              return (
                <div key={record.id} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 1.25rem", borderBottom: "1px solid rgba(255,255,255,0.04)", flexWrap: "wrap", opacity: isReview ? 0.65 : 1 }}>
                  <span style={{ fontSize: "10px", fontWeight: 700, color: ev.color, background: ev.bg, border: `1px solid ${ev.color}30`, borderRadius: "4px", padding: "2px 6px", whiteSpace: "nowrap", flexShrink: 0 }}>{record.normalizedEventType ?? record.externalType}</span>
                  <span style={{ fontSize: "12px", color: "#CBD5E1", fontWeight: 600, flexShrink: 0 }}>{norm.symbol}</span>
                  <span style={{ fontSize: "11px", color: "#64748B", fontFamily: "monospace", flexShrink: 0 }}>{norm.quantity > 0 ? norm.quantity.toFixed(6).replace(/\.?0+$/, "") : "—"}</span>
                  <span style={{ flex: 1, fontSize: "11px", color: "#475569", whiteSpace: "nowrap" }}>{new Date(record.occurredAt).toLocaleDateString("es-CL", { dateStyle: "short" })}</span>
                  {isReview && <span style={{ fontSize: "10px", color: "#FCD34D", flexShrink: 0 }}>revisión</span>}
                  <div style={{ display: "flex", gap: "4px", flexShrink: 0 }}>
                    <button type="button" onClick={() => onSelectImport(record)} title="Ver detalle"
                      style={{ padding: "4px 8px", borderRadius: "5px", border: "1px solid rgba(148,163,184,0.2)", background: "rgba(255,255,255,0.04)", color: "#94A3B8", fontSize: "11px", cursor: "pointer" }}>?</button>
                    <button type="button" onClick={() => !cannotConfirm && onImportAction(record.id, "CONFIRM")} disabled={isProcessing || cannotConfirm} title={cannotConfirm ? "Ver detalle para resolver" : "Confirmar"}
                      style={{ padding: "4px 8px", borderRadius: "5px", border: "1px solid rgba(22,163,74,0.3)", background: cannotConfirm ? "rgba(255,255,255,0.03)" : "rgba(22,163,74,0.08)", color: cannotConfirm ? "#334155" : "#4ADE80", fontSize: "11px", cursor: isProcessing || cannotConfirm ? "not-allowed" : "pointer", opacity: isProcessing ? 0.5 : 1 }}>✓</button>
                    <button type="button" onClick={() => onImportAction(record.id, "REJECT")} disabled={isProcessing} title="Rechazar"
                      style={{ padding: "4px 8px", borderRadius: "5px", border: "1px solid rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.08)", color: "#F87171", fontSize: "11px", cursor: isProcessing ? "not-allowed" : "pointer", opacity: isProcessing ? 0.5 : 1 }}>✗</button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
