"use client";

import { useCallback, useEffect, useState } from "react";
import { fonts } from "@/styles/tokens";
import { httpClient, isHttpClientError } from "@/shared/http/httpClient";

// ── Types ─────────────────────────────────────────────────────────────────────

type SpotStatus = {
  connected:       boolean;
  status?:         string;
  lastSyncAt?:     string | null;
  lastSyncStatus?: string | null;
  apiKeyHint?:     string;
};

type TaxStatus = {
  connected:   boolean;
  apiKeyHint?: string;
};

type TestResult = {
  canTrade:      boolean;
  canDeposit:    boolean;
  accountType:   string;
  permissions:   string[];
  balancesCount: number;
};

type ApiResponse<T> = { ok: boolean; message: string; data: T };

// ── Shared sub-components ─────────────────────────────────────────────────────

function StatusBadge({ connected, status }: { connected: boolean; status?: string }) {
  const s = connected && (status === "CONNECTED" || status === "ACTIVE")
    ? { bg: "rgba(22,163,74,0.10)", color: "#16A34A", border: "rgba(22,163,74,0.25)", label: "Conectada" }
    : { bg: "rgba(100,116,139,0.10)", color: "#64748B", border: "rgba(100,116,139,0.2)", label: "No conectada" };
  return (
    <span style={{ fontSize: "11px", fontWeight: 700, padding: "3px 10px", borderRadius: "6px", background: s.bg, color: s.color, border: `1px solid ${s.border}`, whiteSpace: "nowrap", flexShrink: 0 }}>
      {s.label}
    </span>
  );
}

function Alert({ type, message }: { type: "success" | "error" | "warn" | "info"; message: string }) {
  const map = {
    success: { bg: "rgba(22,163,74,0.06)",  border: "rgba(22,163,74,0.2)",  color: "#15803D" },
    error:   { bg: "rgba(239,68,68,0.06)",  border: "rgba(239,68,68,0.2)",  color: "#DC2626" },
    warn:    { bg: "rgba(245,158,11,0.06)", border: "rgba(245,158,11,0.2)", color: "#D97706" },
    info:    { bg: "rgba(96,165,250,0.06)", border: "rgba(96,165,250,0.2)", color: "#2563EB" },
  };
  const s = map[type];
  return (
    <p style={{ fontSize: "12px", color: s.color, background: s.bg, border: `1px solid ${s.border}`, borderRadius: "6px", padding: "8px 12px", margin: "0 0 0.75rem" }}>
      {message}
    </p>
  );
}

function CredentialForm({
  isConnected, label, onSubmit, saving, placeholder,
}: {
  isConnected: boolean;
  label: string;
  onSubmit: (apiKey: string, apiSecret: string) => Promise<void>;
  saving: boolean;
  placeholder: string;
}) {
  const [apiKey,      setApiKey]      = useState("");
  const [apiSecret,   setApiSecret]   = useState("");
  const [showSecret,  setShowSecret]  = useState(false);

  async function handle() {
    if (!apiKey.trim() && !apiSecret.trim()) return;
    await onSubmit(apiKey.trim(), apiSecret.trim());
    setApiKey(""); setApiSecret("");
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginTop: "0.75rem" }}>
      <div>
        <label style={{ fontSize: "11px", fontWeight: 600, color: "#64748B", display: "block", marginBottom: "5px" }}>API Key</label>
        <input
          type="text"
          value={apiKey}
          onChange={e => setApiKey(e.target.value)}
          placeholder={isConnected ? `Nueva API Key — ${placeholder}` : `API Key — ${placeholder}`}
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
            placeholder={isConnected ? "Nuevo Secret (vacío = mantener)" : "API Secret"}
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
        <p style={{ fontSize: "10px", color: "#64748B", margin: 0, lineHeight: 1.5 }}>Solo lectura · AES-256 · el Secret no se recupera.</p>
        <button
          type="button"
          onClick={handle}
          disabled={saving || (!apiKey.trim() && !apiSecret.trim())}
          style={{ padding: "7px 16px", borderRadius: "8px", border: "none", background: "#16A34A", color: "#fff", fontSize: "12px", fontWeight: 700, cursor: saving || (!apiKey.trim() && !apiSecret.trim()) ? "not-allowed" : "pointer", fontFamily: fonts.body, opacity: (!apiKey.trim() && !apiSecret.trim()) ? 0.4 : 1, whiteSpace: "nowrap", flexShrink: 0 }}
        >
          {saving ? "Conectando..." : isConnected ? `Actualizar ${label}` : `Conectar ${label}`}
        </button>
      </div>
    </div>
  );
}

// ── Spot API section ──────────────────────────────────────────────────────────

