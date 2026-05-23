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
    </button>
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

  // ── Effects ───────────────────────────────────────────────────────────────────

  useEffect(() => { void loadStatus(); }, [loadStatus]);

  useEffect(() => {
    if (conn?.connected && conn.status === "ACTIVE") {
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

  // ── Sync flow ─────────────────────────────────────────────────────────────────

  async function handleClickMonth(year: number, month: number) {
    if (syncingMonth) return;
    keepVisibleYear(year);
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

  const isConnected = conn?.connected && conn.status === "ACTIVE";

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
                <div style={{
                  fontSize: "12px", lineHeight: 1.6, borderRadius: "8px", padding: "10px 14px",
                  color:      msg.type === "success" ? "#16A34A"  : msg.type === "error" ? "#DC2626" : "#2563EB",
                  background: msg.type === "success" ? "rgba(22,163,74,0.06)"    : msg.type === "error" ? "rgba(239,68,68,0.06)"    : "rgba(37,99,235,0.06)",
                  border:    `1px solid ${msg.type === "success"  ? "rgba(22,163,74,0.2)"    : msg.type === "error" ? "rgba(239,68,68,0.2)"    : "rgba(37,99,235,0.2)"}`,
                }}>
                  {msg.text}
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
