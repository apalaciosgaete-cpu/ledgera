"use client";

import { useCallback, useEffect, useState } from "react";
import { fonts } from "@/styles/tokens";
import { httpClient, isHttpClientError } from "@/shared/http/httpClient";

// ── Types ─────────────────────────────────────────────────────────────────────

type ConnectionStatus = {
  connected:       boolean;
  status?:         string;
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
  imported: number;
  skipped:  number;
  errors:   string[];
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

// ── Main Panel ────────────────────────────────────────────────────────────────

export function BinanceIntegrationPanel() {
  const [conn,          setConn]          = useState<ConnectionStatus | null>(null);
  const [loadingConn,   setLoadingConn]   = useState(true);
  const [apiKey,        setApiKey]        = useState("");
  const [apiSecret,     setApiSecret]     = useState("");
  const [showSecret,    setShowSecret]    = useState(false);
  const [connecting,    setConnecting]    = useState(false);
  const [testing,       setTesting]       = useState(false);
  const [syncing,       setSyncing]       = useState(false);
  const [testResult,    setTestResult]    = useState<TestResult | null>(null);
  const [syncResult,    setSyncResult]    = useState<SyncResult | null>(null);
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
    if (conn?.connected && (conn.pendingCount ?? 0) > 0) loadImports();
  }, [conn, loadImports]);

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

  const isConnected = conn?.connected && conn.status === "ACTIVE";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>

      {/* ── Header del panel ── */}
      <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "12px", padding: "1.25rem 1.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", marginBottom: "1.25rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ width: "42px", height: "42px", borderRadius: "10px", background: "rgba(240,185,11,0.1)", border: "1px solid rgba(240,185,11,0.25)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 800, color: "#F0B90B", fontFamily: fonts.body, letterSpacing: "-0.02em" }}>
              BN
            </div>
            <div>
              <p style={{ fontSize: "15px", fontWeight: 700, color: "#F1F5F9", margin: "0 0 2px" }}>Binance</p>
              <p style={{ fontSize: "12px", color: "#475569", margin: 0 }}>Spot — API Read-Only</p>
            </div>
          </div>
          <StatusBadge status={conn?.status ?? "disconnected"} />
        </div>

        {msg && <Alert type={msg.type} message={msg.text} />}

        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "1rem" }}>
          <div>
            <label style={{ fontSize: "12px", fontWeight: 600, color: "#94A3B8", display: "block", marginBottom: "6px" }}>
              API Key {isConnected && conn?.apiKeyHint && <span style={{ color: "#475569", fontWeight: 400 }}>— guardada (…{conn.apiKeyHint})</span>}
            </label>
            <input
              type="text"
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              placeholder={isConnected ? "Nueva API Key (deja vacío para mantener la actual)" : "Pega tu API Key de Binance"}
              style={{ background: "#F8FAFC", border: "1px solid #CBD5E1", borderRadius: "8px", padding: "9px 12px", color: "#0F172A", fontSize: "13px", fontFamily: fonts.body, outline: "none", width: "100%", boxSizing: "border-box" }}
            />
          </div>

          <div>
            <label style={{ fontSize: "12px", fontWeight: 600, color: "#94A3B8", display: "block", marginBottom: "6px" }}>
              API Secret {isConnected && <span style={{ color: "#475569", fontWeight: 400 }}> — cifrado, no se muestra</span>}
            </label>
            <div style={{ position: "relative" }}>
              <input
                type={showSecret ? "text" : "password"}
                value={apiSecret}
                onChange={e => setApiSecret(e.target.value)}
                placeholder={isConnected ? "Nuevo API Secret (deja vacío para mantener el actual)" : "Pega tu API Secret de Binance"}
                style={{ background: "#F8FAFC", border: "1px solid #CBD5E1", borderRadius: "8px", padding: "9px 40px 9px 12px", color: "#0F172A", fontSize: "13px", fontFamily: fonts.body, outline: "none", width: "100%", boxSizing: "border-box" }}
              />
              <button
                type="button"
                onClick={() => setShowSecret(v => !v)}
                style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#94A3B8", padding: 0 }}
              >
                {showSecret
                  ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                }
              </button>
            </div>
          </div>
        </div>

        <p style={{ fontSize: "11px", color: "#334155", margin: "0 0 1rem", lineHeight: 1.5 }}>
          Crea las claves en Binance con permisos <strong style={{ color: "#64748B" }}>solo lectura</strong>. Nunca habilites trading ni retiros. El Secret se cifra con AES-256 y no puede recuperarse desde aquí.
        </p>

        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <ActionButton
            onClick={handleConnect}
            loading={connecting}
            loadingLabel="Conectando..."
            label={isConnected ? "Actualizar credenciales" : "Conectar Binance"}
            disabled={!apiKey.trim() && !apiSecret.trim()}
          />
          {isConnected && (
            <ActionButton
              onClick={handleTest}
              loading={testing}
              loadingLabel="Verificando..."
              label="Probar conexión"
              variant="secondary"
            />
          )}
        </div>

        {testResult && (
          <div style={{ marginTop: "1rem", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "8px", padding: "0.75rem 1rem", fontSize: "12px", color: "#94A3B8" }}>
            <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap" }}>
              <span>Tipo: <strong style={{ color: "#CBD5E1" }}>{testResult.accountType}</strong></span>
              <span>Trading: <strong style={{ color: testResult.canTrade ? "#4ADE80" : "#F87171" }}>{testResult.canTrade ? "✓" : "✗"}</strong></span>
              <span>Depósito: <strong style={{ color: testResult.canDeposit ? "#4ADE80" : "#F87171" }}>{testResult.canDeposit ? "✓" : "✗"}</strong></span>
              <span>Activos con saldo: <strong style={{ color: "#CBD5E1" }}>{testResult.balancesCount}</strong></span>
              <span>Permisos: <strong style={{ color: "#CBD5E1" }}>{testResult.permissions.join(", ")}</strong></span>
            </div>
          </div>
        )}
      </div>

      {/* ── Sincronización ── */}
      {isConnected && (
        <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "12px", padding: "1.25rem 1.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
            <div>
              <h4 style={{ fontSize: "13px", fontWeight: 700, color: "#F1F5F9", margin: "0 0 4px" }}>Sincronización</h4>
              <p style={{ fontSize: "12px", color: "#475569", margin: 0 }}>
                {conn?.lastSyncAt
                  ? `Última sync: ${new Date(conn.lastSyncAt).toLocaleString("es-CL", { dateStyle: "short", timeStyle: "short" })} — ${conn.lastSyncStatus === "OK" ? "✓ exitosa" : "⚠ con errores"}`
                  : "Nunca sincronizado"}
                {(conn?.pendingCount ?? 0) > 0 && (
                  <span style={{ marginLeft: "12px", color: "#F0B90B", fontWeight: 600 }}>
                    {conn?.pendingCount} registros pendientes
                  </span>
                )}
              </p>
            </div>
            <ActionButton
              onClick={handleSync}
              loading={syncing}
              loadingLabel="Sincronizando..."
              label="Sincronizar ahora"
              variant="secondary"
            />
          </div>

          {conn?.lastSyncError && (
            <div style={{ marginTop: "0.75rem", fontSize: "12px", color: "#F87171", background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)", borderRadius: "6px", padding: "8px 12px" }}>
              Último error: {conn.lastSyncError}
            </div>
          )}

          {syncResult && (
            <div style={{ marginTop: "0.75rem", display: "flex", gap: "1.5rem", fontSize: "12px", color: "#94A3B8", flexWrap: "wrap" }}>
              <span>Nuevos: <strong style={{ color: "#4ADE80" }}>{syncResult.imported}</strong></span>
              <span>Ya existentes: <strong style={{ color: "#64748B" }}>{syncResult.skipped}</strong></span>
              {syncResult.errors.length > 0 && <span>Errores: <strong style={{ color: "#F87171" }}>{syncResult.errors.length}</strong></span>}
            </div>
          )}
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
              style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "6px", color: "#64748B", fontSize: "12px", padding: "6px 12px", cursor: loadingImports ? "not-allowed" : "pointer", fontFamily: fonts.body }}
            >
              {loadingImports ? "Cargando..." : "Actualizar"}
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
