"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { fonts } from "@/styles/tokens";
import { httpClient } from "@/shared/http/httpClient";

// ── Types ──────────────────────────────────────────────────────────────────────

type ConnectionStatus = {
  connected:       boolean;
  status?:         string;
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

type BulkConfirmResult = {
  confirmed:    number;
  skippedReview: number;
  taxRebuilt:   boolean;
  errors:       string[];
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
const BINANCE_VISIBLE_YEAR_KEY = "ledgera.binance.visibleYear";

// ── Month dots ─────────────────────────────────────────────────────────────────

type MonthDots = {
  tax:   "none" | "pending";
  spot:  "none" | "done" | "failed";
  total: number;
};

// ── Month pill — large grid style ──────────────────────────────────────────────

function MonthPill({ label, period, dots, onClick, syncing, future, lastSynced }: {
  label:       string;
  period?:     SyncPeriod;
  dots:        MonthDots;
  onClick?:    () => void;
  syncing?:    boolean;
  future?:     boolean;
  lastSynced?: boolean;
}) {
  const hasPending   = dots.total > 0;
  const isCompleted  = period?.status === "COMPLETED" || period?.status === "EMPTY";
  const hasFailed    = period?.status === "FAILED";

  // Border + background
  let bg     = "rgba(255,255,255,0.03)";
  let border = "rgba(255,255,255,0.08)";
  let textColor = "#475569";

  if (future) {
    bg = "transparent"; border = "rgba(255,255,255,0.03)"; textColor = "#1e293b";
  } else if (syncing) {
    bg = "rgba(240,185,11,0.1)"; border = "rgba(240,185,11,0.5)"; textColor = "#F0B90B";
  } else if (lastSynced) {
    bg = "rgba(22,163,74,0.1)"; border = "rgba(22,163,74,0.5)"; textColor = "#4ADE80";
  } else if (hasPending) {
    bg = "rgba(245,158,11,0.08)"; border = "rgba(245,158,11,0.35)"; textColor = "#F59E0B";
  } else if (isCompleted) {
    bg = "rgba(22,163,74,0.06)"; border = "rgba(22,163,74,0.25)"; textColor = "#94A3B8";
  } else if (hasFailed) {
    bg = "rgba(239,68,68,0.06)"; border = "rgba(239,68,68,0.2)"; textColor = "#F87171";
  }

  // 3 dots
  const d1 = dots.tax  === "pending" ? "#F59E0B" : isCompleted ? "#22C55E" : "#1e293b";
  const d2 = dots.spot === "done"    ? "#22C55E" : dots.spot === "failed" ? "#F87171" : "#1e293b";
  const d3 = hasPending ? "#F59E0B"  : isCompleted ? "#22C55E" : "#1e293b";

  return (
    <button
      type="button"
      onClick={future ? undefined : onClick}
      disabled={future}
      title={syncing ? `${label}: sincronizando…` : future ? label : `${label}: clic para sincronizar`}
      style={{
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        gap: "8px", padding: "14px 8px", borderRadius: "10px",
        background: syncing ? "rgba(240,185,11,0.15)" : bg,
        border:     `1px solid ${syncing ? "rgba(240,185,11,0.6)" : border}`,
        cursor:     future ? "default" : "pointer",
        transition: "background 0.15s, border-color 0.15s",
        fontFamily: fonts.body, outline: "none",
      }}
    >
      <span style={{ fontSize: "13px", fontWeight: 600, color: textColor, lineHeight: 1 }}>
        {syncing ? <span style={{ animation: "bn-blink 1s ease-in-out infinite", display: "inline-block" }}>…</span> : label}
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

// ── Main drawer ────────────────────────────────────────────────────────────────

export function BinanceSyncDrawer({ onClose, onSyncComplete }: {
  onClose:         () => void;
  onSyncComplete?: () => void;
}) {
  const [conn,           setConn]           = useState<ConnectionStatus | null>(null);
  const [loadingConn,    setLoadingConn]    = useState(true);
  const [calendar,       setCalendar]       = useState<CalendarData | null>(null);
  const [allImports,     setAllImports]     = useState<ImportRecord[]>([]);
  const [syncingMonth,   setSyncingMonth]   = useState<{ year: number; month: number } | null>(null);
  const [lastSyncedMonth,setLastSyncedMonth]= useState<{ year: number; month: number } | null>(null);
  const [taxConn,        setTaxConn]        = useState<TaxConnectionStatus | null>(null);
  const [loadingTaxConn, setLoadingTaxConn] = useState(false);
  const [msg,            setMsg]            = useState<{ type: "success"|"error"|"info"; text: string } | null>(null);
  const targetYearRef = useRef<number>(new Date().getFullYear());
  const [visibleYear, setVisibleYear] = useState(() => {
    if (typeof window === "undefined") return new Date().getFullYear();
    const stored = Number(window.sessionStorage.getItem(BINANCE_VISIBLE_YEAR_KEY));
    if (Number.isInteger(stored) && stored >= CALENDAR_START_YEAR && stored <= new Date().getFullYear()) {
      return stored;
    }
    return new Date().getFullYear();
  });

  function keepVisibleYear(year: number) {
    targetYearRef.current = year;
    setVisibleYear(year);
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem(BINANCE_VISIBLE_YEAR_KEY, String(year));
    }
  }

  const currentYear  = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  // Periods indexed by "year-month"
  const periodsByKey = useMemo(() => {
    const map = new Map<string, SyncPeriod>();
    for (const p of calendar?.periods ?? []) map.set(`${p.year}-${p.month}`, p);
    return map;
  }, [calendar]);

  // Dots per "year-month"
  const dotsByMonth = useMemo(() => {
    const map = new Map<string, MonthDots>();

    for (const p of calendar?.periods ?? []) {
      const key = `${p.year}-${p.month}`;
      map.set(key, {
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
    } catch { /* optional */ }
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

  // Restaura el año visible cada vez que llegan nuevos datos — evita que
  // re-renders causados por setCalendar/setAllImports sobreescriban la selección.
  useEffect(() => {
    setVisibleYear(targetYearRef.current);
  }, [calendar, allImports]);

  async function handleClickMonth(year: number, month: number) {
    if (syncingMonth) return;
    keepVisibleYear(year);
    setSyncingMonth({ year, month });
    setLastSyncedMonth(null);
    setMsg(null);

    const parts: string[] = [];

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
      } catch { /* continue */ }
    }

    try {
      const res = await httpClient<ApiResponse<SyncResult>>(
        "/api/integrations/binance/sync",
        { method: "POST", auth: true, body: { year, month } },
      );
      parts.push(`Spot: ${res.data.imported} descargados, ${res.data.autoConfirmed} confirmados`);
    } catch {
      parts.push("Spot: no completado por timeout");
    }

    try {
      const bulk = await httpClient<ApiResponse<BulkConfirmResult>>(
        "/api/integrations/binance/imports/bulk-confirm",
        { method: "POST", auth: true, body: { year, month } },
      );
      parts.push(`Confirmados: ${bulk.data.confirmed}`);
    } catch { /* silent */ }

    const monthLabel = `${(MONTH_NAME[month] ?? "").charAt(0).toUpperCase()}${(MONTH_NAME[month] ?? "").slice(1)} ${year}`;
    setMsg({ type: "success", text: `${monthLabel}: ${parts.join(" · ")}.` });

    await Promise.all([loadCalendar(), loadImports(), loadStatus()]);
    setLastSyncedMonth({ year, month });
    setSyncingMonth(null);
    keepVisibleYear(year);
    onSyncComplete?.();
  }

  const isConnected = conn?.connected && conn.status === "ACTIVE";

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <>
      <style>{`
        @keyframes bn-spin  { to { transform: rotate(360deg); } }
        @keyframes bn-blink { 0%,100% { opacity:1; } 50% { opacity:0.3; } }
      `}</style>

      {/* Backdrop */}
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 900 }} />

      {/* Drawer */}
      <div style={{ position: "fixed", top: 0, right: 0, width: "560px", maxWidth: "100vw", height: "100vh", background: "#0F172A", zIndex: 901, display: "flex", flexDirection: "column", boxShadow: "-8px 0 40px rgba(0,0,0,0.5)" }}>

        {/* Header */}
        <div style={{ padding: "1.125rem 1.25rem", borderBottom: "1px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", gap: "12px", flexShrink: 0 }}>
          <div style={{ width: "38px", height: "38px", borderRadius: "10px", background: "rgba(240,185,11,0.12)", border: "1px solid rgba(240,185,11,0.28)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 800, color: "#F0B90B", fontFamily: fonts.body, flexShrink: 0, letterSpacing: "0.02em" }}>
            BN
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: "15px", fontWeight: 700, color: "#F1F5F9", margin: 0, lineHeight: 1.2 }}>Binance</p>
            <p style={{ fontSize: "11px", color: "#475569", margin: 0 }}>Operaciones</p>
          </div>
          {!loadingConn && conn && (
            <span style={{ fontSize: "11px", fontWeight: 700, padding: "4px 12px", borderRadius: "6px", background: isConnected ? "rgba(22,163,74,0.12)" : "rgba(100,116,139,0.12)", color: isConnected ? "#4ADE80" : "#64748B", border: `1px solid ${isConnected ? "rgba(22,163,74,0.28)" : "rgba(100,116,139,0.2)"}`, whiteSpace: "nowrap" }}>
              {isConnected ? "Conectado" : "No conectado"}
            </span>
          )}
          <button type="button" onClick={onClose} style={{ background: "none", border: "none", color: "#475569", cursor: "pointer", fontSize: "20px", lineHeight: 1, padding: "4px", flexShrink: 0 }}>✕</button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "1.25rem", display: "flex", flexDirection: "column", gap: "1rem" }}>

          {loadingConn ? (
            <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "#475569", fontSize: "13px", padding: "2rem 0" }}>
              <div style={{ width: "16px", height: "16px", border: "2px solid rgba(255,255,255,0.08)", borderTop: "2px solid #F0B90B", borderRadius: "50%", animation: "bn-spin 0.8s linear infinite", flexShrink: 0 }} />
              Verificando conexión...
            </div>
          ) : !isConnected ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1, textAlign: "center", gap: "8px" }}>
              <p style={{ color: "#475569", fontSize: "13px", margin: 0 }}>Sin conexión con Binance.</p>
              <a href="/configuracion" style={{ fontSize: "12px", color: "#4ADE80" }}>Configurar credenciales →</a>
            </div>
          ) : (
            <>
              {/* Calendar section */}
              <div>
                <p style={{ fontSize: "15px", fontWeight: 700, color: "#F1F5F9", margin: "0 0 2px" }}>Sincronización de operaciones</p>
                <p style={{ fontSize: "12px", color: "#475569", margin: "0 0 1rem" }}>Selecciona un mes para sincronizar operaciones.</p>

                {/* Year navigation */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                  <button
                    type="button"
                    onClick={() => keepVisibleYear(Math.max(CALENDAR_START_YEAR, visibleYear - 1))}
                    disabled={visibleYear <= CALENDAR_START_YEAR}
                    style={{ background: "none", border: "none", color: visibleYear <= CALENDAR_START_YEAR ? "#1e293b" : "#64748B", cursor: visibleYear <= CALENDAR_START_YEAR ? "default" : "pointer", fontSize: "16px", padding: "4px 10px", fontFamily: fonts.body }}
                  >‹</button>
                  <span style={{ fontSize: "16px", fontWeight: 700, color: "#CBD5E1" }}>{visibleYear}</span>
                  <button
                    type="button"
                    onClick={() => keepVisibleYear(Math.min(currentYear, visibleYear + 1))}
                    disabled={visibleYear >= currentYear}
                    style={{ background: "none", border: "none", color: visibleYear >= currentYear ? "#1e293b" : "#64748B", cursor: visibleYear >= currentYear ? "default" : "pointer", fontSize: "16px", padding: "4px 10px", fontFamily: fonts.body }}
                  >›</button>
                </div>

                {/* Month grid — 4 columns */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px" }}>
                  {MONTH_ABBR.map((lbl, i) => {
                    const month    = i + 1;
                    const isFuture = visibleYear === currentYear && month > currentMonth;
                    const isSyncing= syncingMonth?.year === visibleYear && syncingMonth?.month === month;
                    const isLast   = lastSyncedMonth?.year === visibleYear && lastSyncedMonth?.month === month && !isSyncing;
                    const key      = `${visibleYear}-${month}`;
                    const dots     = dotsByMonth.get(key) ?? { tax: "none" as const, spot: "none" as const, total: 0 };
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

                {/* Dots legend */}
                <div style={{ display: "flex", gap: "14px", marginTop: "12px", fontSize: "10px", color: "#334155", alignItems: "center" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                    <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#F59E0B", display: "inline-block" }} />Tax
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                    <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#22C55E", display: "inline-block" }} />Spot
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                    <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#F59E0B", display: "inline-block" }} />Pendiente
                  </span>
                </div>
              </div>

              {/* Result message */}
              {msg && (
                <div style={{
                  fontSize: "12px", lineHeight: 1.5,
                  color:      msg.type === "success" ? "#4ADE80" : msg.type === "error" ? "#F87171" : "#93C5FD",
                  background: msg.type === "success" ? "rgba(22,163,74,0.07)" : msg.type === "error" ? "rgba(239,68,68,0.07)" : "rgba(96,165,250,0.07)",
                  border:    `1px solid ${msg.type === "success" ? "rgba(22,163,74,0.2)" : msg.type === "error" ? "rgba(239,68,68,0.2)" : "rgba(96,165,250,0.2)"}`,
                  borderRadius: "8px", padding: "10px 14px",
                }}>
                  {msg.text}
                </div>
              )}

              {/* Status line */}
              {(conn.apiKeyHint ?? conn.lastSyncAt) && (
                <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                  {conn.apiKeyHint && <span style={{ fontSize: "11px", color: "#334155" }}>Clave …{conn.apiKeyHint}</span>}
                  {conn.lastSyncAt && (
                    <span style={{ fontSize: "11px", color: "#334155" }}>
                      Última sync: {new Date(conn.lastSyncAt).toLocaleString("es-CL", { dateStyle: "short", timeStyle: "short" })}
                      {" "}{conn.lastSyncStatus === "OK" ? "✓" : "⚠"}
                    </span>
                  )}
                </div>
              )}

              {/* APIs Binance */}
              <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "10px", padding: "0.75rem 1rem", marginTop: "auto" }}>
                <h4 style={{ fontSize: "11px", fontWeight: 700, color: "#64748B", margin: "0 0 10px", textTransform: "uppercase", letterSpacing: "0.08em" }}>APIs Binance</h4>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "10px" }}>
                    <div>
                      <p style={{ margin: 0, fontSize: "13px", color: "#CBD5E1", fontWeight: 600 }}>API Spot</p>
                      <p style={{ margin: "2px 0 0", fontSize: "11px", color: "#475569" }}>Balances, depósitos/retiros y Spot parcial.</p>
                    </div>
                    <span style={{ fontSize: "12px", color: "#4ADE80", fontWeight: 700, flexShrink: 0 }}>Conectada</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "10px" }}>
                    <div>
                      <p style={{ margin: 0, fontSize: "13px", color: "#CBD5E1", fontWeight: 600 }}>API Tributaria</p>
                      <p style={{ margin: "2px 0 0", fontSize: "11px", color: "#475569" }}>Historial tributario multi-año de Binance.</p>
                    </div>
                    {loadingTaxConn ? (
                      <span style={{ fontSize: "12px", color: "#475569", flexShrink: 0 }}>…</span>
                    ) : taxConn?.connected ? (
                      <span style={{ fontSize: "12px", color: "#4ADE80", fontWeight: 700, flexShrink: 0 }}>Conectada</span>
                    ) : (
                      <a href="/integrations/binance/tax" style={{ fontSize: "12px", color: "#F59E0B", fontWeight: 700, textDecoration: "none", flexShrink: 0 }}>Conectar →</a>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
