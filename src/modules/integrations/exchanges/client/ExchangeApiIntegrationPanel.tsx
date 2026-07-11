"use client";

import { useCallback, useEffect, useState, type CSSProperties, type FormEvent } from "react";

import { httpClient, isHttpClientError } from "@/shared/http/httpClient";
import { fonts } from "@/styles/tokens";

type ApiResponse<T> = { ok: boolean; message: string; data: T };

type ExchangeStatus = {
  connected: boolean;
  exchangeId: string;
  exchangeName: string;
  status?: string;
  apiKeyHint?: string;
  lastSyncAt?: string | null;
  requiresPassphrase?: boolean;
};

type SyncResult = {
  imported: number;
  skipped: number;
  total: number;
  warnings: string[];
  sinceDays: number;
  lastSyncAt: string | null;
};

type Feedback = { type: "success" | "error" | "info"; message: string };

type Props = {
  exchangeId: string;
  exchangeName: string;
  requiresPassphrase: boolean;
  secretLabel?: string;
  passphraseLabel?: string;
};

const panelStyle: CSSProperties = {
  border: "1px solid var(--border)",
  borderRadius: 18,
  background: "var(--bg-elev)",
  padding: 18,
  boxShadow: "var(--shadow-sm)",
  fontFamily: fonts.body,
};

const fieldStyle: CSSProperties = {
  width: "100%",
  minHeight: 44,
  borderRadius: 12,
  border: "1px solid var(--border)",
  background: "var(--bg-elev)",
  color: "var(--text)",
  padding: "0 12px",
  fontFamily: fonts.body,
  boxSizing: "border-box",
};

function FeedbackBox({ feedback }: { feedback: Feedback }) {
  const tone = feedback.type === "success"
    ? { border: "rgba(22,163,74,0.26)", bg: "rgba(22,163,74,0.08)", color: "var(--accent)" }
    : feedback.type === "error"
      ? { border: "rgba(239,68,68,0.26)", bg: "rgba(239,68,68,0.08)", color: "var(--loss)" }
      : { border: "var(--border)", bg: "var(--bg-sunken)", color: "var(--text)" };

  return (
    <div style={{ border: `1px solid ${tone.border}`, background: tone.bg, color: tone.color, borderRadius: 12, padding: "10px 12px", fontSize: 12.5, lineHeight: 1.45 }}>
      {feedback.message}
    </div>
  );
}

