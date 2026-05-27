"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { fonts } from "@/styles/tokens";
import { httpClient } from "@/shared/http/httpClient";

// ── Types ──────────────────────────────────────────────────────────────────────

type ConnectionStatus = {
  connected:       boolean;
  status?:         string;
  lastSyncAt?:     string | null;
  lastSyncStatus?: string | null;
  lastSyncError?:  string | null;
};

type TaxConnectionStatus = {
  connected: boolean;
};

type SyncResult = {
  imported:      number;
  autoConfirmed: number;
  pendingReview: number;
  errors:        string[];
};

type TaxImportResult = {
  imported:    number;
  skipped:     number;
  deposits:    number;
  withdrawals: number;
};

type BulkConfirmResult = {
  confirmed:     number;
  skippedReview: number;
  taxRebuilt:    boolean;
  errors:        string[];
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
  id:           string;
  provider:     string;
  externalType: string;
  status:       string;
  occurredAt:   string;
};

type ApiResponse<T> = { ok: boolean; message: string; data: T };

type DaySummary = {
  date: string;
  day: number;
  taxImports: number;
  spotImports: number;
  portfolioMovements: number;
  bankMovements: number;
  matched: number;
  ignored: number;
  hasActivity: boolean;
};

type DailyCalendarData = {
  year: number;
  month: number;
  days: DaySummary[];
};

type DailySuggestion = {
  bankMovementId: string;
  portfolioMovementId: string | null;
  exchangeExternalId: string;
  exchangeProvider: string;
  confidence: number;
  eventLabel: string;
  certainty: "HIGH" | "MEDIUM" | "LOW";
  bank: {
    occurredAt: string;
    description: string;
    amountClp: number;
    direction: "INFLOW" | "OUTFLOW";
  };
  exchange: {
    occurredAt: string;
    provider: string;
    externalId: string;
    eventType: string;
    asset: string;
    quantity: number;
    priceUsd: number;
    estimatedUsd: number;
  };
};

type DailyDetailsData = {
  date: string;
  imports: unknown[];
  portfolioMovements: unknown[];
  bankMovements: unknown[];
  matches: unknown[];
  suggestions: DailySuggestion[];
};

// ── Constants ─────────────────────────────────────────────────────────────────

const MONTH_ABBR = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
const MONTH_NAME: Record<number, string> = {
  1:"enero",2:"febrero",3:"marzo",4:"abril",5:"mayo",6:"junio",
  7:"julio",8:"agosto",9:"septiembre",10:"octubre",11:"noviembre",12:"diciembre",
};
const CALENDAR_START_YEAR = 2018;
const YEAR_STORAGE_KEY    = "ledgera.binance.visibleYear";

function readStoredYear(): number {
  if (typeof window === "undefined") return new Date().getFullYear();
  const v = Number(window.sessionStorage.getItem(YEAR_STORAGE_KEY));
  const y = new Date().getFullYear();
  return Number.isInteger(v) && v >= CALENDAR_START_YEAR && v <= y ? v : y;
}

function writeStoredYear(year: number) {
  if (typeof window !== "undefined") window.sessionStorage.setItem(YEAR_STORAGE_KEY, String(year));
}

// ── Month dots ────────────────────────────────────────────────────────────────

type MonthDots = {
  tax:   "none" | "pending";
  spot:  "none" | "done" | "failed";
  total: number;
};

// ── MonthPill ─────────────────────────────────────────────────────────────────

