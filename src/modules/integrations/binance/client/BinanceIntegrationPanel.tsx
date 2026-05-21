"use client";

import { useCallback, useEffect, useState } from "react";
import { fonts } from "@/styles/tokens";
import { httpClient, isHttpClientError } from "@/shared/http/httpClient";

// ── Types ─────────────────────────────────────────────────────────────────────

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

type TestResult = {
  canTrade:      boolean;
  canDeposit:    boolean;
  accountType:   string;
  permissions:   string[];
  balancesCount: number;
};

type SyncResult = {
  imported:        number;
  skipped:         number;
  autoConfirmed:   number;
  pendingReview:   number;
  taxRebuilt:      boolean;
  errors:          string[];
  allPeriodsSynced?: boolean;
  periodResults?:  Array<{ year: number; month: number; imported: number; status: string }>;
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

type NormalizedJson = {
  movementType: string;
  symbol:       string;
  quantity:     number;
  priceUsd:     number;
  feeUsd:       number;
};

type ApiResponse<T> = { ok: boolean; message: string; data: T };

// ── Tax classification helpers ────────────────────────────────────────────────

function needsManualReview(record: ImportRecord): boolean {
  return record.taxTreatment === "REVIEW" || record.inventoryEffect === "REVIEW";
}

function eventTypeBadge(type: string | null): { bg: string; color: string } {
  const map: Record<string, { bg: string; color: string }> = {
    SPOT_BUY:          { bg: "rgba(22,163,74,0.12)",   color: "#4ADE80" },
    SPOT_SELL:         { bg: "rgba(239,68,68,0.12)",   color: "#F87171" },
    EXTERNAL_DEPOSIT:  { bg: "rgba(96,165,250,0.12)",  color: "#93C5FD" },
    EXTERNAL_WITHDRAW: { bg: "rgba(96,165,250,0.12)",  color: "#93C5FD" },
    STAKING_REWARD:    { bg: "rgba(167,139,250,0.12)", color: "#A78BFA" },
    EARN_REWARD:       { bg: "rgba(167,139,250,0.12)", color: "#A78BFA" },
    DUST_CONVERSION:   { bg: "rgba(245,158,11,0.12)",  color: "#FCD34D" },
    CONVERT:           { bg: "rgba(245,158,11,0.12)",  color: "#FCD34D" },
  };
  return map[type ?? ""] ?? { bg: "rgba(100,116,139,0.12)", color: "#64748B" };
}

function taxTreatmentBadge(tt: string | null): { bg: string; color: string; label: string } {
  const map: Record<string, { bg: string; color: string; label: string }> = {
    ACQUISITION: { bg: "rgba(22,163,74,0.1)",   color: "#4ADE80", label: "Adquisición" },
    DISPOSAL:    { bg: "rgba(239,68,68,0.1)",   color: "#F87171", label: "Enajenación"  },
    INCOME:      { bg: "rgba(167,139,250,0.1)", color: "#A78BFA", label: "Renta"        },
    EXPENSE:     { bg: "rgba(245,158,11,0.1)",  color: "#FCD34D", label: "Gasto"        },
    NEUTRAL:     { bg: "rgba(100,116,139,0.1)", color: "#64748B", label: "Neutro"       },
    REVIEW:      { bg: "rgba(245,158,11,0.1)",  color: "#F59E0B", label: "⚠ Revisar"   },
  };
  return map[tt ?? "REVIEW"] ?? map["REVIEW"]!;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, { bg: string; color: string; border: string; label: string }> = {
    ACTIVE:       { bg: "rgba(22,163,74,0.12)",   color: "#4ADE80", border: "rgba(22,163,74,0.25)",   label: "Conectado"    },
    ERROR:        { bg: "rgba(239,68,68,0.12)",   color: "#F87171", border: "rgba(239,68,68,0.25)",   label: "Error"        },
    REVOKED:      { bg: "rgba(100,116,139,0.12)", color: "#64748B", border: "rgba(100,116,139,0.2)",  label: "Revocado"     },
    disconnected: { bg: "rgba(100,116,139,0.12)", color: "#64748B", border: "rgba(100,116,139,0.2)",  label: "No conectado" },
  };
  const s = styles[status] ?? styles.disconnected;
  return (
    <span style={{ fontSize: "11px", fontWeight: 700, padding: "3px 10px", borderRadius: "6px", background: s.bg, color: s.color, border: `1px solid ${s.border}`, whiteSpace: "nowrap", flexShrink: 0 }}>
      {s.label}
    </span>
  );
}

function Alert({ type, message }: { type: "success" | "error" | "warn" | "info"; message: string }) {
  const map = {
    success: { bg: "rgba(22,163,74,0.06)",  border: "rgba(22,163,74,0.2)",  color: "#4ADE80" },
    error:   { bg: "rgba(239,68,68,0.06)",  border: "rgba(239,68,68,0.2)",  color: "#F87171" },
    warn:    { bg: "rgba(245,158,11,0.06)", border: "rgba(245,158,11,0.2)", color: "#FCD34D" },
    info:    { bg: "rgba(96,165,250,0.06)", border: "rgba(96,165,250,0.2)", color: "#93C5FD" },
  };
  const s = map[type];
  return (
    <p style={{ fontSize: "12px", color: s.color, background: s.bg, border: `1px solid ${s.border}`, borderRadius: "6px", padding: "8px 12px", margin: "0 0 1rem" }}>
      {message}
    </p>
  );
}

function ActionButton({
  onClick, disabled, loading, loadingLabel, label, variant = "primary",
}: {
  onClick: () => void; disabled?: boolean; loading?: boolean;
  loadingLabel: string; label: string; variant?: "primary" | "secondary" | "danger";
}) {
  const bg = loading || disabled
    ? "rgba(255,255,255,0.06)"
    : variant === "primary" ? "#16A34A"
    : variant === "danger"  ? "rgba(239,68,68,0.12)"
    : "rgba(255,255,255,0.06)";
  const color = variant === "danger" ? "#F87171" : variant === "primary" ? "#fff" : "#94A3B8";
  const border = variant === "danger" ? "1px solid rgba(239,68,68,0.3)" : "none";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      style={{ padding: "9px 18px", borderRadius: "8px", border, background: bg, color, fontSize: "13px", fontWeight: 600, cursor: disabled || loading ? "not-allowed" : "pointer", fontFamily: fonts.body, opacity: disabled ? 0.5 : 1, transition: "all 0.15s ease" }}
    >
      {loading ? loadingLabel : label}
    </button>
  );
}

