"use client";

import { useCallback, useEffect, useMemo, useState, type CSSProperties, type FormEvent } from "react";

import { httpClient, isHttpClientError } from "@/shared/http/httpClient";
import { fonts } from "@/styles/tokens";

type ApiResponse<T> = { ok: boolean; message: string; data: T };

type WalletNetwork = "BITCOIN" | "BITCOIN_XPUB" | "ETHEREUM" | "SOLANA" | "XPR";

type WalletConnection = {
  id: string;
  network: WalletNetwork;
  address: string;
  label: string | null;
  status: string;
  lastSyncAt: string | null;
  updatedAt: string;
  explorerUrl: string;
};

type Props = {
  network: Exclude<WalletNetwork, "BITCOIN_XPUB">;
  title: string;
  description: string;
  inputLabel: string;
  placeholder: string;
  connectionLabel: string;
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
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
  boxSizing: "border-box",
};

function shortIdentifier(value: string): string {
  if (value.length <= 28) return value;
  return `${value.slice(0, 13)}…${value.slice(-11)}`;
}

function networkName(network: WalletNetwork): string {
  if (network === "BITCOIN_XPUB") return "Bitcoin · XPUB";
  if (network === "XPR") return "XPR Network";
  return network.charAt(0) + network.slice(1).toLowerCase();
}

export function PublicWalletConnectionPanel({
  network,
  title,
  description,
  inputLabel,
  placeholder,
  connectionLabel,
}: Props) {
  const [identifier, setIdentifier] = useState("");
  const [connections, setConnections] = useState<WalletConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [disconnectingId, setDisconnectingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ ok: boolean; message: string } | null>(null);

  const loadConnections = useCallback(async () => {
    setLoading(true);
    try {
      const response = await httpClient<ApiResponse<WalletConnection[]>>("/api/wallet-connections", { auth: true });
      setConnections(response.data);
    } catch {
      setConnections([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadConnections();
  }, [loadConnections]);

  const matchingConnections = useMemo(
    () =>
      connections.filter((connection) =>
        network === "BITCOIN"
          ? connection.network === "BITCOIN" || connection.network === "BITCOIN_XPUB"
          : connection.network === network,
      ),
    [connections, network],
  );

  async function associate(event: FormEvent) {
    event.preventDefault();
    if (!identifier.trim()) return;

    setSaving(true);
    setFeedback(null);
    try {
      const response = await httpClient<ApiResponse<WalletConnection>>("/api/wallet-connections", {
        auth: true,
        method: "POST",
        body: {
          network,
          address: identifier.trim(),
          label: connectionLabel,
        },
      });
      setIdentifier("");
      setFeedback({ ok: true, message: response.message });
      await loadConnections();
    } catch (error) {
      setFeedback({
        ok: false,
        message: isHttpClientError(error) ? error.message : "No fue posible asociar la cuenta pública.",
      });
    } finally {
      setSaving(false);
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
        message: isHttpClientError(error) ? error.message : "No fue posible desconectar la cuenta.",
      });
    } finally {
      setDisconnectingId(null);
    }
  }

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <section style={panelStyle}>
        <strong style={{ display: "block", color: "var(--text)", fontSize: 16, fontWeight: 900 }}>{title}</strong>
        <p style={{ margin: "5px 0 14px", color: "var(--text-soft)", fontSize: 12.5, lineHeight: 1.5 }}>{description}</p>

        <form onSubmit={associate} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,280px),1fr))", gap: 10, alignItems: "end" }}>
          <label style={{ display: "grid", gap: 5, color: "var(--text-soft)", fontSize: 11.5 }}>
            {inputLabel}
            <input
              value={identifier}
              onChange={(event) => setIdentifier(event.target.value)}
              placeholder={placeholder}
              autoComplete="off"
              spellCheck={false}
              style={fieldStyle}
            />
          </label>
          <button
            type="submit"
            disabled={saving || !identifier.trim()}
            style={{ minHeight: 44, borderRadius: 12, border: "none", background: "var(--accent)", color: "var(--accent-contrast, #00131f)", padding: "0 16px", fontWeight: 900, cursor: saving ? "wait" : "pointer", opacity: identifier.trim() ? 1 : 0.5 }}
          >
            {saving ? "Validando…" : "Asociar cuenta pública"}
          </button>
        </form>

        <p style={{ margin: "10px 0 0", color: "var(--text-soft)", fontSize: 11.5 }}>
          LEDGERA solo almacena información pública. Nunca ingreses una frase semilla, PIN o llave privada.
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
            <strong style={{ display: "block", color: "var(--text)", fontSize: 15.5, fontWeight: 900 }}>Cuentas asociadas</strong>
            <span style={{ color: "var(--text-soft)", fontSize: 11.5 }}>Identificadores públicos activos para esta red.</span>
          </div>
          <span style={{ borderRadius: 999, padding: "4px 9px", background: "var(--bg-sunken)", color: "var(--text-soft)", fontSize: 11, fontWeight: 900 }}>{matchingConnections.length}</span>
        </div>

        {loading ? (
          <p style={{ margin: 0, color: "var(--text-soft)", fontSize: 12.5 }}>Cargando cuentas…</p>
        ) : matchingConnections.length === 0 ? (
          <p style={{ margin: 0, color: "var(--text-soft)", fontSize: 12.5 }}>Aún no hay cuentas públicas asociadas.</p>
        ) : (
          <div style={{ display: "grid", gap: 8 }}>
            {matchingConnections.map((connection) => (
              <div key={connection.id} style={{ border: "1px solid var(--border)", borderRadius: 12, padding: "10px 12px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                <div style={{ minWidth: 0 }}>
                  <strong style={{ display: "block", color: "var(--text)", fontSize: 12.5 }}>{networkName(connection.network)}</strong>
                  <span title={connection.address} style={{ color: "var(--text-soft)", fontSize: 11.5, fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}>{shortIdentifier(connection.address)}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <a href={connection.explorerUrl} target="_blank" rel="noreferrer" style={{ textDecoration: "none", minHeight: 34, display: "inline-flex", alignItems: "center", borderRadius: 9, border: "1px solid var(--border)", color: "var(--text)", padding: "0 11px", fontSize: 11.5, fontWeight: 900 }}>
                    Ver información pública ↗
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
