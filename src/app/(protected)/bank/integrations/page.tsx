"use client";

import { useEffect, useState } from "react";
import { BankTabs } from "@/components/bank/BankTabs";
import { getSessionToken } from "@/modules/identity/client/authStorage";

type BinanceConnectionView = {
  id: string;
  exchange: "BINANCE";
  status: string;
  permissions: string[];
  lastSyncAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type ConnectionResponse = {
  ok: boolean;
  message: string;
  data: {
    connected: boolean;
    connection: BinanceConnectionView | null;
  };
};

type ConnectResponse = {
  ok: boolean;
  message: string;
  data?: {
    status: string;
    connection: BinanceConnectionView | null;
  };
};

export default function BankIntegrationsPage() {
  const [loading,    setLoading]    = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [connected,  setConnected]  = useState(false);
  const [connection, setConnection] = useState<BinanceConnectionView | null>(null);
  const [apiKey,     setApiKey]     = useState("");
  const [apiSecret,  setApiSecret]  = useState("");
  const [message,    setMessage]    = useState<string | null>(null);
  const [error,      setError]      = useState<string | null>(null);

  async function loadConnection() {
    setLoading(true);
    setError(null);

    try {
      const token = getSessionToken();
      const res = await fetch("/api/integrations/binance/connection", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      const json = (await res.json()) as ConnectionResponse;

      if (!res.ok || !json.ok) {
        throw new Error(json.message || "No se pudo obtener la conexión.");
      }

      setConnected(json.data.connected);
      setConnection(json.data.connection);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar integración.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadConnection();
  }, []);

  async function handleConnect(e: React.FormEvent) {
    e.preventDefault();

    setConnecting(true);
    setError(null);
    setMessage(null);

    try {
      const token = getSessionToken();
      const res = await fetch("/api/integrations/binance/connect", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ apiKey, apiSecret }),
      });

      const json = (await res.json()) as ConnectResponse;

      if (!res.ok || !json.ok) {
        throw new Error(json.message || "No se pudo conectar Binance.");
      }

      setMessage(json.message);
      setApiKey("");
      setApiSecret("");
      await loadConnection();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al conectar Binance.");
    } finally {
      setConnecting(false);
    }
  }

  return (
    <div>
      <BankTabs />

      <section style={{ maxWidth: "900px" }}>
        <h1 style={{ margin: 0, fontSize: "28px", color: "#F8FAFC" }}>
          Integraciones
        </h1>

        <p style={{ margin: "8px 0 24px", color: "#94A3B8", fontSize: "14px" }}>
          Conecta exchanges y fuentes financieras externas en modo solo lectura.
        </p>

        <div style={{
          background:   "#0F2236",
          border:       "1px solid rgba(255,255,255,0.08)",
          borderRadius: "16px",
          padding:      "22px",
        }}>
          <div style={{
            display:        "flex",
            justifyContent: "space-between",
            gap:            "16px",
            alignItems:     "flex-start",
            marginBottom:   "20px",
          }}>
            <div>
              <h2 style={{ margin: 0, color: "#F8FAFC", fontSize: "18px" }}>
                Binance
              </h2>
              <p style={{ margin: "6px 0 0", color: "#94A3B8", fontSize: "13px" }}>
                Conexión API readonly para preparar conciliación con movimientos bancarios.
              </p>
            </div>

            <span style={{
              padding:    "6px 10px",
              borderRadius: "999px",
              fontSize:   "12px",
              fontWeight: 700,
              color:      connected ? "#86EFAC" : "#CBD5E1",
              background: connected ? "rgba(34,197,94,0.14)" : "rgba(148,163,184,0.12)",
              border:     connected
                ? "1px solid rgba(34,197,94,0.28)"
                : "1px solid rgba(148,163,184,0.18)",
            }}>
              {loading ? "Verificando" : connected ? "Conectado" : "No conectado"}
            </span>
          </div>

          {connection && (
            <div style={{
              display:             "grid",
              gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
              gap:                 "12px",
              marginBottom:        "20px",
            }}>
              <Info label="Estado"                value={connection.status} />
              <Info label="Permisos"              value={connection.permissions.join(", ") || "Readonly"} />
              <Info
                label="Última sincronización"
                value={connection.lastSyncAt
                  ? new Date(connection.lastSyncAt).toLocaleString("es-CL")
                  : "Sin sincronizar"}
              />
            </div>
          )}

          <form onSubmit={handleConnect} style={{
            display:    "grid",
            gap:        "12px",
            borderTop:  "1px solid rgba(255,255,255,0.08)",
            paddingTop: "18px",
          }}>
            <div>
              <label style={labelStyle}>API Key</label>
              <input
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Pega tu API Key readonly"
                style={inputStyle}
                autoComplete="off"
              />
            </div>

            <div>
              <label style={labelStyle}>API Secret</label>
              <input
                value={apiSecret}
                onChange={(e) => setApiSecret(e.target.value)}
                placeholder="Pega tu API Secret"
                style={inputStyle}
                type="password"
                autoComplete="off"
              />
            </div>

            {error && (
              <p style={{ margin: 0, color: "#F87171", fontSize: "13px" }}>
                {error}
              </p>
            )}

            {message && (
              <p style={{ margin: 0, color: "#86EFAC", fontSize: "13px" }}>
                {message}
              </p>
            )}

            <button
              type="submit"
              disabled={connecting}
              style={{
                justifySelf:  "flex-start",
                padding:      "10px 16px",
                borderRadius: "10px",
                border:       "none",
                background:   "#2563EB",
                color:        "#FFFFFF",
                fontSize:     "13px",
                fontWeight:   700,
                cursor:       connecting ? "wait" : "pointer",
                opacity:      connecting ? 0.7 : 1,
              }}
            >
              {connecting ? "Conectando..." : connected ? "Actualizar conexión" : "Conectar Binance"}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div style={{
      border:       "1px solid rgba(255,255,255,0.08)",
      borderRadius: "12px",
      padding:      "12px",
      background:   "rgba(255,255,255,0.03)",
    }}>
      <p style={{ margin: 0, color: "#64748B", fontSize: "11px", fontWeight: 700, textTransform: "uppercase" }}>
        {label}
      </p>
      <p style={{ margin: "6px 0 0", color: "#E2E8F0", fontSize: "13px" }}>
        {value}
      </p>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display:      "block",
  fontSize:     "12px",
  fontWeight:   700,
  color:        "#94A3B8",
  marginBottom: "6px",
};

const inputStyle: React.CSSProperties = {
  width:        "100%",
  background:   "rgba(255,255,255,0.05)",
  border:       "1px solid rgba(255,255,255,0.12)",
  borderRadius: "10px",
  padding:      "11px 12px",
  fontSize:     "13px",
  color:        "#E2E8F0",
  outline:      "none",
  boxSizing:    "border-box",
};
