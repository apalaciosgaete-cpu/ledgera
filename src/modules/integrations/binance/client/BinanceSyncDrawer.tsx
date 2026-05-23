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
  apiKeyHint?:     string;
};

type TaxConnectionStatus = {
  connected:   boolean;
  apiKeyHint?: string;
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
  id:          string;
  provider:    string;
  externalType: string;
  status:      string;
  occurredAt:  string;
};

type ApiResponse<T> = { ok: boolean; message: string; data: T };

// ── Constants ─────────────────────────────────────────────────────────────────

const MONTH_ABBR = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
const MONTH_NAME: Record<number, string> = {
  1:"enero",2:"febrero",3:"marzo",4:"abril",5:"mayo",6:"junio",
  7:"julio",8:"agosto",9:"septiembre",10:"octubre",11:"noviembre",12:"diciembre",
};
const CALENDAR_START_YEAR = 2018;

// ── Month dots ─────────────────────────────────────────────────────────────────
// dot1 = Tax API  (amber if pending TAX records, grey if none)
// dot2 = Spot API (green if COMPLETED/EMPTY, red if FAILED, grey otherwise)
// dot3 = State    (amber if pending records, green if all done, grey if no data)

type MonthDots = {
  tax:   "none" | "pending";
  spot:  "none" | "done" | "failed";
  total: number;
};

function MonthPill({ label, period, dots, onClick, syncing }: {
  label:    string;
  period?:  SyncPeriod;
  dots:     MonthDots;
  onClick?: () => void;
  syncing?: boolean;
}) {
  const hasPending   = dots.total > 0;
  const isCompleted  = period?.status === "COMPLETED" || period?.status === "EMPTY";
  const hasFailed    = period?.status === "FAILED";

  let bg     = "rgba(255,255,255,0.02)";
  let border = "rgba(255,255,255,0.07)";
  if      (syncing)     { bg = "rgba(240,185,11,0.08)"; border = "rgba(240,185,11,0.25)"; }
  else if (hasPending)  { bg = "rgba(245,158,11,0.08)"; border = "rgba(245,158,11,0.3)";  }
  else if (isCompleted) { bg = "rgba(22,163,74,0.07)";  border = "rgba(22,163,74,0.2)";   }
  else if (hasFailed)   { bg = "rgba(239,68,68,0.07)";  border = "rgba(239,68,68,0.2)";   }

  const d1 = dots.tax  === "pending"  ? "#F59E0B" : "#1e293b";
  const d2 = dots.spot === "done"     ? "#22C55E" : dots.spot === "failed" ? "#F87171" : "#1e293b";
  const d3 = hasPending ? "#F59E0B"   : isCompleted ? "#22C55E" : "#1e293b";

  const tip = syncing
    ? `${label}: sincronizando…`
    : hasPending
      ? `${label}: ${dots.total} pendiente${dots.total !== 1 ? "s" : ""} — clic para re-sincronizar`
      : isCompleted
        ? `${label}: al día — clic para re-sincronizar`
        : `${label}: sin datos — clic para sincronizar`;

  return (
    <span
      onClick={onClick}
      title={tip}
      style={{
        width: "32px", height: "40px",
        display: "inline-flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", gap: "4px",
        borderRadius: "5px",
        background: syncing ? "rgba(240,185,11,0.15)" : bg,
        border:     `1px solid ${syncing ? "rgba(240,185,11,0.5)" : border}`,
        flexShrink: 0, cursor: onClick ? "pointer" : "default", transition: "opacity 0.15s",
      }}
    >
      <span style={{ fontSize: "9px", color: "#64748B", lineHeight: 1 }}>{label}</span>
      {syncing ? (
        <span style={{ fontSize: "9px", fontWeight: 700, color: "#F0B90B", animation: "bn-blink 1s ease-in-out infinite" }}>…</span>
      ) : (
        <span style={{ display: "flex", gap: "2px" }}>
          <span style={{ width: "4px", height: "4px", borderRadius: "50%", background: d1 }} />
          <span style={{ width: "4px", height: "4px", borderRadius: "50%", background: d2 }} />
          <span style={{ width: "4px", height: "4px", borderRadius: "50%", background: d3 }} />
        </span>
      )}
    </span>
  );
}

function YearSummaryBadges({ monthMap, maxMonth }: { monthMap?: Map<number, SyncPeriod>; maxMonth: number }) {
  if (!monthMap) return <span style={{ fontSize: "10px", color: "#1e293b" }}>sin datos</span>;
  let done = 0, failed = 0;
  for (let m = 1; m <= maxMonth; m++) {
    const s = monthMap.get(m)?.status;
    if (s === "COMPLETED" || s === "EMPTY") done++;
    else if (s === "FAILED") failed++;
  }
  return (
    <span style={{ display: "flex", gap: "6px", fontSize: "10px" }}>
      {done   > 0 && <span style={{ color: "#4ADE80" }}>{done}✓</span>}
      {failed > 0 && <span style={{ color: "#F87171" }}>{failed}!</span>}
      {done === 0 && failed === 0 && <span style={{ color: "#1e293b" }}>vacío</span>}
    </span>
  );
}