export function ExchangeApiIntegrationPanel({
  exchangeId,
  exchangeName,
  requiresPassphrase,
  secretLabel = "API Secret",
  passphraseLabel = "Passphrase de API",
}: Props) {
  const endpoint = `/api/connectors/exchanges/${exchangeId}`;
  const [status, setStatus] = useState<ExchangeStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [apiKey, setApiKey] = useState("");
  const [apiSecret, setApiSecret] = useState("");
  const [passphrase, setPassphrase] = useState("");
  const [sinceDays, setSinceDays] = useState("365");
  const [limit, setLimit] = useState("500");
  const [connecting, setConnecting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [lastSync, setLastSync] = useState<SyncResult | null>(null);

  const loadStatus = useCallback(async () => {
    setLoading(true);
    try {
      const response = await httpClient<ApiResponse<ExchangeStatus>>(endpoint, { auth: true });
      setStatus(response.data);
    } catch {
      setStatus({ connected: false, exchangeId, exchangeName, requiresPassphrase });
    } finally {
      setLoading(false);
    }
  }, [endpoint, exchangeId, exchangeName, requiresPassphrase]);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  const connected = status?.connected === true && ["CONNECTED", "ACTIVE"].includes(status.status ?? "CONNECTED");

  async function connect(event: FormEvent) {
    event.preventDefault();
    if (!apiKey.trim() || !apiSecret.trim() || (requiresPassphrase && !passphrase.trim())) return;

    setConnecting(true);
    setFeedback(null);
    try {
      const response = await httpClient<ApiResponse<ExchangeStatus>>(endpoint, {
        auth: true,
        method: "POST",
        body: {
          action: "connect",
          apiKey: apiKey.trim(),
          apiSecret: apiSecret.trim(),
          passphrase: passphrase.trim() || undefined,
        },
      });
      setStatus(response.data);
      setApiKey("");
      setApiSecret("");
      setPassphrase("");
      setFeedback({ type: "success", message: response.message });
    } catch (error) {
      setFeedback({
        type: "error",
        message: isHttpClientError(error) ? error.message : `No fue posible conectar ${exchangeName}.`,
      });
    } finally {
      setConnecting(false);
    }
  }

  async function sync(event: FormEvent) {
    event.preventDefault();
    setSyncing(true);
    setFeedback(null);
    setLastSync(null);
    try {
      const response = await httpClient<ApiResponse<SyncResult>>(endpoint, {
        auth: true,
        method: "POST",
        body: {
          action: "sync",
          sinceDays: Number(sinceDays),
          limit: Number(limit),
        },
      });
      setLastSync(response.data);
      setFeedback({ type: "success", message: response.message });
      await loadStatus();
    } catch (error) {
      setFeedback({
        type: "error",
        message: isHttpClientError(error) ? error.message : `No fue posible sincronizar ${exchangeName}.`,
      });
    } finally {
      setSyncing(false);
    }
  }

  async function disconnect() {
    setDisconnecting(true);
    setFeedback(null);
    try {
      const response = await httpClient<ApiResponse<ExchangeStatus>>(endpoint, {
        auth: true,
        method: "POST",
        body: { action: "disconnect" },
      });
      setStatus(response.data);
      setLastSync(null);
      setFeedback({ type: "success", message: response.message });
    } catch (error) {
      setFeedback({
        type: "error",
        message: isHttpClientError(error) ? error.message : `No fue posible desconectar ${exchangeName}.`,
      });
    } finally {
      setDisconnecting(false);
    }
  }

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <section style={panelStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", marginBottom: 14, flexWrap: "wrap" }}>
          <div>
            <strong style={{ display: "block", color: "var(--text)", fontSize: 16, fontWeight: 900 }}>Conexión API de solo lectura</strong>
            <span style={{ color: "var(--text-soft)", fontSize: 12.5 }}>LEDGERA valida las credenciales con {exchangeName} y cifra los secretos antes de almacenarlos.</span>
          </div>
          {!loading && (
            <span style={{ borderRadius: 999, padding: "5px 10px", fontSize: 11, fontWeight: 900, background: connected ? "rgba(22,163,74,0.10)" : "var(--bg-sunken)", color: connected ? "var(--accent)" : "var(--text-soft)", border: `1px solid ${connected ? "rgba(22,163,74,0.24)" : "var(--border)"}` }}>
              {connected ? `Conectada${status?.apiKeyHint ? ` · …${status.apiKeyHint}` : ""}` : "No conectada"}
            </span>
          )}
        </div>

        <form onSubmit={connect} style={{ display: "grid", gridTemplateColumns: `repeat(auto-fit,minmax(${requiresPassphrase ? "190px" : "230px"},1fr))`, gap: 10 }}>
          <input value={apiKey} onChange={(event) => setApiKey(event.target.value)} placeholder="API Key" autoComplete="off" style={fieldStyle} />
          <input value={apiSecret} onChange={(event) => setApiSecret(event.target.value)} placeholder={secretLabel} type="password" autoComplete="new-password" style={fieldStyle} />
          {requiresPassphrase && (
            <input value={passphrase} onChange={(event) => setPassphrase(event.target.value)} placeholder={passphraseLabel} type="password" autoComplete="new-password" style={fieldStyle} />
          )}
          <button type="submit" disabled={connecting || !apiKey.trim() || !apiSecret.trim() || (requiresPassphrase && !passphrase.trim())} style={{ minHeight: 44, borderRadius: 12, border: "none", background: "var(--accent)", color: "var(--accent-contrast, #00131f)", padding: "0 16px", fontWeight: 900, cursor: connecting ? "wait" : "pointer", opacity: !apiKey.trim() || !apiSecret.trim() || (requiresPassphrase && !passphrase.trim()) ? 0.5 : 1 }}>
            {connecting ? "Validando…" : connected ? "Actualizar conexión" : `Conectar ${exchangeName}`}
          </button>
        </form>
        <p style={{ margin: "10px 0 0", color: "var(--text-soft)", fontSize: 11.5 }}>Crea una API sin permisos de trading ni retiro. LEDGERA no solicita tu contraseña, códigos 2FA ni claves de inicio de sesión.</p>
      </section>

      {connected && (
        <section style={panelStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", gap: 12, flexWrap: "wrap", marginBottom: 14 }}>
            <div>
              <strong style={{ display: "block", color: "var(--text)", fontSize: 16, fontWeight: 900 }}>Sincronizar operaciones</strong>
              <span style={{ color: "var(--text-soft)", fontSize: 12.5 }}>Las operaciones, depósitos y retiros disponibles pasarán a Importaciones para revisión.</span>
            </div>
            <button type="button" onClick={disconnect} disabled={disconnecting} style={{ minHeight: 34, borderRadius: 10, border: "1px solid var(--border)", background: "transparent", color: "var(--text-soft)", padding: "0 11px", fontSize: 11.5, fontWeight: 800, cursor: disconnecting ? "wait" : "pointer" }}>
              {disconnecting ? "Desconectando…" : "Desconectar"}
            </button>
          </div>

          <form onSubmit={sync} style={{ display: "grid", gridTemplateColumns: "minmax(150px,0.7fr) minmax(150px,0.7fr) auto", gap: 10, alignItems: "end" }}>
            <label style={{ display: "grid", gap: 5, color: "var(--text-soft)", fontSize: 11.5 }}>
              Historial
              <select value={sinceDays} onChange={(event) => setSinceDays(event.target.value)} style={fieldStyle}>
                <option value="30">Últimos 30 días</option>
                <option value="90">Últimos 90 días</option>
                <option value="365">Último año</option>
                <option value="1095">Últimos 3 años</option>
                <option value="3650">Hasta 10 años</option>
              </select>
            </label>
            <label style={{ display: "grid", gap: 5, color: "var(--text-soft)", fontSize: 11.5 }}>
              Máximo por consulta
              <input value={limit} onChange={(event) => setLimit(event.target.value)} inputMode="numeric" style={fieldStyle} />
            </label>
            <button type="submit" disabled={syncing} style={{ minHeight: 44, borderRadius: 12, border: "1px solid var(--border-strong)", background: "var(--bg-elev)", color: "var(--text)", padding: "0 16px", fontWeight: 900, cursor: syncing ? "wait" : "pointer" }}>
              {syncing ? "Sincronizando…" : "Sincronizar ahora"}
            </button>
          </form>
          {status?.lastSyncAt && <p style={{ margin: "10px 0 0", color: "var(--text-soft)", fontSize: 11.5 }}>Última sincronización: {new Date(status.lastSyncAt).toLocaleString("es-CL")}</p>}
        </section>
      )}

      {feedback && <FeedbackBox feedback={feedback} />}

      {lastSync && (
        <section style={{ ...panelStyle, display: "grid", gap: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <div style={{ color: "var(--text)", fontSize: 12.5 }}>
              <strong>{lastSync.imported} nuevos</strong> · {lastSync.skipped} duplicados · {lastSync.total} recuperados
            </div>
            <a href="/importaciones?source=EXCHANGE" style={{ textDecoration: "none", minHeight: 36, display: "inline-flex", alignItems: "center", borderRadius: 10, background: "var(--accent)", color: "var(--accent-contrast, #00131f)", padding: "0 14px", fontSize: 12, fontWeight: 900 }}>
              Revisar importaciones
            </a>
          </div>
          {lastSync.warnings.length > 0 && (
            <div style={{ color: "var(--text-soft)", fontSize: 11.5, lineHeight: 1.45 }}>
              {lastSync.warnings.map((warning) => <div key={warning}>• {warning}</div>)}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