// ── Sync Calendar ─────────────────────────────────────────────────────────────

const MONTH_ABBR = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
const MONTH_NAME: Record<number, string> = {
  1:"enero",2:"febrero",3:"marzo",4:"abril",5:"mayo",6:"junio",
  7:"julio",8:"agosto",9:"septiembre",10:"octubre",11:"noviembre",12:"diciembre",
};

function pillStyle(p: SyncPeriod): { bg: string; border: string; labelColor: string; value: string } {
  switch (p.status) {
    case "COMPLETED":
      return {
        bg: "rgba(22,163,74,0.12)", border: "rgba(22,163,74,0.25)", labelColor: "#4ADE80",
        value: p.importedCount > 0 ? (p.importedCount > 99 ? "99+" : String(p.importedCount)) : "✓",
      };
    case "EMPTY":
      return { bg: "rgba(255,255,255,0.02)", border: "rgba(255,255,255,0.07)", labelColor: "#334155", value: "—" };
    case "FAILED":
      return { bg: "rgba(239,68,68,0.08)", border: "rgba(239,68,68,0.25)", labelColor: "#F87171", value: "✗" };
    case "RUNNING":
      return { bg: "rgba(240,185,11,0.08)", border: "rgba(240,185,11,0.25)", labelColor: "#F0B90B", value: "…" };
    default:
      return { bg: "rgba(255,255,255,0.02)", border: "rgba(255,255,255,0.07)", labelColor: "#475569", value: "○" };
  }
}

