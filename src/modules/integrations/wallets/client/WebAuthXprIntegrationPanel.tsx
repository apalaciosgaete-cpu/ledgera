"use client";

import { useCallback, useEffect, useState, type CSSProperties } from "react";

import { httpClient, isHttpClientError } from "@/shared/http/httpClient";
import { fonts } from "@/styles/tokens";

type ApiResponse<T> = { ok: boolean; message: string; data: T };

type WalletConnection = {
  id: string;
  network: string;
  address: string;
  label: string | null;
  explorerUrl: string;
};

type WebAuthSession = {
  auth?: {
    actor?: { toString(): string } | string;
    permission?: { toString(): string } | string;
  };
};

type ConnectWalletResult = {
  session?: WebAuthSession;
  link?: unknown;
};

type ConnectWalletFunction = (options: Record<string, unknown>) => Promise<ConnectWalletResult>;

const XPR_MAINNET_CHAIN_ID = "384da888112027f0321850a169f737c33e53b388aad48b5adace4bab97f437e0";
const XPR_ENDPOINTS = ["https://api.protonnz.com", "https://proton.eosusa.io"];

const panelStyle: CSSProperties = {
  border: "1px solid var(--border)",
  borderRadius: 18,
  background: "var(--bg-elev)",
  padding: 18,
  boxShadow: "var(--shadow-sm)",
  fontFamily: fonts.body,
};

function actorName(session?: WebAuthSession): string {
  const actor = session?.auth?.actor;
  return typeof actor === "string" ? actor : actor?.toString?.() ?? "";
}

