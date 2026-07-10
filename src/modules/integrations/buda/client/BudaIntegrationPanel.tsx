"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";

import { fonts } from "@/styles/tokens";
import { httpClient, isHttpClientError } from "@/shared/http/httpClient";

type ApiResponse<T> = { ok: boolean; message: string; data: T };

type BudaStatus = {
  connected: boolean;
  status?: string;
  apiKeyHint?: string;
  lastSyncAt?: string | null;
};

type ImportResult = {
  imported: number;
  skipped: number;
  total: number;
  marketId: string;
  lastSyncAt: string | null;
};

type Feedback = { type: "success" | "error" | "info"; message: string };

const panelStyle: React.CSSProperties = {
  border: "1px solid var(--border)",
  borderRadius: 18,
  background: "var(--bg-elev)",
  padding: 18,
  boxShadow: "0 10px 24px rgba(15,42,61,0.05)",
  fontFamily: fonts.body,
};

const fieldStyle: React.CSSProperties = {
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
    <div style={{ border: `1px solid ${tone.border}`, background: tone.bg, color: tone.color, borderRadius: 12, padding: "10px 12px", fontSize: 12.5, lineHeight: 1.4 }}>
      {feedback.message}
    </div>
  );
}

export function BudaIntegrationPanel() {
  const [status, setStatus] = useState<BudaStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [apiKey, setApiKey] = useState("");
  const [apiSecret, setApiSecret] = useState("");
  const [marketId, setMarketId] = useState("btc-clp");
  const [limit, setLimit] = useState("100");
  const [connecting, setConnecting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [lastImport, setLastImport] = useState<ImportResult | null>(null);

  const loadStatus = useCallback(async () => {
    setLoading(true);
    try {
      const response = await httpClient<ApiResponse<BudaStatus>>("/api/connectors/buda", { auth: true });
      setStatus(response.data);
    } catch {
      setStatus({ connected: false });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  async function connect(event: FormEvent) {
    event.preventDefault();
    if (!apiKey.trim() || !apiSecret.trim()) return;

    setConnecting(true);
    setFeedback(null);
    try {
      const response = await httpClient<ApiResponse<BudaStatus>>("/api/connectors/buda", {
        auth: true,
        method: "POST",
        body: { action: "connect", apiKey: apiKey.trim(), apiSecret: apiSecret.trim() },
      });
      setStatus(response.data);
      setApiKey("");
      setApiSecret("");
      setFeedback({ type: "success", message: response.message });
    } catch (error) {
      setFeedback({ type: "error", message: isHttpClientError(error) ? error.message : "No fue posible conectar Buda.com." });
    } finally {
      setConnecting(false);
    }
  }

  async function importTrades(event: FormEvent) {
    event.preventDefault();
    setImporting(true);
    setFeedback(null);
    setLastImport(null);

    try {
      const response = await httpClient<ApiResponse<ImportResult>>("/api/connectors/buda", {
        auth: true,
        method: "POST",
        body: {
          action: "import",
          marketId: marketId.trim().toLowerCase(),
          limit: Number(limit),
        },
      });
      setLastImport(response.data);
      setFeedback({ type: "success", message: response.message });
      await loadStatus();
    } catch (error) {
      setFeedback({ type: "error", message: isHttpClientError(error) ? error.message : "No fue posible importar operaciones desde Buda.com." });
    } finally {
      setImporting(false);
    }
  }

  const connected = status?.connected === true && ["CONNECTED", "ACTIVE"].includes(status.status ?? "CONNECTED");

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <section style={panelStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", marginBottom: 14, flexWrap: "wrap" }}>
          <div>
            <strong style={{ display: "block", color: "var(--text)", fontSize: 16, fontWeight: 900 }}>Conexión API de solo lectura</strong>
            <span style={{ color: "var(--text-soft)", fontSize: 12.5 }}>LEDGERA valida las credenciales con Buda.com y cifra el secreto antes de almacenarlo.</span>
          </div>
          {!loading && (
            <span style={{ borderRadius: 999, padding: "5px 10px", fontSize: 11, fontWeight: 900, background: connected ? "rgba(22,163,74,0.10)" : "var(--bg-sunken)", color: connected ? "var(--accent)" : "var(--text-soft)", border: `1px solid ${connected ? "rgba(22,163,74,0.24)" : "var(--border)"}` }}>
              {connected ? `Conectada${status?.apiKeyHint ? ` · …${status.apiKeyHint}` : ""}` : "No conectada"}
            </span>
          )}
        </div>

        <form onSubmit={connect} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 10 }}>
          <input value={apiKey} onChange={(event) => setApiKey(event.target.value)} placeholder="API Key" autoComplete="off" style={fieldStyle} />
          <input value={apiSecret} onChange={(event) => setApiSecret(event.target.value)} placeholder="API Secret" type="password" autoComplete="new-password" style={fieldStyle} />
          <button type="submit" disabled={connecting || !apiKey.trim() || !apiSecret.trim()} style={{ minHeight: 44, borderRadius: 12, border: "none", background: "var(--accent)", color: "var(--text)", padding: "0 16px", fontWeight: 900, cursor: connecting ? "wait" : "pointer", opacity: !apiKey.trim() || !apiSecret.trim() ? 0.5 : 1 }}>
            {connecting ? "Conectando…" : connected ? "Actualizar conexión" : "Conectar Buda.com"}
          </button>
        </form>
        <p style={{ margin: "10px 0 0", color: "var(--text-soft)", fontSize: 11.5 }}>Usa una API sin permisos de retiro. LEDGERA nunca solicitará códigos 2FA ni credenciales de inicio de sesión.</p>
      </section>

      {connected && (
        <section style={panelStyle}>
          <strong style={{ display: "block", color: "var(--text)", fontSize: 16, fontWeight: 900, marginBottom: 4 }}>Importar operaciones</strong>
          <p style={{ margin: "0 0 14px", color: "var(--text-soft)", fontSize: 12.5 }}>Indica el mercado que deseas sincronizar. Las operaciones nuevas pasarán a Importaciones para revisión.</p>
          <form onSubmit={importTrades} style={{ display: "grid", gridTemplateColumns: "minmax(180px,1fr) minmax(120px,0.45fr) auto", gap: 10, alignItems: "end" }}>
            <label style={{ display: "grid", gap: 5, color: "var(--text-soft)", fontSize: 11.5 }}>
              Mercado
              <input value={marketId} onChange={(event) => setMarketId(event.target.value)} placeholder="btc-clp" style={fieldStyle} />
            </label>
            <label style={{ display: "grid", gap: 5, color: "var(--text-soft)", fontSize: 11.5 }}>
              Límite
              <input value={limit} onChange={(event) => setLimit(event.target.value)} inputMode="numeric" style={fieldStyle} />
            </label>
            <button type="submit" disabled={importing} style={{ minHeight: 44, borderRadius: 12, border: "1px solid var(--border-strong)", background: "var(--bg-elev)", color: "var(--text)", padding: "0 16px", fontWeight: 900, cursor: importing ? "wait" : "pointer" }}>
              {importing ? "Importando…" : "Importar operaciones"}
            </button>
          </form>
          {status?.lastSyncAt && <p style={{ margin: "10px 0 0", color: "var(--text-soft)", fontSize: 11.5 }}>Última sincronización: {new Date(status.lastSyncAt).toLocaleString("es-CL")}</p>}
        </section>
      )}

      {feedback && <FeedbackBox feedback={feedback} />}

      {lastImport && (
        <section style={{ ...panelStyle, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <div style={{ color: "var(--text)", fontSize: 12.5 }}>
            <strong>{lastImport.imported} nuevas</strong> · {lastImport.skipped} duplicadas · mercado {lastImport.marketId.toUpperCase()}
          </div>
          <a href="/importaciones?source=EXCHANGE" style={{ textDecoration: "none", minHeight: 36, display: "inline-flex", alignItems: "center", borderRadius: 10, background: "var(--accent)", color: "var(--text)", padding: "0 14px", fontSize: 12, fontWeight: 900 }}>
            Revisar importaciones
          </a>
        </section>
      )}
    </div>
  );
}
