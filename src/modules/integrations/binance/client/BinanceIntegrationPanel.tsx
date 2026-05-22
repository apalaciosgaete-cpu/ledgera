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

type ApiResponse<T> = { ok: boolean; message: string; data: T };

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

// ── Main Panel ────────────────────────────────────────────────────────────────

export function BinanceIntegrationPanel() {
  const [conn,             setConn]             = useState<ConnectionStatus | null>(null);
  const [loadingConn,      setLoadingConn]      = useState(true);
  const [apiKey,           setApiKey]           = useState("");
  const [apiSecret,        setApiSecret]        = useState("");
  const [showSecret,       setShowSecret]       = useState(false);
  const [showCredentials,  setShowCredentials]  = useState(false);
  const [connecting,       setConnecting]       = useState(false);
  const [testing,          setTesting]          = useState(false);
  const [testResult,       setTestResult]       = useState<TestResult | null>(null);
  const [msg,              setMsg]              = useState<{ type: "success" | "error" | "warn" | "info"; text: string } | null>(null);

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

  useEffect(() => { void loadStatus(); }, [loadStatus]);

  async function handleConnect() {
    if (!apiKey.trim() && !apiSecret.trim()) {
      setMsg({ type: "warn", text: "Ingresa al menos API Key o API Secret." });
      return;
    }
    setConnecting(true); setMsg(null); setTestResult(null);
    try {
      await httpClient("/api/integrations/binance/connect", {
        method: "POST", auth: true,
        body: { apiKey: apiKey.trim(), apiSecret: apiSecret.trim() },
      });
      setMsg({ type: "success", text: "Conexión establecida correctamente. El Secret ya no se mostrará." });
      setApiKey(""); setApiSecret(""); setShowCredentials(false);
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
    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>

      {/* ── Header del panel ── */}
      <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "12px", padding: "0.875rem 1.25rem" }}>

        {/* Fila de identidad */}
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
              onClick={() => { setShowCredentials(v => !v); setMsg(null); setTestResult(null); }}
              style={{ padding: "6px 12px", borderRadius: "7px", border: "1px solid rgba(255,255,255,0.12)", background: showCredentials ? "rgba(239,68,68,0.1)" : "rgba(255,255,255,0.05)", color: showCredentials ? "#F87171" : "#64748B", fontSize: "11px", fontWeight: 600, cursor: "pointer", fontFamily: fonts.body, whiteSpace: "nowrap", flexShrink: 0 }}
            >
              {showCredentials ? "Cancelar" : "Actualizar claves"}
            </button>
          )}
        </div>

        {msg && <div style={{ marginTop: "0.625rem" }}><Alert type={msg.type} message={msg.text} /></div>}

        {/* Formulario de credenciales */}
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

      {/* ── Probar conexión ── */}
      {isConnected && (
        <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "12px", padding: "0.625rem 1.25rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              {conn?.lastSyncAt ? (
                <span style={{ fontSize: "12px", color: "#475569" }}>
                  Última sync: {new Date(conn.lastSyncAt).toLocaleString("es-CL", { dateStyle: "short", timeStyle: "short" })}
                  {" "}{conn.lastSyncStatus === "OK" ? "✓" : "⚠"}
                </span>
              ) : (
                <span style={{ fontSize: "12px", color: "#334155" }}>Nunca sincronizado · usa Portafolio para sincronizar</span>
              )}
            </div>
            <button
              type="button"
              onClick={handleTest}
              disabled={testing}
              style={{ padding: "7px 14px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)", color: testing ? "#475569" : "#94A3B8", fontSize: "12px", fontWeight: 600, cursor: testing ? "not-allowed" : "pointer", fontFamily: fonts.body, whiteSpace: "nowrap", flexShrink: 0 }}
            >
              {testing ? "Verificando..." : "Probar conexión"}
            </button>
          </div>

          {testResult && (
            <div style={{ marginTop: "0.625rem", paddingTop: "0.625rem", borderTop: "1px solid rgba(255,255,255,0.05)", display: "flex", gap: "1.25rem", fontSize: "11px", color: "#94A3B8", flexWrap: "wrap" }}>
              <span>Tipo: <strong style={{ color: "#CBD5E1" }}>{testResult.accountType}</strong></span>
              <span>Trading: <strong style={{ color: testResult.canTrade ? "#4ADE80" : "#F87171" }}>{testResult.canTrade ? "✓" : "✗"}</strong></span>
              <span>Depósito: <strong style={{ color: testResult.canDeposit ? "#4ADE80" : "#F87171" }}>{testResult.canDeposit ? "✓" : "✗"}</strong></span>
              <span>Activos con saldo: <strong style={{ color: "#CBD5E1" }}>{testResult.balancesCount}</strong></span>
              <span>Permisos: <strong style={{ color: "#CBD5E1" }}>{testResult.permissions.join(", ")}</strong></span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