export function WebAuthXprIntegrationPanel() {
  const [connections, setConnections] = useState<WalletConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [disconnectingId, setDisconnectingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ ok: boolean; message: string } | null>(null);

  const loadConnections = useCallback(async () => {
    setLoading(true);
    try {
      const response = await httpClient<ApiResponse<WalletConnection[]>>("/api/wallet-connections", { auth: true });
      setConnections(
        response.data.filter(
          (connection) => connection.network === "XPR" && connection.label === "WebAuth.com",
        ),
      );
    } catch {
      setConnections([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadConnections();
  }, [loadConnections]);

  async function connectWebAuth() {
    setConnecting(true);
    setFeedback(null);

    try {
      const sdkModule = await import("@proton/web-sdk");
      const connectWallet = sdkModule.default as unknown as ConnectWalletFunction;
      const result = await connectWallet({
        linkOptions: {
          endpoints: XPR_ENDPOINTS,
          chainId: XPR_MAINNET_CHAIN_ID,
          restoreSession: false,
        },
        selectorOptions: {
          appName: "LEDGERA",
          enabledWalletTypes: ["webauth"],
          walletType: "webauth",
        },
        uiOptions: { theme: "light" },
      });

      const accountName = actorName(result.session).trim().toLowerCase();
      if (!accountName) throw new Error("WebAuth no devolvió una cuenta XPR.");

      const response = await httpClient<ApiResponse<WalletConnection>>("/api/wallet-connections", {
        auth: true,
        method: "POST",
        body: {
          network: "XPR",
          address: accountName,
          label: "WebAuth.com",
        },
      });

      setFeedback({ ok: true, message: `${response.message} Cuenta: ${accountName}.` });
      await loadConnections();
    } catch (error) {
      setFeedback({
        ok: false,
        message: isHttpClientError(error)
          ? error.message
          : error instanceof Error
            ? error.message
            : "No fue posible conectar WebAuth.com.",
      });
    } finally {
      setConnecting(false);
    }
  }

  async function disconnect(connectionId: string) {
    setDisconnectingId(connectionId);
    setFeedback(null);
    try {
      const response = await httpClient<ApiResponse<{ disconnected: boolean }>>("/api/wallet-connections", {
        auth: true,
        method: "DELETE",
        body: { connectionId },
      });
      setFeedback({ ok: true, message: response.message });
      await loadConnections();
    } catch (error) {
      setFeedback({
        ok: false,
        message: isHttpClientError(error) ? error.message : "No fue posible desconectar WebAuth.com.",
      });
    } finally {
      setDisconnectingId(null);
    }
  }

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <section style={panelStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ maxWidth: 700 }}>
            <strong style={{ display: "block", color: "var(--text)", fontSize: 16, fontWeight: 900 }}>Conectar WebAuth.com</strong>
            <p style={{ margin: "5px 0 0", color: "var(--text-soft)", fontSize: 12.5, lineHeight: 1.5 }}>
              WebAuth autentica tu identidad XPR y entrega a LEDGERA únicamente el nombre público de la cuenta. No se solicitan transferencias ni permisos de gasto.
            </p>
          </div>
          <button type="button" onClick={connectWebAuth} disabled={connecting} style={{ minHeight: 44, borderRadius: 12, border: "none", background: "var(--accent)", color: "var(--accent-contrast, #00131f)", padding: "0 16px", fontWeight: 900, cursor: connecting ? "wait" : "pointer" }}>
            {connecting ? "Abriendo WebAuth…" : "Conectar WebAuth"}
          </button>
        </div>
        <p style={{ margin: "10px 0 0", color: "var(--text-soft)", fontSize: 11.5 }}>
          La conexión se limita a identidad y lectura pública de XPR Network. LEDGERA nunca solicita tus claves privadas.
        </p>
      </section>

      {feedback && (
        <div style={{ borderRadius: 12, padding: "10px 12px", border: `1px solid ${feedback.ok ? "rgba(22,163,74,0.24)" : "rgba(239,68,68,0.24)"}`, background: feedback.ok ? "rgba(22,163,74,0.08)" : "rgba(239,68,68,0.08)", color: feedback.ok ? "var(--accent)" : "var(--loss)", fontSize: 12.5 }}>
          {feedback.message}
        </div>
      )}

      <section style={panelStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 12 }}>
          <div>
            <strong style={{ display: "block", color: "var(--text)", fontSize: 15.5, fontWeight: 900 }}>Cuentas WebAuth asociadas</strong>
            <span style={{ color: "var(--text-soft)", fontSize: 11.5 }}>Cuentas XPR autenticadas por su wallet.</span>
          </div>
          <span style={{ borderRadius: 999, padding: "4px 9px", background: "var(--bg-sunken)", color: "var(--text-soft)", fontSize: 11, fontWeight: 900 }}>{connections.length}</span>
        </div>

        {loading ? (
          <p style={{ margin: 0, color: "var(--text-soft)", fontSize: 12.5 }}>Cargando cuentas…</p>
        ) : connections.length === 0 ? (
          <p style={{ margin: 0, color: "var(--text-soft)", fontSize: 12.5 }}>Aún no hay cuentas WebAuth asociadas.</p>
        ) : (
          <div style={{ display: "grid", gap: 8 }}>
            {connections.map((connection) => (
              <div key={connection.id} style={{ border: "1px solid var(--border)", borderRadius: 12, padding: "10px 12px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                <div>
                  <strong style={{ display: "block", color: "var(--text)", fontSize: 12.5 }}>{connection.address}</strong>
                  <span style={{ color: "var(--text-soft)", fontSize: 11.5 }}>XPR Network · WebAuth.com</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <a href={connection.explorerUrl} target="_blank" rel="noreferrer" style={{ textDecoration: "none", minHeight: 34, display: "inline-flex", alignItems: "center", borderRadius: 9, border: "1px solid var(--border)", color: "var(--text)", padding: "0 11px", fontSize: 11.5, fontWeight: 900 }}>
                    Ver en XPR Explorer ↗
                  </a>
                  <button type="button" onClick={() => disconnect(connection.id)} disabled={disconnectingId === connection.id} style={{ minHeight: 34, borderRadius: 9, border: "1px solid var(--border)", background: "transparent", color: "var(--text-soft)", padding: "0 11px", fontSize: 11.5, fontWeight: 800, cursor: disconnectingId === connection.id ? "wait" : "pointer" }}>
                    {disconnectingId === connection.id ? "Desconectando…" : "Desconectar"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