function MonthPill({ label, period }: { label: string; period?: SyncPeriod }) {
  if (!period) {
    return (
      <span title={label} style={{ width: "34px", height: "40px", display: "inline-flex", flexDirection: "column", alignItems: "center", justifyContent: "center", borderRadius: "5px", border: "1px dashed rgba(255,255,255,0.04)", flexShrink: 0 }}>
        <span style={{ fontSize: "9px", color: "#1e293b" }}>{label}</span>
      </span>
    );
  }
  const s = pillStyle(period);
  const title = `${label}: ${period.status}${period.importedCount > 0 ? ` · ${period.importedCount} operaciones` : ""}`;
  return (
    <span title={title} style={{ width: "34px", height: "40px", display: "inline-flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "2px", borderRadius: "5px", background: s.bg, border: `1px solid ${s.border}`, flexShrink: 0 }}>
      <span style={{ fontSize: "9px", color: "#64748B", lineHeight: 1 }}>{label}</span>
      <span style={{ fontSize: "10px", fontWeight: 700, color: s.labelColor, lineHeight: 1 }}>{s.value}</span>
    </span>
  );
}

function SyncCalendarGrid({ periods }: { periods: SyncPeriod[] }) {
  const byYear = new Map<number, Map<number, SyncPeriod>>();
  for (const p of periods) {
    if (!byYear.has(p.year)) byYear.set(p.year, new Map());
    byYear.get(p.year)!.set(p.month, p);
  }
  const years = [...byYear.keys()].sort((a, b) => a - b);

  if (years.length === 0) {
    return <p style={{ fontSize: "12px", color: "#475569", margin: 0 }}>Sin períodos inicializados. Presiona Sincronizar para comenzar.</p>;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      {years.map(year => {
        const monthMap = byYear.get(year)!;
        return (
          <div key={year} style={{ display: "flex", alignItems: "center", gap: "5px", flexWrap: "wrap" }}>
            <span style={{ fontSize: "11px", fontWeight: 700, color: "#475569", minWidth: "34px", textAlign: "right", flexShrink: 0 }}>{year}</span>
            {MONTH_ABBR.map((label, i) => (
              <MonthPill key={i} label={label} period={monthMap.get(i + 1)} />
            ))}
          </div>
        );
      })}
    </div>
  );
}

// ── Main Panel ────────────────────────────────────────────────────────────────

export function BinanceIntegrationPanel() {
  const [conn,          setConn]          = useState<ConnectionStatus | null>(null);
  const [loadingConn,   setLoadingConn]   = useState(true);
  const [apiKey,        setApiKey]        = useState("");
  const [apiSecret,     setApiSecret]     = useState("");
  const [showSecret,    setShowSecret]    = useState(false);
  const [showCredentials, setShowCredentials] = useState(false);
  const [connecting,    setConnecting]    = useState(false);
  const [testing,       setTesting]       = useState(false);
  const [syncing,       setSyncing]       = useState(false);
  const [testResult,    setTestResult]    = useState<TestResult | null>(null);
  const [syncResult,    setSyncResult]    = useState<SyncResult | null>(null);
  const [resetting,     setResetting]     = useState(false);
  const [calendar,      setCalendar]      = useState<CalendarData | null>(null);
  const [loadingCal,    setLoadingCal]    = useState(false);
  const [imports,       setImports]       = useState<ImportRecord[]>([]);
  const [loadingImports,setLoadingImports]= useState(false);
  const [confirmingId,  setConfirmingId]  = useState<string | null>(null);
  const [msg,           setMsg]           = useState<{ type: "success" | "error" | "warn" | "info"; text: string } | null>(null);

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
    } catch {
      // calendar is optional — don't crash if unavailable
    } finally {
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
      if ((conn.pendingCount ?? 0) > 0) loadImports();
    }
  }, [conn, loadCalendar, loadImports]);

  async function handleConnect() {
    if (!apiKey.trim() || !apiSecret.trim()) {
      setMsg({ type: "warn", text: "Ingresa API Key y API Secret." });
      return;
    }
    setConnecting(true); setMsg(null); setTestResult(null);
    try {
      await httpClient("/api/integrations/binance/connect", {
        method: "POST", auth: true,
        body: { apiKey: apiKey.trim(), apiSecret: apiSecret.trim() },
      });
      setMsg({ type: "success", text: "Conexión establecida correctamente. El Secret ya no se mostrará." });
      setApiKey(""); setApiSecret("");
      await loadStatus();
    } catch (e) {
      setMsg({ type: "error", text: isHttpClientError(e) ? e.message : "Error al conectar con Binance." });
    } finally {
      setConnecting(false);
    }
  }

  async function handleTest() {
    setTesting(true); setMsg(null); setTestResult(null);
    try {
      const res = await httpClient<ApiResponse<TestResult>>("/api/integrations/binance/test", {
        method: "POST", auth: true, body: {},
      });
      setTestResult(res.data);
      setMsg({ type: "success", text: "Conexión verificada correctamente." });
    } catch (e) {
      setMsg({ type: "error", text: isHttpClientError(e) ? e.message : "Error al probar la conexión." });
    } finally {
      setTesting(false);
    }
  }

  async function handleReset() {
    setResetting(true); setMsg(null);
    try {
      await httpClient("/api/integrations/binance/sync/reset", {
        method: "POST", auth: true, body: {},
      });
      setMsg({ type: "success", text: "Sincronización reiniciada. Ya puedes volver a sincronizar." });
      await loadStatus();
    } catch (e) {
      setMsg({ type: "error", text: isHttpClientError(e) ? e.message : "Error al reiniciar." });
    } finally {
      setResetting(false);
    }
  }

  async function handleSync() {
    setSyncing(true); setMsg(null); setSyncResult(null);
    try {
      const res = await httpClient<ApiResponse<SyncResult>>("/api/integrations/binance/sync", {
        method: "POST", auth: true, body: {},
      });
      setSyncResult(res.data);
      setMsg({
        type: res.data.errors.length > 0 ? "warn" : "success",
        text: res.message,
      });
      await loadStatus();
      await loadCalendar();
      await loadImports();
    } catch (e) {
      setMsg({ type: "error", text: isHttpClientError(e) ? e.message : "Error durante la sincronización." });
    } finally {
      setSyncing(false);
    }
  }

  async function handleImportAction(recordId: string, action: "CONFIRM" | "REJECT" | "REVIEW") {
    setConfirmingId(recordId); setMsg(null);
    try {
      await httpClient("/api/integrations/binance/imports/confirm", {
        method: "POST", auth: true, body: { recordId, action },
      });

      if (action === "REVIEW") {
        // Actualiza el status en la lista — el registro queda visible como REVIEW
        setImports(prev => prev.map(r => r.id === recordId ? { ...r, status: "REVIEW" } : r));
      } else {
        // CONFIRM o REJECT: sale de la lista
        setImports(prev => prev.filter(r => r.id !== recordId));
        setConn(prev => prev ? { ...prev, pendingCount: Math.max(0, (prev.pendingCount ?? 1) - 1) } : prev);
      }
    } catch (e) {
      setMsg({ type: "error", text: isHttpClientError(e) ? e.message : "Error al procesar el registro." });
    } finally {
      setConfirmingId(null);
    }
  }

  if (loadingConn) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "2rem", color: "#475569", fontSize: "13px" }}>
        <div style={{ width: "16px", height: "16px", border: "2px solid rgba(255,255,255,0.1)", borderTop: "2px solid #F0B90B", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        Verificando conexión con Binance...
      </div>
    );
  }

  const isConnected   = conn?.connected && conn.status === "ACTIVE";
  const isSyncStuck   = conn?.syncStatus === "RUNNING" && !syncing;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>

      {/* ── Header del panel ── */}
      <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "12px", padding: "0.875rem 1.25rem" }}>

        {/* Fila de identidad siempre visible */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ width: "38px", height: "38px", borderRadius: "9px", background: "rgba(240,185,11,0.1)", border: "1px solid rgba(240,185,11,0.25)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 800, color: "#F0B90B", fontFamily: fonts.body, flexShrink: 0 }}>
            BN
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: "14px", fontWeight: 700, color: "#F1F5F9", margin: "0 0 1px" }}>Binance</p>
            <p style={{ fontSize: "11px", color: "#475569", margin: 0 }}>
              Spot — API Read-Only
              {isConnected && conn?.apiKeyHint && <span style={{ color: "#334155" }}> · clave …{conn.apiKeyHint}</span>}
            </p>
          </div>
          <StatusBadge status={conn?.status ?? "disconnected"} />
          {isConnected && (
            <button
              type="button"
              onClick={() => { setShowCredentials(v => !v); setMsg(null); }}
              style={{ padding: "6px 12px", borderRadius: "7px", border: "1px solid rgba(255,255,255,0.12)", background: showCredentials ? "rgba(239,68,68,0.1)" : "rgba(255,255,255,0.05)", color: showCredentials ? "#F87171" : "#64748B", fontSize: "11px", fontWeight: 600, cursor: "pointer", fontFamily: fonts.body, whiteSpace: "nowrap", flexShrink: 0 }}
            >
              {showCredentials ? "Cancelar" : "Actualizar claves"}
            </button>
          )}
        </div>

        {msg && <div style={{ marginTop: "0.625rem" }}><Alert type={msg.type} message={msg.text} /></div>}

        {/* Formulario — solo visible cuando no está conectado o el usuario quiere actualizar */}
        {(!isConnected || showCredentials) && (
          <div style={{ marginTop: "0.875rem", display: "flex", flexDirection: "column", gap: "0.625rem" }}>
            <div>
              <label style={{ fontSize: "11px", fontWeight: 600, color: "#64748B", display: "block", marginBottom: "5px" }}>API Key</label>
              <input
                type="text"
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
                placeholder={isConnected ? "Nueva API Key (vacío = mantener actual)" : "Pega tu API Key de Binance"}
                style={{ background: "#F8FAFC", border: "1px solid #CBD5E1", borderRadius: "7px", padding: "8px 11px", color: "#0F172A", fontSize: "12px", fontFamily: fonts.body, outline: "none", width: "100%", boxSizing: "border-box" }}
              />
            </div>
            <div>
              <label style={{ fontSize: "11px", fontWeight: 600, color: "#64748B", display: "block", marginBottom: "5px" }}>API Secret</label>
              <div style={{ position: "relative" }}>
                <input
                  type={showSecret ? "text" : "password"}
                  value={apiSecret}
                  onChange={e => setApiSecret(e.target.value)}
                  placeholder={isConnected ? "Nuevo API Secret (vacío = mantener actual)" : "Pega tu API Secret de Binance"}
                  style={{ background: "#F8FAFC", border: "1px solid #CBD5E1", borderRadius: "7px", padding: "8px 36px 8px 11px", color: "#0F172A", fontSize: "12px", fontFamily: fonts.body, outline: "none", width: "100%", boxSizing: "border-box" }}
                />
                <button type="button" onClick={() => setShowSecret(v => !v)} style={{ position: "absolute", right: "9px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#94A3B8", padding: 0 }}>
                  {showSecret
                    ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                    : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  }
                </button>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px", flexWrap: "wrap" }}>
              <p style={{ fontSize: "10px", color: "#334155", margin: 0, lineHeight: 1.5 }}>
                Solo lectura · AES-256 · el Secret no puede recuperarse.
              </p>
              <button
                type="button"
                onClick={handleConnect}
                disabled={connecting || (!apiKey.trim() && !apiSecret.trim())}
                style={{ padding: "7px 16px", borderRadius: "8px", border: "none", background: connecting || (!apiKey.trim() && !apiSecret.trim()) ? "rgba(255,255,255,0.06)" : "#16A34A", color: "#fff", fontSize: "12px", fontWeight: 700, cursor: connecting || (!apiKey.trim() && !apiSecret.trim()) ? "not-allowed" : "pointer", fontFamily: fonts.body, whiteSpace: "nowrap", flexShrink: 0, opacity: (!apiKey.trim() && !apiSecret.trim()) ? 0.4 : 1 }}
              >
                {connecting ? "Conectando..." : isConnected ? "Actualizar credenciales" : "Conectar Binance"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Sincronización ── */}
      {isConnected && (
        <>
          <style>{`
            @keyframes pulse-green {
              0%, 100% { box-shadow: 0 0 0 0 rgba(22,163,74,0.6); }
              50%       { box-shadow: 0 0 0 5px rgba(22,163,74,0); }
            }
            @keyframes dot-blink {
              0%, 100% { opacity: 1; }
              50%       { opacity: 0.25; }
            }
          `}</style>
          <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "12px", padding: "0.625rem 1.25rem" }}>

            {/* Fila única: estado + botones */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>

              {/* Indicador de estado */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                  {syncing && (
                    <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#22C55E", display: "inline-block", flexShrink: 0, animation: "dot-blink 1s ease-in-out infinite" }} />
                  )}
                  <span style={{ fontSize: "12px", fontWeight: 600, color: "#94A3B8", whiteSpace: "nowrap" }}>Sincronización</span>
                  <span style={{ fontSize: "12px", color: "#475569", whiteSpace: "nowrap" }}>
                    {conn?.lastSyncAt
                      ? `${new Date(conn.lastSyncAt).toLocaleString("es-CL", { dateStyle: "short", timeStyle: "short" })} · ${conn.lastSyncStatus === "OK" ? "✓" : "⚠"}`
                      : "Nunca sincronizado"}
                  </span>
                  {isSyncStuck && (
                    <span style={{ fontSize: "11px", fontWeight: 700, color: "#F87171", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "5px", padding: "1px 7px", whiteSpace: "nowrap" }}>
                      Atascada — reiniciar
                    </span>
                  )}
                  {(conn?.pendingCount ?? 0) > 0 && (
                    <span style={{ fontSize: "11px", fontWeight: 700, color: "#F0B90B", background: "rgba(240,185,11,0.1)", border: "1px solid rgba(240,185,11,0.2)", borderRadius: "5px", padding: "1px 7px", whiteSpace: "nowrap" }}>
                      {conn?.pendingCount} pendientes
                    </span>
                  )}
                </div>
                {conn?.lastSyncError && (
                  <p style={{ margin: "4px 0 0", fontSize: "11px", color: "#F87171" }}>
                    Error: {conn.lastSyncError}
                  </p>
                )}
              </div>

              {/* Botón reset — solo visible cuando sync está atascado */}
              {isSyncStuck && (
                <button
                  type="button"
                  onClick={handleReset}
                  disabled={resetting}
                  style={{ padding: "7px 14px", borderRadius: "8px", border: "1px solid rgba(239,68,68,0.35)", background: "rgba(239,68,68,0.08)", color: "#F87171", fontSize: "12px", fontWeight: 600, cursor: resetting ? "not-allowed" : "pointer", fontFamily: fonts.body, whiteSpace: "nowrap", flexShrink: 0 }}
                >
                  {resetting ? "Reiniciando..." : "Reiniciar sync"}
                </button>
              )}

              {/* Botón Probar conexión */}
              <button
                type="button"
                onClick={handleTest}
                disabled={testing || syncing || isSyncStuck}
                style={{ padding: "7px 14px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)", color: testing ? "#475569" : "#94A3B8", fontSize: "12px", fontWeight: 600, cursor: testing || syncing || isSyncStuck ? "not-allowed" : "pointer", fontFamily: fonts.body, whiteSpace: "nowrap", flexShrink: 0, opacity: isSyncStuck ? 0.4 : 1 }}
              >
                {testing ? "Verificando..." : "Probar conexión"}
              </button>

              {/* Botón Sincronizar — verde parpadeante cuando está activo */}
              <button
                type="button"
                onClick={handleSync}
                disabled={syncing || testing || isSyncStuck}
                style={{
                  padding: "7px 16px",
                  borderRadius: "8px",
                  border: "none",
                  background: "#16A34A",
                  color: "#fff",
                  fontSize: "12px",
                  fontWeight: 700,
                  cursor: syncing || testing || isSyncStuck ? "not-allowed" : "pointer",
                  fontFamily: fonts.body,
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                  animation: syncing ? "pulse-green 1.2s ease-in-out infinite" : "none",
                  opacity: testing || isSyncStuck ? 0.5 : 1,
                }}
              >
                {syncing ? "Sincronizando..." : isSyncStuck ? "En curso..." : "Sincronizar"}
              </button>
            </div>

            {/* Resultado de test — bajo la fila */}
            {testResult && (
              <div style={{ marginTop: "0.625rem", paddingTop: "0.625rem", borderTop: "1px solid rgba(255,255,255,0.05)", display: "flex", gap: "1.25rem", fontSize: "11px", color: "#94A3B8", flexWrap: "wrap" }}>
                <span>Tipo: <strong style={{ color: "#CBD5E1" }}>{testResult.accountType}</strong></span>
                <span>Trading: <strong style={{ color: testResult.canTrade ? "#4ADE80" : "#F87171" }}>{testResult.canTrade ? "✓" : "✗"}</strong></span>
                <span>Depósito: <strong style={{ color: testResult.canDeposit ? "#4ADE80" : "#F87171" }}>{testResult.canDeposit ? "✓" : "✗"}</strong></span>
                <span>Activos con saldo: <strong style={{ color: "#CBD5E1" }}>{testResult.balancesCount}</strong></span>
                <span>Permisos: <strong style={{ color: "#CBD5E1" }}>{testResult.permissions.join(", ")}</strong></span>
              </div>
            )}

            {/* Resultado de sync — bloque expandido */}
            {syncResult && !syncing && (
              <div style={{ marginTop: "0.625rem", paddingTop: "0.75rem", borderTop: "1px solid rgba(255,255,255,0.05)" }}>

                {/* Resumen narrativo */}
                <div style={{ display: "flex", flexDirection: "column", gap: "3px", marginBottom: "0.625rem" }}>
                  {syncResult.autoConfirmed > 0 && (
                    <p style={{ margin: 0, fontSize: "12px", color: "#4ADE80" }}>
                      <strong>{syncResult.autoConfirmed}</strong> {syncResult.autoConfirmed === 1 ? "operación fue incorporada" : "operaciones fueron incorporadas"} automáticamente al portafolio.
                    </p>
                  )}
                  {syncResult.pendingReview > 0 && (
                    <p style={{ margin: 0, fontSize: "12px", color: "#F59E0B" }}>
                      <strong>{syncResult.pendingReview}</strong> {syncResult.pendingReview === 1 ? "operación quedó pendiente" : "operaciones quedaron pendientes"} de revisión manual.
                    </p>
                  )}
                  {syncResult.autoConfirmed === 0 && syncResult.pendingReview === 0 && syncResult.imported === 0 && (
                    <p style={{ margin: 0, fontSize: "12px", color: "#64748B" }}>Sin nuevas operaciones desde la última sincronización.</p>
                  )}
                </div>

                {/* Métricas en fila */}
                <div style={{ display: "flex", gap: "1.25rem", fontSize: "11px", color: "#64748B", flexWrap: "wrap" }}>
                  <span>Importados: <strong style={{ color: "#CBD5E1" }}>{syncResult.imported}</strong></span>
                  <span>Auto-confirmados: <strong style={{ color: "#4ADE80" }}>{syncResult.autoConfirmed}</strong></span>
                  <span>En revisión: <strong style={{ color: "#F59E0B" }}>{syncResult.pendingReview}</strong></span>
                  <span>Omitidos: <strong style={{ color: "#64748B" }}>{syncResult.skipped}</strong></span>
                  {syncResult.errors.length > 0 && (
                    <span>Errores: <strong style={{ color: "#F87171" }}>{syncResult.errors.length}</strong></span>
                  )}
                  {syncResult.taxRebuilt && (
                    <span style={{ color: "#A78BFA" }}>Motor tributario recalculado ✓</span>
                  )}
                </div>

                {/* Lista de errores si los hay */}
                {syncResult.errors.length > 0 && (
                  <div style={{ marginTop: "0.5rem", padding: "8px 10px", background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)", borderRadius: "7px" }}>
                    {syncResult.errors.slice(0, 3).map((e, i) => (
                      <p key={i} style={{ margin: i > 0 ? "4px 0 0" : 0, fontSize: "11px", color: "#F87171" }}>{e}</p>
                    ))}
                    {syncResult.errors.length > 3 && (
                      <p style={{ margin: "4px 0 0", fontSize: "11px", color: "#64748B" }}>…y {syncResult.errors.length - 3} errores más.</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}

      {/* ── Calendario de sincronización ── */}
      {isConnected && (calendar || loadingCal) && (
        <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "12px", padding: "0.875rem 1.25rem" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem", marginBottom: "0.75rem" }}>
            <div>
              <h4 style={{ fontSize: "13px", fontWeight: 700, color: "#F1F5F9", margin: "0 0 2px" }}>Cobertura de sincronización</h4>
              {calendar && (
                <p style={{ fontSize: "11px", color: "#475569", margin: 0 }}>
                  {calendar.totalCompleted} completados
                  {calendar.totalPending > 0 && <span style={{ color: "#F59E0B" }}> · {calendar.totalPending} pendientes</span>}
                  {calendar.totalFailed  > 0 && <span style={{ color: "#F87171" }}> · {calendar.totalFailed} fallidos</span>}
                </p>
              )}
            </div>
            {calendar?.nextPeriod && (
              <span style={{ fontSize: "11px", color: "#64748B", whiteSpace: "nowrap", flexShrink: 0 }}>
                Siguiente: <strong style={{ color: "#94A3B8" }}>{MONTH_NAME[calendar.nextPeriod.month]} {calendar.nextPeriod.year}</strong>
              </span>
            )}
            {calendar && !calendar.nextPeriod && calendar.periods.length > 0 && (
              <span style={{ fontSize: "11px", color: "#4ADE80", whiteSpace: "nowrap", flexShrink: 0 }}>Historial al día ✓</span>
            )}
          </div>

          {loadingCal && !calendar ? (
            <p style={{ fontSize: "12px", color: "#475569", margin: 0 }}>Cargando cobertura...</p>
          ) : calendar ? (
            <SyncCalendarGrid periods={calendar.periods} />
          ) : null}
        </div>
      )}

      {/* ── Importaciones pendientes ── */}
      {isConnected && (
        <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "12px", overflow: "hidden" }}>
          <div style={{ padding: "1rem 1.5rem", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem" }}>
            <div>
              <h4 style={{ fontSize: "13px", fontWeight: 700, color: "#F1F5F9", margin: "0 0 2px" }}>
                Importaciones pendientes
                {imports.length > 0 && (
                  <span style={{ marginLeft: "8px", fontSize: "11px", fontWeight: 700, color: "#F0B90B", background: "rgba(240,185,11,0.1)", border: "1px solid rgba(240,185,11,0.2)", borderRadius: "5px", padding: "1px 7px" }}>
                    {imports.length}
                  </span>
                )}
              </h4>
              <p style={{ fontSize: "11px", color: "#475569", margin: 0 }}>
                Revisa la clasificación tributaria antes de confirmar. Eventos en ⚠ requieren revisión manual.
              </p>
            </div>
            <button
              type="button"
              onClick={loadImports}
              disabled={loadingImports}
              style={{ padding: "6px 14px", borderRadius: "7px", border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.05)", color: loadingImports ? "#475569" : "#94A3B8", fontSize: "11px", fontWeight: 600, cursor: loadingImports ? "not-allowed" : "pointer", fontFamily: fonts.body, whiteSpace: "nowrap" }}
            >
              {loadingImports ? "Cargando..." : "↺ Actualizar"}
            </button>
          </div>

          {loadingImports ? (
            <div style={{ padding: "2rem", textAlign: "center", color: "#475569", fontSize: "13px" }}>Cargando registros...</div>
          ) : imports.length === 0 ? (
            <div style={{ padding: "3rem 2rem", textAlign: "center", color: "#334155", fontSize: "13px" }}>
              {(conn?.pendingCount ?? 0) === 0
                ? "No hay importaciones pendientes."
                : "Ejecuta una sincronización para traer operaciones desde Binance."}
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                <thead>
                  <tr>
                    {["Evento", "Símbolo", "Cantidad", "Precio USD", "Tratamiento", "Fecha", "Acciones"].map(h => (
                      <th key={h} style={{ textAlign: "left", padding: "10px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)", color: "#64748B", fontWeight: 600, whiteSpace: "nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {imports.map((record, i) => {
                    let norm: NormalizedJson = { movementType: record.externalType, symbol: "—", quantity: 0, priceUsd: 0, feeUsd: 0 };
                    try { norm = JSON.parse(record.normalizedJson ?? "{}") as NormalizedJson; } catch { /* noop */ }

                    const isProcessing = confirmingId === record.id;
                    const isReview     = record.status === "REVIEW";
                    const cannotConfirm = needsManualReview(record);
                    const evBadge      = eventTypeBadge(record.normalizedEventType);
                    const ttBadge      = taxTreatmentBadge(record.taxTreatment);

                    const rowBg = isReview
                      ? "rgba(245,158,11,0.04)"
                      : i % 2 === 0 ? "rgba(255,255,255,0.01)" : "transparent";

                    return (
                      <tr key={record.id} style={{ background: rowBg, borderLeft: isReview ? "2px solid rgba(245,158,11,0.4)" : "2px solid transparent" }}>

                        {/* Evento */}
                        <td style={{ padding: "10px 16px" }}>
                          <span style={{ fontSize: "11px", fontWeight: 700, color: evBadge.color, background: evBadge.bg, border: `1px solid ${evBadge.color}30`, borderRadius: "4px", padding: "2px 7px", display: "inline-block", whiteSpace: "nowrap" }}>
                            {record.normalizedEventType ?? norm.movementType}
                          </span>
                          {isReview && (
                            <span style={{ marginLeft: "6px", fontSize: "10px", color: "#F59E0B", fontWeight: 600 }}>EN REVISIÓN</span>
                          )}
                        </td>

                        {/* Símbolo */}
                        <td style={{ padding: "10px 16px", color: "#CBD5E1", fontWeight: 600 }}>{norm.symbol}</td>

                        {/* Cantidad */}
                        <td style={{ padding: "10px 16px", color: "#94A3B8", fontFamily: "monospace" }}>
                          {norm.quantity > 0 ? norm.quantity.toFixed(8).replace(/\.?0+$/, "") : "—"}
                        </td>

                        {/* Precio USD */}
                        <td style={{ padding: "10px 16px", color: "#94A3B8", fontFamily: "monospace" }}>
                          {norm.priceUsd > 0 ? `$${norm.priceUsd.toFixed(2)}` : "—"}
                        </td>

                        {/* Tratamiento tributario */}
                        <td style={{ padding: "10px 16px" }}>
                          <span style={{ fontSize: "11px", fontWeight: 600, color: ttBadge.color, background: ttBadge.bg, borderRadius: "4px", padding: "2px 7px", display: "inline-block", whiteSpace: "nowrap" }}>
                            {ttBadge.label}
                          </span>
                          {record.inventoryEffect && record.inventoryEffect !== "NEUTRAL" && (
                            <div style={{ fontSize: "10px", color: "#475569", marginTop: "2px" }}>
                              inventario: {record.inventoryEffect === "ADD" ? "+ADD" : record.inventoryEffect === "REMOVE" ? "-REMOVE" : record.inventoryEffect}
                            </div>
                          )}
                        </td>

                        {/* Fecha */}
                        <td style={{ padding: "10px 16px", color: "#64748B", whiteSpace: "nowrap" }}>
                          {new Date(record.occurredAt).toLocaleString("es-CL", { dateStyle: "short", timeStyle: "short" })}
                        </td>

                        {/* Acciones */}
                        <td style={{ padding: "10px 16px" }}>
                          <div style={{ display: "flex", gap: "5px" }}>

                            {/* CONFIRMAR */}
                            <button
                              type="button"
                              onClick={() => !cannotConfirm && handleImportAction(record.id, "CONFIRM")}
                              disabled={isProcessing || cannotConfirm}
                              title={cannotConfirm ? `Requiere revisión manual (${record.taxTreatment ?? "REVIEW"})` : "Confirmar — entra al motor tributario"}
                              style={{ padding: "5px 10px", borderRadius: "6px", border: "1px solid rgba(22,163,74,0.3)", background: cannotConfirm ? "rgba(255,255,255,0.04)" : "rgba(22,163,74,0.08)", color: cannotConfirm ? "#334155" : "#4ADE80", fontSize: "12px", fontWeight: 600, cursor: isProcessing || cannotConfirm ? "not-allowed" : "pointer", opacity: isProcessing ? 0.5 : 1 }}
                            >
                              ✓
                            </button>

                            {/* RECHAZAR */}
                            <button
                              type="button"
                              onClick={() => handleImportAction(record.id, "REJECT")}
                              disabled={isProcessing}
                              title="Rechazar — no entra al motor"
                              style={{ padding: "5px 10px", borderRadius: "6px", border: "1px solid rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.08)", color: "#F87171", fontSize: "12px", fontWeight: 600, cursor: isProcessing ? "not-allowed" : "pointer", opacity: isProcessing ? 0.5 : 1 }}
                            >
                              ✗
                            </button>

                            {/* REVISAR — solo para PENDING (no para REVIEW) */}
                            {record.status === "PENDING" && (
                              <button
                                type="button"
                                onClick={() => handleImportAction(record.id, "REVIEW")}
                                disabled={isProcessing}
                                title="Marcar para revisión manual — queda pendiente"
                                style={{ padding: "5px 10px", borderRadius: "6px", border: "1px solid rgba(245,158,11,0.3)", background: "rgba(245,158,11,0.08)", color: "#FCD34D", fontSize: "12px", fontWeight: 600, cursor: isProcessing ? "not-allowed" : "pointer", opacity: isProcessing ? 0.5 : 1 }}
                              >
                                ?
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Leyenda */}
              <div style={{ padding: "10px 16px", borderTop: "1px solid rgba(255,255,255,0.05)", display: "flex", gap: "16px", fontSize: "11px", color: "#334155" }}>
                <span><span style={{ color: "#4ADE80" }}>✓</span> Confirmar</span>
                <span><span style={{ color: "#F87171" }}>✗</span> Rechazar</span>
                <span><span style={{ color: "#FCD34D" }}>?</span> Marcar revisión</span>
                <span style={{ color: "#F59E0B" }}>⚠ Revisar = no puede confirmarse sin análisis manual</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