function MonthPill({ label, period, dots, onClick, syncing, future, lastSynced }: {
  label:       string;
  period?:     SyncPeriod;
  dots:        MonthDots;
  onClick?:    () => void;
  syncing?:    boolean;
  future?:     boolean;
  lastSynced?: boolean;
}) {
  const hasPending  = dots.total > 0;
  const isCompleted = period?.status === "COMPLETED" || period?.status === "EMPTY";
  const hasFailed   = period?.status === "FAILED";

  let bg        = "#F8FAFC";
  let border    = "#E2E8F0";
  let textColor = "#334155";

  if      (future)      { bg = "transparent";                 border = "#F1F5F9";                textColor = "#CBD5E1"; }
  else if (syncing)     { bg = "rgba(240,185,11,0.08)";       border = "rgba(240,185,11,0.5)";   textColor = "#B45309"; }
  else if (lastSynced)  { bg = "rgba(22,163,74,0.08)";        border = "rgba(22,163,74,0.4)";    textColor = "#16A34A"; }
  else if (hasPending)  { bg = "rgba(245,158,11,0.06)";       border = "rgba(245,158,11,0.35)";  textColor = "#D97706"; }
  else if (isCompleted) { bg = "rgba(22,163,74,0.05)";        border = "rgba(22,163,74,0.2)";    textColor = "#475569"; }
  else if (hasFailed)   { bg = "rgba(239,68,68,0.05)";        border = "rgba(239,68,68,0.2)";    textColor = "#DC2626"; }

  // d1 = Tax, d2 = Spot, d3 = Pendiente
  const d1 = dots.tax  === "pending" ? "#F59E0B" : isCompleted ? "#22C55E" : "#CBD5E1";
  const d2 = dots.spot === "done"    ? "#22C55E" : dots.spot === "failed"  ? "#F87171" : "#CBD5E1";
  const d3 = hasPending              ? "#F59E0B" : isCompleted             ? "#22C55E" : "#CBD5E1";

  return (
    <button
      type="button"
      onClick={future ? undefined : onClick}
      disabled={future}
      title={syncing ? `${label}: sincronizando…` : future ? label : `${label}: clic para sincronizar`}
      style={{
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        gap: "8px", padding: "14px 8px", borderRadius: "10px",
        background: syncing ? "rgba(240,185,11,0.12)" : bg,
        border: `1px solid ${syncing ? "rgba(240,185,11,0.6)" : border}`,
        cursor: future ? "default" : "pointer",
        transition: "background 0.15s, border-color 0.15s",
        fontFamily: fonts.body, outline: "none",
      }}
    >
      <span style={{ fontSize: "13px", fontWeight: 600, color: textColor, lineHeight: 1 }}>
        {syncing
          ? <span style={{ animation: "bn-blink 1s ease-in-out infinite", display: "inline-block" }}>…</span>
          : label}
      </span>
      {!future && (
        <span style={{ display: "flex", gap: "4px" }}>
          <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: d1 }} />
          <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: d2 }} />
          <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: d3 }} />
        </span>
      )}
      {!future && !syncing && period && period.importedCount > 0 && (
        <span style={{ fontSize: "9px", color: textColor, opacity: 0.7, lineHeight: 1, fontWeight: 500 }}>
          {period.importedCount}
        </span>
      )}
    </button>
  );
}

// ── DailyCalendarGrid ─────────────────────────────────────────────────────────