function SpotSection() {
  const [conn,           setConn]           = useState<SpotStatus | null>(null);
  const [loading,        setLoading]        = useState(true);
  const [showForm,       setShowForm]       = useState(false);
  const [saving,         setSaving]         = useState(false);
  const [testing,        setTesting]        = useState(false);
  const [testResult,     setTestResult]     = useState<TestResult | null>(null);
  const [msg,            setMsg]            = useState<{ type: "success"|"error"|"warn"|"info"; text: string } | null>(null);

  const loadStatus = useCallback(async () => {
    setLoading(true);
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
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadStatus(); }, [loadStatus]);

  const isConnected = conn?.connected && conn.status === "CONNECTED";

  async function handleConnect(apiKey: string, apiSecret: string) {
    setSaving(true); setMsg(null); setTestResult(null);
    try {
      await httpClient("/api/integrations/binance/connect", {
        method: "POST", auth: true, body: { apiKey, apiSecret },
      });
      setMsg({ type: "success", text: "Spot API conectada. El Secret ya no se mostrará." });
      setShowForm(false);
      await loadStatus();
    } catch (e) {
      setMsg({ type: "error", text: isHttpClientError(e) ? e.message : "Error al conectar." });
    } finally {
      setSaving(false);
    }
  }

  async function handleTest() {
    setTesting(true); setMsg(null); setTestResult(null);
    try {
      const res = await httpClient<ApiResponse<TestResult>>("/api/integrations/binance/test", { method: "POST", auth: true, body: {} });
      setTestResult(res.data);
      setMsg({ type: "success", text: "Conexión verificada." });
    } catch (e) {
      setMsg({ type: "error", text: isHttpClientError(e) ? e.message : "Error al probar." });
    } finally {
      setTesting(false);
    }
  }

  return (
    <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "12px", padding: "1rem 1.25rem", marginBottom: "0.75rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <div style={{ width: "36px", height: "36px", borderRadius: "9px", background: "rgba(240,185,11,0.1)", border: "1px solid rgba(240,185,11,0.25)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: 800, color: "#F0B90B", fontFamily: fonts.body, flexShrink: 0 }}>BN</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: "13px", fontWeight: 700, color: "#0F2A3D", margin: "0 0 1px" }}>API Spot</p>
          <p style={{ fontSize: "11px", color: "#64748B", margin: 0 }}>
            Balances, depósitos/retiros y operaciones spot
            {isConnected && conn?.apiKeyHint && <span style={{ color: "#94A3B8" }}> · …{conn.apiKeyHint}</span>}
          </p>
        </div>
        {!loading && <StatusBadge connected={!!isConnected} status={conn?.status} />}
        {isConnected && (
          <button type="button" onClick={() => { setShowForm(v => !v); setMsg(null); setTestResult(null); }}
            style={{ padding: "5px 10px", borderRadius: "7px", border: "1px solid #E2E8F0", background: showForm ? "rgba(239,68,68,0.06)" : "#F8FAFC", color: showForm ? "#DC2626" : "#64748B", fontSize: "11px", fontWeight: 600, cursor: "pointer", fontFamily: fonts.body, whiteSpace: "nowrap", flexShrink: 0 }}>
            {showForm ? "Cancelar" : "Actualizar"}
          </button>
        )}
      </div>

      {msg && <div style={{ marginTop: "0.5rem" }}><Alert type={msg.type} message={msg.text} /></div>}

      {(!isConnected || showForm) && (
        <CredentialForm isConnected={!!isConnected} label="Spot" onSubmit={handleConnect} saving={saving} placeholder="vacío = mantener actual" />
      )}

      {isConnected && (
        <div style={{ marginTop: "0.75rem", paddingTop: "0.75rem", borderTop: "1px solid #F1F5F9", display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            {conn?.lastSyncAt
              ? <span style={{ fontSize: "11px", color: "#64748B" }}>Última sync: {new Date(conn.lastSyncAt).toLocaleString("es-CL", { dateStyle: "short", timeStyle: "short" })} {conn.lastSyncStatus === "OK" ? "✓" : "⚠"}</span>
              : <span style={{ fontSize: "11px", color: "#94A3B8" }}>Sin sincronizaciones · usa Portafolio para importar</span>
            }
          </div>
          <button type="button" onClick={handleTest} disabled={testing}
            style={{ padding: "5px 12px", borderRadius: "7px", border: "1px solid #E2E8F0", background: "#F8FAFC", color: "#475569", fontSize: "11px", fontWeight: 600, cursor: testing ? "not-allowed" : "pointer", fontFamily: fonts.body, whiteSpace: "nowrap" }}>
            {testing ? "Verificando..." : "Probar conexión"}
          </button>
        </div>
      )}

      {testResult && (
        <div style={{ marginTop: "0.5rem", paddingTop: "0.5rem", borderTop: "1px solid #F1F5F9", display: "flex", gap: "1rem", fontSize: "11px", color: "#475569", flexWrap: "wrap" }}>
          <span>Tipo: <strong style={{ color: "#0F172A" }}>{testResult.accountType}</strong></span>
          <span>Trading: <strong style={{ color: testResult.canTrade ? "#16A34A" : "#DC2626" }}>{testResult.canTrade ? "✓" : "✗"}</strong></span>
          <span>Depósito: <strong style={{ color: testResult.canDeposit ? "#16A34A" : "#DC2626" }}>{testResult.canDeposit ? "✓" : "✗"}</strong></span>
          <span>Activos con saldo: <strong style={{ color: "#0F172A" }}>{testResult.balancesCount}</strong></span>
          <span>Permisos: <strong style={{ color: "#0F172A" }}>{testResult.permissions.join(", ")}</strong></span>
        </div>
      )}
    </div>
  );
}