function SyncCalendarGrid({ periods, dotsByMonth, onClickMonth, syncingMonth }: {
  periods:       SyncPeriod[];
  dotsByMonth:   Map<string, MonthDots>;
  onClickMonth?: (year: number, month: number) => void;
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
                {MONTH_ABBR.map((lbl, i) => {
                  const month = i + 1;
                  if (month > maxMonth) return (
                    <span key={i} style={{ width: "32px", height: "40px", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <span style={{ fontSize: "9px", color: "#1e293b" }}>{lbl}</span>
                    </span>
                  );
                  const isSyncing = syncingMonth?.year === year && syncingMonth?.month === month;
                  const dots = dotsByMonth.get(`${year}-${month}`) ?? { tax: "none" as const, spot: "none" as const, total: 0 };
                  return (
                    <MonthPill
                      key={i}
                      label={lbl}
                      period={monthMap?.get(month)}
                      dots={dots}
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

// ── Main drawer ────────────────────────────────────────────────────────────────

export function BinanceSyncDrawer({ onClose, onSyncComplete }: {
  onClose:          () => void;
  onSyncComplete?:  () => void;
}) {
  const [conn,           setConn]           = useState<ConnectionStatus | null>(null);
  const [loadingConn,    setLoadingConn]    = useState(true);
  const [calendar,       setCalendar]       = useState<CalendarData | null>(null);
  const [loadingCal,     setLoadingCal]     = useState(false);
  const [allImports,     setAllImports]     = useState<ImportRecord[]>([]);
  const [syncingMonth,   setSyncingMonth]   = useState<{ year: number; month: number } | null>(null);
  const [taxConn,        setTaxConn]        = useState<TaxConnectionStatus | null>(null);
  const [loadingTaxConn, setLoadingTaxConn] = useState(false);
  const [msg,            setMsg]            = useState<{ type: "success"|"error"|"warn"|"info"; text: string } | null>(null);

  // dot1=Tax dot2=Spot dot3=pending — computed from allImports + calendar
  const dotsByMonth = useMemo(() => {
    const map = new Map<string, MonthDots>();

    if (calendar) {
      for (const p of calendar.periods) {
        const key = `${p.year}-${p.month}`;
        map.set(key, {
          tax:   "none",
          spot:  p.status === "COMPLETED" || p.status === "EMPTY" ? "done"
                 : p.status === "FAILED" ? "failed" : "none",
          total: 0,
        });
      }
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
    } catch { /* optional */ } finally {
      setLoadingCal(false);
    }
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

  async function handleClickMonth(year: number, month: number) {
    if (syncingMonth) return;
    setSyncingMonth({ year, month });
    setMsg(null);

    const parts: string[] = [];

    // Step 1: Tax API import (skip gracefully if not connected or no records)
    if (taxConn?.connected) {
      try {
        const res = await httpClient<ApiResponse<TaxImportResult>>(
          "/api/integrations/binance/tax/import-transfers",
          { method: "POST", auth: true, body: { year, month } },
        );
        if (res.data.imported > 0) {
          const dep = res.data.deposits    > 0 ? `${res.data.deposits} dep`    : "";
          const ret = res.data.withdrawals > 0 ? `${res.data.withdrawals} ret` : "";
          parts.push(`TAX: ${[dep, ret].filter(Boolean).join(" · ")} importados`);
        }
      } catch { /* Tax step failed — continue */ }
    }

    // Step 2: Spot sync
    try {
      const res = await httpClient<ApiResponse<SyncResult>>(
        "/api/integrations/binance/sync",
        { method: "POST", auth: true, body: { year, month } },
      );
      if (res.data.autoConfirmed > 0) {
        parts.push(`Spot: ${res.data.autoConfirmed} confirmadas`);
      } else if (res.data.imported > 0) {
        parts.push(`Spot: ${res.data.imported} importadas`);
      }
    } catch { /* Spot step failed — continue */ }

    await Promise.all([loadCalendar(), loadImports(), loadStatus()]);

    const label = `${(MONTH_NAME[month] ?? "").charAt(0).toUpperCase()}${(MONTH_NAME[month] ?? "").slice(1)} ${year}`;
    if (parts.length > 0) {
      setMsg({ type: "success", text: `${label}: ${parts.join(" · ")}.` });
      onSyncComplete?.();
    } else {
      setMsg({ type: "info", text: `${label}: sin nuevos registros.` });
    }

    setSyncingMonth(null);
  }

  const isConnected = conn?.connected && conn.status === "ACTIVE";

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <>
      <style>{`
        @keyframes bn-spin  { to { transform: rotate(360deg); } }
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
        <div style={{ flex: 1, overflowY: "auto", padding: "0.75rem 1.25rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>

          {loadingConn ? (
            <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "#475569", fontSize: "13px", padding: "2rem 0" }}>
              <div style={{ width: "16px", height: "16px", border: "2px solid rgba(255,255,255,0.1)", borderTop: "2px solid #F0B90B", borderRadius: "50%", animation: "bn-spin 0.8s linear infinite" }} />
              Verificando conexión...
            </div>
          ) : !isConnected ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", textAlign: "center", gap: "8px" }}>
              <p style={{ color: "#475569", fontSize: "13px", margin: 0 }}>Sin conexión con Binance.</p>
              <a href="/configuracion" style={{ fontSize: "12px", color: "#4ADE80" }}>Configurar credenciales →</a>
            </div>
          ) : (
            <>
              {/* Status line */}
              {(conn.apiKeyHint ?? conn.lastSyncAt) && (
                <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                  {conn.apiKeyHint && <span style={{ fontSize: "11px", color: "#334155" }}>Clave …{conn.apiKeyHint}</span>}
                  {conn.lastSyncAt && (
                    <span style={{ fontSize: "11px", color: "#475569" }}>
                      Última sync: {new Date(conn.lastSyncAt).toLocaleString("es-CL", { dateStyle: "short", timeStyle: "short" })}
                      {" "}{conn.lastSyncStatus === "OK" ? "✓" : "⚠"}
                    </span>
                  )}
                </div>
              )}

              {/* APIs Binance */}
              <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "10px", padding: "0.75rem 1rem" }}>
                <h4 style={{ fontSize: "12px", fontWeight: 700, color: "#94A3B8", margin: "0 0 8px", textTransform: "uppercase", letterSpacing: "0.06em" }}>APIs Binance</h4>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: "10px" }}>
                    <div>
                      <p style={{ margin: 0, fontSize: "12px", color: "#CBD5E1", fontWeight: 700 }}>API Spot</p>
                      <p style={{ margin: "2px 0 0", fontSize: "11px", color: "#64748B" }}>Trades, balances.</p>
                    </div>
                    <span style={{ fontSize: "11px", color: "#4ADE80", fontWeight: 700, flexShrink: 0 }}>Conectada</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: "10px" }}>
                    <div>
                      <p style={{ margin: 0, fontSize: "12px", color: "#CBD5E1", fontWeight: 700 }}>API Tributaria</p>
                      <p style={{ margin: "2px 0 0", fontSize: "11px", color: "#64748B" }}>Depósitos, retiros, historial multi-año.</p>
                    </div>
                    <span style={{ fontSize: "11px", color: taxConn?.connected ? "#4ADE80" : "#F59E0B", fontWeight: 700, flexShrink: 0 }}>
                      {loadingTaxConn ? "…" : taxConn?.connected ? "Conectada" : "Pendiente"}
                    </span>
                  </div>
                </div>
                {!taxConn?.connected && !loadingTaxConn && (
                  <a href="/integrations/binance/tax" style={{ display: "inline-flex", marginTop: "8px", fontSize: "12px", color: "#F0B90B", textDecoration: "none", fontWeight: 700 }}>
                    Conectar API tributaria →
                  </a>
                )}
              </div>

              {/* Calendar */}
              <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "10px", padding: "0.75rem 1rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.625rem" }}>
                  <h4 style={{ fontSize: "12px", fontWeight: 700, color: "#94A3B8", margin: 0, textTransform: "uppercase", letterSpacing: "0.06em" }}>Cobertura</h4>
                  {calendar && (
                    <span style={{ fontSize: "11px", color: "#475569" }}>
                      {calendar.totalCompleted} completados
                      {calendar.totalFailed > 0 && <span style={{ color: "#F87171" }}> · {calendar.totalFailed} con error</span>}
                    </span>
                  )}
                </div>
                {loadingCal && !calendar ? (
                  <p style={{ fontSize: "12px", color: "#475569", margin: 0 }}>Cargando...</p>
                ) : calendar ? (
                  <SyncCalendarGrid
                    periods={calendar.periods}
                    dotsByMonth={dotsByMonth}
                    onClickMonth={handleClickMonth}
                    syncingMonth={syncingMonth}
                  />
                ) : null}
                <div style={{ display: "flex", gap: "12px", marginTop: "8px", fontSize: "10px", color: "#334155", alignItems: "center" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#F59E0B", display: "inline-block" }} />Tax
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#22C55E", display: "inline-block" }} />Spot
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#F59E0B", display: "inline-block" }} />Pendiente
                  </span>
                  <span style={{ marginLeft: "auto", color: "#1e293b" }}>clic en mes para sincronizar</span>
                </div>
              </div>

              {/* Result message */}
              {msg && (
                <div style={{
                  fontSize: "12px",
                  color:      msg.type === "success" ? "#4ADE80" : msg.type === "error" ? "#F87171" : msg.type === "warn" ? "#FCD34D" : "#93C5FD",
                  background: msg.type === "success" ? "rgba(22,163,74,0.06)" : msg.type === "error" ? "rgba(239,68,68,0.06)" : msg.type === "warn" ? "rgba(245,158,11,0.06)" : "rgba(96,165,250,0.06)",
                  border: `1px solid ${msg.type === "success" ? "rgba(22,163,74,0.2)" : msg.type === "error" ? "rgba(239,68,68,0.2)" : msg.type === "warn" ? "rgba(245,158,11,0.2)" : "rgba(96,165,250,0.2)"}`,
                  borderRadius: "8px", padding: "10px 14px",
                }}>
                  {msg.text}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