function DailyCalendarGrid({
  data,
  selectedDay,
  onSelectDay,
}: {
  data:         DailyCalendarData;
  selectedDay?: string | null;
  onSelectDay:  (date: string) => void;
}) {
  const firstDay  = new Date(data.year, data.month - 1, 1);
  const totalDays = new Date(data.year, data.month, 0).getDate();

  const startOffset = (firstDay.getDay() + 6) % 7; // lunes = 0
  const dayMap = new Map(data.days.map((day) => [day.day, day]));

  const cells: Array<DaySummary | null> = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= totalDays; d++)  cells.push(dayMap.get(d) ?? null);

  const weekdays  = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
  const monthName = MONTH_NAME[data.month] ?? String(data.month);

  return (
    <div style={{
      background: "#FFFFFF", border: "1px solid #E2E8F0",
      borderRadius: "12px", padding: "14px",
      display: "flex", flexDirection: "column", gap: "12px",
    }}>
      <p style={{ fontSize: "14px", fontWeight: 700, color: "#0F2A3D", margin: 0, textTransform: "capitalize" }}>
        {monthName} {data.year}
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "6px" }}>
        {weekdays.map((wd) => (
          <div key={wd} style={{ fontSize: "10px", fontWeight: 700, color: "#94A3B8", textAlign: "center", padding: "4px 0" }}>
            {wd}
          </div>
        ))}

        {cells.map((day, index) => {
          if (!day) return <div key={`empty-${index}`} />;

          const active   = day.hasActivity;
          const selected = selectedDay === day.date;

          return (
            <button
              key={day.date}
              type="button"
              disabled={!active}
              onClick={() => active && onSelectDay(day.date)}
              style={{
                minHeight: "74px", borderRadius: "10px",
                border: selected ? "1px solid #16A34A" : active ? "1px solid #C7D2FE" : "1px solid #E2E8F0",
                background: selected ? "rgba(22,163,74,0.08)" : active ? "#F8FAFC" : "#FFFFFF",
                cursor: active ? "pointer" : "default",
                padding: "8px 6px", display: "flex", flexDirection: "column",
                alignItems: "center", gap: "4px",
                opacity: active ? 1 : 0.45, fontFamily: fonts.body,
              }}
            >
              <span style={{ fontSize: "13px", fontWeight: 700, color: active ? "#0F2A3D" : "#94A3B8" }}>
                {day.day}
              </span>

              {active && (
                <div style={{
                  display: "flex", flexDirection: "column", gap: "2px",
                  alignItems: "center", fontSize: "9px", lineHeight: 1.2, color: "#64748B",
                }}>
                  {day.taxImports > 0    && <span>Tax {day.taxImports}</span>}
                  {day.spotImports > 0   && <span>Spot {day.spotImports}</span>}
                  {day.bankMovements > 0 && <span>Banco {day.bankMovements}</span>}
                  {day.matched > 0       && <span>Match {day.matched}</span>}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Main drawer ───────────────────────────────────────────────────────────────

export function BinanceSyncDrawer({ onClose, onSyncComplete }: {
  onClose:         () => void;
  onSyncComplete?: () => void;
}) {
  const [conn,            setConn]            = useState<ConnectionStatus | null>(null);
  const [loadingConn,     setLoadingConn]     = useState(true);
  const [calendar,        setCalendar]        = useState<CalendarData | null>(null);
  const [allImports,      setAllImports]      = useState<ImportRecord[]>([]);
  const [syncingMonth,    setSyncingMonth]    = useState<{ year: number; month: number } | null>(null);
  const [lastSyncedMonth, setLastSyncedMonth] = useState<{ year: number; month: number } | null>(null);
  const [taxConn,         setTaxConn]         = useState<TaxConnectionStatus | null>(null);
  const [dailyCalendar,   setDailyCalendar]   = useState<DailyCalendarData | null>(null);
  const [loadingDaily,    setLoadingDaily]    = useState(false);
  const [selectedDay,     setSelectedDay]     = useState<string | null>(null);
  const [dailyDetails,    setDailyDetails]    = useState<DailyDetailsData | null>(null);
  const [loadingDetails,  setLoadingDetails]  = useState(false);
  const [msg,             setMsg]             = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);
  const [visibleYear,     setVisibleYear]     = useState(readStoredYear);

  const currentYear  = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  function keepVisibleYear(year: number) {
    writeStoredYear(year);
    setVisibleYear(year);
  }

  // ── Data loaders ──────────────────────────────────────────────────────────────

  const loadStatus = useCallback(async () => {
    setLoadingConn(true);
    try {
      const res = await httpClient<ApiResponse<{
        connected: boolean;
        connection: { status: string; lastSyncAt: string | null } | null;
      }>>("/api/integrations/binance/connection", { auth: true });
      setConn({
        connected:  res.data.connected,
        status:     res.data.connection?.status,
        lastSyncAt: res.data.connection?.lastSyncAt ?? null,
      });
    } catch {
      setConn({ connected: false });
    } finally {
      setLoadingConn(false);
    }
  }, []);

  const loadCalendar = useCallback(async () => {
    try {
      const res = await httpClient<ApiResponse<CalendarData>>("/api/integrations/binance/sync/calendar", { auth: true });
      setCalendar(res.data);
    } catch { /* silent */ }
  }, []);

  const loadImports = useCallback(async () => {
    try {
      const res = await httpClient<ApiResponse<ImportRecord[]>>("/api/integrations/binance/imports", { auth: true });
      setAllImports(res.data ?? []);
    } catch {
      setAllImports([]);
    }
  }, []);

  const loadTaxStatus = useCallback(async () => {
    try {
      const res = await httpClient<ApiResponse<TaxConnectionStatus>>("/api/integrations/binance/tax/connect", { auth: true });
      setTaxConn(res.data);
    } catch {
      setTaxConn({ connected: false });
    }
  }, []);

  const loadDailyCalendar = useCallback(async (year: number, month: number) => {
    setLoadingDaily(true);
    try {
      const res = await httpClient<ApiResponse<DailyCalendarData>>(
        `/api/integrations/binance/sync/calendar/days?year=${year}&month=${month}`,
        { auth: true },
      );
      setDailyCalendar(res.data);
    } catch {
      setDailyCalendar(null);
    } finally {
      setLoadingDaily(false);
    }
  }, []);

  const loadDailyDetails = useCallback(async (date: string) => {
    setSelectedDay(date);
    setLoadingDetails(true);
    try {
      const res = await httpClient<ApiResponse<DailyDetailsData>>(
        `/api/integrations/binance/sync/calendar/day-details?date=${date}`,
        { auth: true },
      );
      setDailyDetails(res.data);
    } catch {
      setDailyDetails(null);
    } finally {
      setLoadingDetails(false);
    }
  }, []);

  // ── Effects ───────────────────────────────────────────────────────────────────

  useEffect(() => { void loadStatus(); }, [loadStatus]);

  useEffect(() => {
    if (conn?.connected && conn.status === "CONNECTED") {
      void loadCalendar();
      void loadImports();
      void loadTaxStatus();
    }
  }, [conn, loadCalendar, loadImports, loadTaxStatus]);

  // Restaura el año desde sessionStorage tras cada recarga (sobrevive remount).
  useEffect(() => {
    setVisibleYear(readStoredYear());
  }, [calendar, allImports]);

  // ── Derived data ──────────────────────────────────────────────────────────────

  const periodsByKey = useMemo(() => {
    const map = new Map<string, SyncPeriod>();
    for (const p of calendar?.periods ?? []) map.set(`${p.year}-${p.month}`, p);
    return map;
  }, [calendar]);

  const dotsByMonth = useMemo(() => {
    const map = new Map<string, MonthDots>();

    for (const p of calendar?.periods ?? []) {
      map.set(`${p.year}-${p.month}`, {
        tax:   "none",
        spot:  p.status === "COMPLETED" || p.status === "EMPTY" ? "done"
               : p.status === "FAILED" ? "failed" : "none",
        total: 0,
      });
    }

    for (const r of allImports) {
      const d   = new Date(r.occurredAt);
      const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
      const cur = map.get(key) ?? { tax: "none" as const, spot: "none" as const, total: 0 };
      if (r.provider === "BINANCE_TAX") cur.tax = "pending";
      cur.total++;
      map.set(key, cur);
    }

    return map;
  }, [allImports, calendar]);

  // ── Reconciliation actions ────────────────────────────────────────────────────

  async function handleConfirmDailySuggestion(s: DailySuggestion) {
    if (!selectedDay || !s.portfolioMovementId) return;

    try {
      await httpClient("/api/bank/reconciliation/confirm", {
        method: "POST",
        auth: true,
        body: {
          bankMovementId:      s.bankMovementId,
          portfolioMovementId: s.portfolioMovementId,
          confidence:          s.confidence,
          reason:              `${s.eventLabel} · ${s.exchange.provider} · ${s.exchange.eventType}`,
        },
      });

      await loadDailyDetails(selectedDay);
      await loadDailyCalendar(dailyCalendar!.year, dailyCalendar!.month);
    } catch {
      setMsg({ type: "error", text: "No se pudo confirmar la conciliación." });
    }
  }

  async function handleIgnoreDailySuggestion(s: DailySuggestion) {
    if (!selectedDay) return;

    try {
      await httpClient("/api/bank/reconciliation/reject", {
        method: "POST",
        auth: true,
        body: { bankMovementId: s.bankMovementId },
      });

      await loadDailyDetails(selectedDay);
      await loadDailyCalendar(dailyCalendar!.year, dailyCalendar!.month);
    } catch {
      setMsg({ type: "error", text: "No se pudo ignorar la sugerencia." });
    }
  }

  // ── Sync flow ─────────────────────────────────────────────────────────────────

  async function handleClickMonth(year: number, month: number) {
    if (syncingMonth) return;
    keepVisibleYear(year);
    void loadDailyCalendar(year, month);
    setSyncingMonth({ year, month });
    setLastSyncedMonth(null);
    setMsg(null);

    const parts: string[] = [];

    // 1. Tax API import
    if (taxConn?.connected) {
      try {
        const res = await httpClient<ApiResponse<TaxImportResult>>(
          "/api/integrations/binance/tax/import-transfers",
          { method: "POST", auth: true, body: { year, month } },
        );
        if (res.data.imported > 0) {
          const dep = res.data.deposits    > 0 ? `${res.data.deposits} dep`  : "";
          const ret = res.data.withdrawals > 0 ? `${res.data.withdrawals} ret` : "";
          parts.push(`Tax: ${[dep, ret].filter(Boolean).join(" · ")}`);
        }
      } catch { /* continue */ }
    }

    // 2. Spot sync (non-blocking — no detiene bulk-confirm si hay timeout)
    try {
      const res = await httpClient<ApiResponse<SyncResult>>(
        "/api/integrations/binance/sync",
        { method: "POST", auth: true, body: { year, month } },
      );
      parts.push(`Spot: ${res.data.imported} desc, ${res.data.autoConfirmed} conf`);
    } catch {
      parts.push("Spot: timeout");
    }

    // 3. Bulk-confirm → crea portfolioMovements + rebuild taxEvents
    try {
      const bulk = await httpClient<ApiResponse<BulkConfirmResult>>(
        "/api/integrations/binance/imports/bulk-confirm",
        { method: "POST", auth: true, body: { year, month } },
      );
      if (bulk.data.confirmed > 0 || bulk.data.skippedReview > 0) {
        parts.push(`${bulk.data.confirmed} confirmados${bulk.data.skippedReview > 0 ? `, ${bulk.data.skippedReview} revisión` : ""}`);
      }
    } catch { /* silent */ }

    const monthLabel = `${(MONTH_NAME[month] ?? "").charAt(0).toUpperCase()}${(MONTH_NAME[month] ?? "").slice(1)} ${year}`;
    setMsg({ type: "success", text: `${monthLabel}: ${parts.join(" · ")}.` });

    await Promise.all([loadCalendar(), loadImports(), loadStatus()]);
    keepVisibleYear(year);
    setLastSyncedMonth({ year, month });
    setSyncingMonth(null);
    onSyncComplete?.();
  }

  const isConnected = conn?.connected && conn.status === "CONNECTED";

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <>
      <style>{`
        @keyframes bn-spin  { to { transform: rotate(360deg); } }
        @keyframes bn-blink { 0%,100% { opacity:1; } 50% { opacity:0.3; } }
      `}</style>

      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{ position: "fixed", inset: 0, background: "rgba(15,42,61,0.35)", zIndex: 900 }}
      />

      {/* Drawer panel */}
      <div style={{
        position: "fixed", top: 0, right: 0, width: "520px", maxWidth: "100vw",
        height: "100vh", background: "#FFFFFF", zIndex: 901,
        display: "flex", flexDirection: "column",
        boxShadow: "-8px 0 40px rgba(15,42,61,0.12)",
        fontFamily: fonts.body,
      }}>

        {/* Header */}
        <div style={{
          padding: "1.125rem 1.25rem",
          borderBottom: "1px solid #E2E8F0",
          display: "flex", alignItems: "center", gap: "12px", flexShrink: 0,
          background: "#FFFFFF",
        }}>
          {/* BN logo */}
          <div style={{
            width: "38px", height: "38px", borderRadius: "10px",
            background: "rgba(240,185,11,0.1)", border: "1px solid rgba(240,185,11,0.3)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "11px", fontWeight: 800, color: "#F0B90B",
            fontFamily: fonts.body, flexShrink: 0, letterSpacing: "0.02em",
          }}>BN</div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: "15px", fontWeight: 700, color: "#0F2A3D", margin: 0, lineHeight: 1.2 }}>Binance</p>
            <p style={{ fontSize: "11px", color: "#64748B", margin: 0 }}>Operaciones</p>
          </div>

          {!loadingConn && conn && (
            <span style={{
              fontSize: "11px", fontWeight: 600, padding: "4px 10px", borderRadius: "6px",
              background:  isConnected ? "rgba(22,163,74,0.08)" : "#F1F5F9",
              color:       isConnected ? "#16A34A"               : "#64748B",
              border:     `1px solid ${isConnected ? "rgba(22,163,74,0.25)" : "#E2E8F0"}`,
              whiteSpace: "nowrap",
            }}>
              {isConnected ? "Conectado" : "No conectado"}
            </span>
          )}

          <button
            type="button"
            onClick={onClose}
            style={{
              background: "none", border: "none", color: "#94A3B8",
              cursor: "pointer", fontSize: "20px", lineHeight: 1,
              padding: "4px", flexShrink: 0,
            }}
          >✕</button>
        </div>

        {/* Body */}
        <div style={{
          flex: 1, overflowY: "auto", padding: "1.25rem",
          display: "flex", flexDirection: "column", gap: "1rem",
          background: "#FAFBFC",
        }}>

          {/* Cargando conexión */}
          {loadingConn && (
            <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "#94A3B8", fontSize: "13px", padding: "2rem 0" }}>
              <div style={{
                width: "16px", height: "16px",
                border: "2px solid #E2E8F0", borderTop: "2px solid #F0B90B",
                borderRadius: "50%", animation: "bn-spin 0.8s linear infinite", flexShrink: 0,
              }} />
              Verificando conexión...
            </div>
          )}

          {/* Sin conexión */}
          {!loadingConn && !isConnected && (
            <div style={{
              display: "flex", flexDirection: "column", alignItems: "center",
              justifyContent: "center", flex: 1, textAlign: "center", gap: "10px",
              padding: "3rem 0",
            }}>
              <div style={{
                width: "48px", height: "48px", borderRadius: "12px",
                background: "#F1F5F9", border: "1px solid #E2E8F0",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "22px",
              }}>🔗</div>
              <p style={{ color: "#64748B", fontSize: "14px", margin: 0, fontWeight: 500 }}>
                Sin conexión con Binance
              </p>
              <p style={{ color: "#94A3B8", fontSize: "12px", margin: 0 }}>
                Configura tus credenciales para sincronizar operaciones.
              </p>
              <a
                href="/configuracion?s=integraciones"
                style={{
                  fontSize: "13px", fontWeight: 600, color: "#16A34A",
                  textDecoration: "none", padding: "8px 16px",
                  background: "rgba(22,163,74,0.08)", border: "1px solid rgba(22,163,74,0.2)",
                  borderRadius: "8px", marginTop: "4px",
                }}
              >
                Configurar credenciales →
              </a>
            </div>
          )}

          {/* Vista operacional — conectado */}
          {!loadingConn && isConnected && (
            <>
              {/* Título sección */}
              <div style={{ background: "#FFFFFF", borderRadius: "10px", border: "1px solid #E2E8F0", padding: "14px 16px" }}>
                <p style={{ fontSize: "14px", fontWeight: 700, color: "#0F2A3D", margin: "0 0 2px" }}>
                  Sincronización de operaciones
                </p>
                <p style={{ fontSize: "12px", color: "#64748B", margin: 0 }}>
                  Selecciona un mes para importar y confirmar operaciones.
                </p>
              </div>

              {/* Navegación de año */}
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                background: "#FFFFFF", borderRadius: "10px", border: "1px solid #E2E8F0",
                padding: "10px 16px",
              }}>
                <button
                  type="button"
                  onClick={() => keepVisibleYear(Math.max(CALENDAR_START_YEAR, visibleYear - 1))}
                  disabled={visibleYear <= CALENDAR_START_YEAR}
                  style={{
                    background: "none", border: "none", fontSize: "18px",
                    padding: "4px 12px", cursor: visibleYear <= CALENDAR_START_YEAR ? "default" : "pointer",
                    color: visibleYear <= CALENDAR_START_YEAR ? "#CBD5E1" : "#475569",
                    fontFamily: fonts.body,
                  }}
                >‹</button>

                <span style={{ fontSize: "16px", fontWeight: 700, color: "#0F2A3D" }}>{visibleYear}</span>

                <button
                  type="button"
                  onClick={() => keepVisibleYear(Math.min(currentYear, visibleYear + 1))}
                  disabled={visibleYear >= currentYear}
                  style={{
                    background: "none", border: "none", fontSize: "18px",
                    padding: "4px 12px", cursor: visibleYear >= currentYear ? "default" : "pointer",
                    color: visibleYear >= currentYear ? "#CBD5E1" : "#475569",
                    fontFamily: fonts.body,
                  }}
                >›</button>
              </div>

              {/* Grid de meses */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px" }}>
                {MONTH_ABBR.map((lbl, i) => {
                  const month     = i + 1;
                  const isFuture  = visibleYear === currentYear && month > currentMonth;
                  const isSyncing = syncingMonth?.year === visibleYear && syncingMonth?.month === month;
                  const isLast    = lastSyncedMonth?.year === visibleYear && lastSyncedMonth?.month === month && !isSyncing;
                  const key       = `${visibleYear}-${month}`;
                  const dots      = dotsByMonth.get(key) ?? { tax: "none" as const, spot: "none" as const, total: 0 };
                  return (
                    <MonthPill
                      key={i}
                      label={lbl}
                      period={periodsByKey.get(key)}
                      dots={dots}
                      onClick={() => handleClickMonth(visibleYear, month)}
                      syncing={isSyncing}
                      future={isFuture}
                      lastSynced={isLast}
                    />
                  );
                })}
              </div>

              {/* Detalle diario */}
              {loadingDaily && (
                <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#94A3B8", fontSize: "12px" }}>
                  <div style={{
                    width: "12px", height: "12px",
                    border: "2px solid #E2E8F0", borderTop: "2px solid #F0B90B",
                    borderRadius: "50%", animation: "bn-spin 0.8s linear infinite", flexShrink: 0,
                  }} />
                  Cargando calendario...
                </div>
              )}
              {dailyCalendar && !loadingDaily && (
                <DailyCalendarGrid
                  data={dailyCalendar}
                  selectedDay={selectedDay}
                  onSelectDay={loadDailyDetails}
                />
              )}

              {/* Panel detalle del día seleccionado */}
              {loadingDetails && (
                <p style={{ fontSize: "12px", color: "#94A3B8", margin: 0 }}>
                  Cargando detalle diario...
                </p>
              )}

              {dailyDetails && !loadingDetails && (
                <div style={{
                  background: "#FFFFFF", border: "1px solid #E2E8F0",
                  borderRadius: "10px", padding: "12px",
                  display: "flex", flexDirection: "column", gap: "10px",
                }}>
                  <p style={{ fontSize: "13px", fontWeight: 700, color: "#0F2A3D", margin: 0 }}>
                    Detalle {dailyDetails.date}
                  </p>

                  <p style={{ fontSize: "11px", color: "#64748B", margin: 0 }}>
                    Imports: {dailyDetails.imports.length} · Portfolio: {dailyDetails.portfolioMovements.length} · Banco: {dailyDetails.bankMovements.length} · Candidatos: {dailyDetails.suggestions.length}
                  </p>

                  {dailyDetails.suggestions.length > 0 && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      {dailyDetails.suggestions.map((s) => (
                        <div
                          key={`${s.bankMovementId}-${s.exchangeExternalId}`}
                          style={{
                            border: "1px solid #E2E8F0", borderRadius: "8px",
                            padding: "10px", background: "#F8FAFC",
                          }}
                        >
                          <p style={{ fontSize: "12px", fontWeight: 700, color: "#0F2A3D", margin: "0 0 4px" }}>
                            {s.eventLabel} · {s.certainty}
                          </p>
                          <p style={{ fontSize: "11px", color: "#64748B", margin: "0 0 4px" }}>
                            Banco: {s.bank.description} · CLP {Math.round(s.bank.amountClp).toLocaleString("es-CL")}
                          </p>
                          <p style={{ fontSize: "11px", color: "#64748B", margin: 0 }}>
                            Exchange: {s.exchange.provider} · {s.exchange.eventType} · {s.exchange.quantity} {s.exchange.asset}
                          </p>

                          <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "8px" }}>
                            <button
                              type="button"
                              onClick={() => handleIgnoreDailySuggestion(s)}
                              style={{
                                padding: "6px 10px", borderRadius: "7px",
                                border: "1px solid rgba(239,68,68,0.2)",
                                background: "rgba(239,68,68,0.06)", color: "#DC2626",
                                fontSize: "11px", fontWeight: 700, cursor: "pointer", fontFamily: fonts.body,
                              }}
                            >
                              Ignorar
                            </button>

                            <button
                              type="button"
                              disabled={!s.portfolioMovementId}
                              onClick={() => handleConfirmDailySuggestion(s)}
                              title={!s.portfolioMovementId ? "Sin movimiento de portafolio asociado" : undefined}
                              style={{
                                padding: "6px 10px", borderRadius: "7px",
                                border: "1px solid rgba(22,163,74,0.2)",
                                background: s.portfolioMovementId ? "rgba(22,163,74,0.08)" : "#F1F5F9",
                                color: s.portfolioMovementId ? "#16A34A" : "#94A3B8",
                                fontSize: "11px", fontWeight: 700,
                                cursor: s.portfolioMovementId ? "pointer" : "not-allowed",
                                fontFamily: fonts.body,
                              }}
                            >
                              Confirmar
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Leyenda dots */}
              <div style={{ display: "flex", gap: "16px", fontSize: "11px", color: "#94A3B8", alignItems: "center", paddingLeft: "2px" }}>
                <span style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                  <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#F59E0B", display: "inline-block" }} />
                  Tax
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                  <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#22C55E", display: "inline-block" }} />
                  Spot
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                  <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#F59E0B", display: "inline-block" }} />
                  Pendiente
                </span>
              </div>

              {/* Mensaje resultado de sync */}
              {msg && (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <div style={{
                    fontSize: "12px", lineHeight: 1.6, borderRadius: "8px", padding: "10px 14px",
                    color:      msg.type === "success" ? "#16A34A"  : msg.type === "error" ? "#DC2626" : "#2563EB",
                    background: msg.type === "success" ? "rgba(22,163,74,0.06)"    : msg.type === "error" ? "rgba(239,68,68,0.06)"    : "rgba(37,99,235,0.06)",
                    border:    `1px solid ${msg.type === "success"  ? "rgba(22,163,74,0.2)"    : msg.type === "error" ? "rgba(239,68,68,0.2)"    : "rgba(37,99,235,0.2)"}`,
                  }}>
                    {msg.text}
                  </div>
                  {msg.type === "success" && (
                    <a
                      href="/importaciones"
                      style={{
                        display:         "inline-flex",
                        alignItems:      "center",
                        justifyContent:  "center",
                        gap:             "6px",
                        padding:         "8px 16px",
                        borderRadius:    "8px",
                        background:      "#16A34A",
                        color:           "#ffffff",
                        fontSize:        "13px",
                        fontWeight:      600,
                        fontFamily:      fonts.body,
                        textDecoration:  "none",
                        transition:      "background 0.15s",
                      }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = "#15803D"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = "#16A34A"; }}
                    >
                      Revisar en Importaciones →
                    </a>
                  )}
                </div>
              )}

              {/* Última sincronización */}
              {conn?.lastSyncAt && (
                <p style={{ fontSize: "11px", color: "#94A3B8", margin: 0 }}>
                  Última sync:{" "}
                  {new Date(conn.lastSyncAt).toLocaleString("es-CL", { dateStyle: "short", timeStyle: "short" })}
                  {" "}{conn.lastSyncStatus === "OK" ? "✓" : "⚠"}
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