// ── Tax API section ───────────────────────────────────────────────────────────

function TaxSection() {
  const [conn,     setConn]    = useState<TaxStatus | null>(null);
  const [loading,  setLoading] = useState(true);
  const [showForm, setShowForm]= useState(false);
  const [saving,   setSaving]  = useState(false);
  const [testing,  setTesting] = useState(false);
  const [msg,      setMsg]     = useState<{ type: "success"|"error"|"warn"|"info"; text: string } | null>(null);

  const loadStatus = useCallback(async () => {
    setLoading(true);
    try {
      const res = await httpClient<ApiResponse<TaxStatus>>("/api/integrations/binance/tax/connect", { auth: true });
      setConn(res.data);
    } catch {
      setConn({ connected: false });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadStatus(); }, [loadStatus]);

  const isConnected = conn?.connected === true;

  async function handleConnect(apiKey: string, apiSecret: string) {
    setSaving(true); setMsg(null);
    try {
      await httpClient("/api/integrations/binance/tax/connect", {
        method: "POST", auth: true, body: { apiKey, apiSecret },
      });
      setMsg({ type: "success", text: "API Tributaria conectada. El Secret ya no se mostrará." });
      setShowForm(false);
      await loadStatus();
    } catch (e) {
      setMsg({ type: "error", text: isHttpClientError(e) ? e.message : "Error al conectar." });
    } finally {
      setSaving(false);
    }
  }

  async function handleTest() {
    setTesting(true); setMsg(null);
    try {
      await httpClient("/api/integrations/binance/tax/test", { method: "POST", auth: true, body: {} });
      setMsg({ type: "success", text: "Conexión con Tax API verificada correctamente." });
    } catch (e) {
      setMsg({ type: "error", text: isHttpClientError(e) ? e.message : "Error al verificar." });
    } finally {
      setTesting(false);
    }
  }

  return (
    <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "12px", padding: "1rem 1.25rem", marginBottom: "0.75rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <div style={{ width: "36px", height: "36px", borderRadius: "9px", background: "rgba(240,185,11,0.1)", border: "1px solid rgba(240,185,11,0.25)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: 800, color: "#F0B90B", fontFamily: fonts.body, flexShrink: 0 }}>BN</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: "13px", fontWeight: 700, color: "#0F2A3D", margin: "0 0 1px" }}>API Tributaria</p>
          <p style={{ fontSize: "11px", color: "#64748B", margin: 0 }}>
            Historial tributario multi-año · independiente de Spot
            {isConnected && conn?.apiKeyHint && <span style={{ color: "#94A3B8" }}> · …{conn.apiKeyHint}</span>}
          </p>
        </div>
        {!loading && <StatusBadge connected={isConnected} status={isConnected ? "ACTIVE" : undefined} />}
        {isConnected && (
          <button type="button" onClick={() => { setShowForm(v => !v); setMsg(null); }}
            style={{ padding: "5px 10px", borderRadius: "7px", border: "1px solid #E2E8F0", background: showForm ? "rgba(239,68,68,0.06)" : "#F8FAFC", color: showForm ? "#DC2626" : "#64748B", fontSize: "11px", fontWeight: 600, cursor: "pointer", fontFamily: fonts.body, whiteSpace: "nowrap", flexShrink: 0 }}>
            {showForm ? "Cancelar" : "Actualizar"}
          </button>
        )}
      </div>

      {msg && <div style={{ marginTop: "0.5rem" }}><Alert type={msg.type} message={msg.text} /></div>}

      {(!isConnected || showForm) && (
        <CredentialForm isConnected={isConnected} label="Tax" onSubmit={handleConnect} saving={saving} placeholder="API Tax Report de Binance" />
      )}

      {!isConnected && !showForm && (
        <p style={{ fontSize: "11px", color: "#94A3B8", margin: "0.75rem 0 0", lineHeight: 1.5 }}>
          Crea una API Key en Binance con permiso <strong style={{ color: "#64748B" }}>Tax Report (Read Only)</strong> y conéctala aquí.
        </p>
      )}

      {isConnected && (
        <div style={{ marginTop: "0.75rem", paddingTop: "0.75rem", borderTop: "1px solid #F1F5F9", display: "flex", justifyContent: "flex-end" }}>
          <button type="button" onClick={handleTest} disabled={testing}
            style={{ padding: "5px 12px", borderRadius: "7px", border: "1px solid #E2E8F0", background: "#F8FAFC", color: "#475569", fontSize: "11px", fontWeight: 600, cursor: testing ? "not-allowed" : "pointer", fontFamily: fonts.body, whiteSpace: "nowrap" }}>
            {testing ? "Verificando..." : "Probar conexión"}
          </button>
        </div>
      )}
    </div>
  );
}

// ── Main Panel ────────────────────────────────────────────────────────────────

export function BinanceIntegrationPanel() {
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <SpotSection />
      <TaxSection />
    </div>
  );
}
