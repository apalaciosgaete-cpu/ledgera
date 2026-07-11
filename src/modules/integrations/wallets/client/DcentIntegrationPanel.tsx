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

type DcentAccount = {
  coin_group?: string;
  coin_name?: string;
  label?: string;
  address_path?: string;
};

type DcentConnector = {
  getDeviceInfo(): Promise<unknown>;
  getAccountInfo(): Promise<unknown>;
  getAddress(coinType: unknown, keyPath: string): Promise<unknown>;
  getXPUB(keyPath: string): Promise<unknown>;
  popupWindowClose?(): void;
  coinType?: Record<string, unknown>;
};

type SupportedDcentAccount = DcentAccount & {
  id: string;
  displayName: string;
  connectionNetwork: "BITCOIN_XPUB" | "ETHEREUM" | "SOLANA";
};

const panelStyle: CSSProperties = {
  border: "1px solid var(--border)",
  borderRadius: 18,
  background: "var(--bg-elev)",
  padding: 18,
  boxShadow: "var(--shadow-sm)",
  fontFamily: fonts.body,
};

function nestedParameter(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object") return {};
  const record = value as Record<string, unknown>;
  const body = record.body;
  if (!body || typeof body !== "object") return {};
  const parameter = (body as Record<string, unknown>).parameter;
  return parameter && typeof parameter === "object" ? parameter as Record<string, unknown> : {};
}

function accountList(value: unknown): DcentAccount[] {
  const parameter = nestedParameter(value);
  return Array.isArray(parameter.account) ? parameter.account as DcentAccount[] : [];
}

function deviceLabel(value: unknown): string {
  const parameter = nestedParameter(value);
  return String(parameter.label ?? "D'CENT");
}

function normalizeDcentAccounts(accounts: DcentAccount[], connector: DcentConnector): SupportedDcentAccount[] {
  return accounts.flatMap((account, index) => {
    const group = String(account.coin_group ?? "").toUpperCase();
    const coin = String(account.coin_name ?? "").toUpperCase();
    const path = String(account.address_path ?? "").trim();
    if (!path) return [];

    const base = {
      ...account,
      id: `${group}:${coin}:${path}:${index}`,
      displayName: account.label || account.coin_name || account.coin_group || `Cuenta ${index + 1}`,
    };

    if (group.includes("BITCOIN") || coin.includes("BITCOIN")) {
      return [{ ...base, connectionNetwork: "BITCOIN_XPUB" as const }];
    }

    if (group.includes("ETHEREUM") || group === "ERC20" || coin.includes("ETHEREUM") || coin === "ERC20") {
      return connector.coinType?.ETHEREUM
        ? [{ ...base, connectionNetwork: "ETHEREUM" as const }]
        : [];
    }

    if ((group.includes("SOLANA") || coin.includes("SOLANA")) && connector.coinType?.SOLANA) {
      return [{ ...base, connectionNetwork: "SOLANA" as const }];
    }

    return [];
  });
}

function publicIdentifier(response: unknown, key: "address" | "public_key"): string {
  return String(nestedParameter(response)[key] ?? "").trim();
}

function shortIdentifier(value: string): string {
  if (value.length <= 30) return value;
  return `${value.slice(0, 14)}…${value.slice(-12)}`;
}

async function loadConnector(): Promise<DcentConnector> {
  const module = await import("dcent-web-connector");
  return ((module as unknown as { default?: DcentConnector }).default ?? module) as unknown as DcentConnector;
}

export function DcentIntegrationPanel() {
  const [deviceName, setDeviceName] = useState<string | null>(null);
  const [accounts, setAccounts] = useState<SupportedDcentAccount[]>([]);
  const [connections, setConnections] = useState<WalletConnection[]>([]);
  const [loadingConnections, setLoadingConnections] = useState(true);
  const [detecting, setDetecting] = useState(false);
  const [associatingId, setAssociatingId] = useState<string | null>(null);
  const [disconnectingId, setDisconnectingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ ok: boolean; message: string } | null>(null);

  const loadConnections = useCallback(async () => {
    setLoadingConnections(true);
    try {
      const response = await httpClient<ApiResponse<WalletConnection[]>>("/api/wallet-connections", { auth: true });
      setConnections(response.data.filter((connection) => connection.label?.startsWith("D'CENT")));
    } catch {
      setConnections([]);
    } finally {
      setLoadingConnections(false);
    }
  }, []);

  useEffect(() => {
    void loadConnections();
  }, [loadConnections]);

  async function detectDevice() {
    setDetecting(true);
    setFeedback(null);
    setAccounts([]);

    try {
      const connector = await loadConnector();
      const [deviceInfo, accountInfo] = await Promise.all([
        connector.getDeviceInfo(),
        connector.getAccountInfo(),
      ]);
      const supported = normalizeDcentAccounts(accountList(accountInfo), connector);
      setDeviceName(deviceLabel(deviceInfo));
      setAccounts(supported);
      setFeedback({
        ok: true,
        message: supported.length > 0
          ? `${supported.length} cuenta${supported.length === 1 ? "" : "s"} pública${supported.length === 1 ? "" : "s"} compatible${supported.length === 1 ? "" : "s"} encontrada${supported.length === 1 ? "" : "s"}.`
          : "El dispositivo respondió, pero no contiene cuentas Bitcoin, Ethereum o Solana compatibles.",
      });
      connector.popupWindowClose?.();
    } catch (error) {
      setDeviceName(null);
      setFeedback({
        ok: false,
        message: error instanceof Error
          ? error.message
          : "No fue posible detectar D'CENT. Verifica D'CENT Bridge y la conexión USB.",
      });
    } finally {
      setDetecting(false);
    }
  }

  async function associate(account: SupportedDcentAccount) {
    const path = String(account.address_path ?? "").trim();
    if (!path) return;

    setAssociatingId(account.id);
    setFeedback(null);

    try {
      const connector = await loadConnector();
      let identifier = "";

      if (account.connectionNetwork === "BITCOIN_XPUB") {
        identifier = publicIdentifier(await connector.getXPUB(path), "public_key");
      } else {
        const coinType = connector.coinType?.[account.connectionNetwork];
        if (!coinType) throw new Error(`D'CENT no expone el tipo ${account.connectionNetwork} en este navegador.`);
        identifier = publicIdentifier(await connector.getAddress(coinType, path), "address");
      }

      if (!identifier) throw new Error("D'CENT no devolvió un identificador público.");

      const response = await httpClient<ApiResponse<WalletConnection>>("/api/wallet-connections", {
        auth: true,
        method: "POST",
        body: {
          network: account.connectionNetwork,
          address: identifier,
          label: `D'CENT · ${account.displayName}`,
        },
      });

      setFeedback({ ok: true, message: response.message });
      connector.popupWindowClose?.();
      await loadConnections();
    } catch (error) {
      setFeedback({
        ok: false,
        message: isHttpClientError(error)
          ? error.message
          : error instanceof Error
            ? error.message
            : "No fue posible asociar la cuenta D'CENT.",
      });
    } finally {
      setAssociatingId(null);
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
        message: isHttpClientError(error) ? error.message : "No fue posible desconectar D'CENT.",
      });
    } finally {
      setDisconnectingId(null);
    }
  }

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <section style={panelStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ maxWidth: 720 }}>
            <strong style={{ display: "block", color: "var(--text)", fontSize: 16, fontWeight: 900 }}>Detectar D'CENT por USB</strong>
            <p style={{ margin: "5px 0 0", color: "var(--text-soft)", fontSize: 12.5, lineHeight: 1.5 }}>
              Conecta el dispositivo mediante D'CENT Bridge. LEDGERA leerá únicamente cuentas públicas compatibles y solicitará cada dirección o XPUB de forma individual.
            </p>
          </div>
          <button type="button" onClick={detectDevice} disabled={detecting} style={{ minHeight: 44, borderRadius: 12, border: "none", background: "var(--accent)", color: "var(--accent-contrast, #00131f)", padding: "0 16px", fontWeight: 900, cursor: detecting ? "wait" : "pointer" }}>
            {detecting ? "Detectando…" : "Detectar D'CENT"}
          </button>
        </div>
        <div style={{ marginTop: 10, display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", color: "var(--text-soft)", fontSize: 11.5 }}>
          <span>Requiere D'CENT Bridge y conexión USB.</span>
          <a href="https://bridge.dcentwallet.com/v2/download" target="_blank" rel="noreferrer" style={{ color: "var(--accent)", fontWeight: 900, textDecoration: "none" }}>Descargar Bridge ↗</a>
          {deviceName && <span>Dispositivo: {deviceName}</span>}
        </div>
      </section>

      {feedback && (
        <div style={{ borderRadius: 12, padding: "10px 12px", border: `1px solid ${feedback.ok ? "rgba(22,163,74,0.24)" : "rgba(239,68,68,0.24)"}`, background: feedback.ok ? "rgba(22,163,74,0.08)" : "rgba(239,68,68,0.08)", color: feedback.ok ? "var(--accent)" : "var(--loss)", fontSize: 12.5 }}>
          {feedback.message}
        </div>
      )}

      {accounts.length > 0 && (
        <section style={panelStyle}>
          <strong style={{ display: "block", color: "var(--text)", fontSize: 15.5, fontWeight: 900, marginBottom: 4 }}>Cuentas detectadas</strong>
          <p style={{ margin: "0 0 12px", color: "var(--text-soft)", fontSize: 11.5 }}>Selecciona únicamente las cuentas que deseas asociar a LEDGERA.</p>
          <div style={{ display: "grid", gap: 8 }}>
            {accounts.map((account) => (
              <div key={account.id} style={{ border: "1px solid var(--border)", borderRadius: 12, padding: "10px 12px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                <div>
                  <strong style={{ display: "block", color: "var(--text)", fontSize: 12.5 }}>{account.displayName}</strong>
                  <span style={{ color: "var(--text-soft)", fontSize: 11.5 }}>{account.connectionNetwork === "BITCOIN_XPUB" ? "Bitcoin · XPUB" : account.connectionNetwork} · {account.address_path}</span>
                </div>
                <button type="button" onClick={() => associate(account)} disabled={associatingId === account.id} style={{ minHeight: 36, borderRadius: 10, border: "1px solid var(--border-strong)", background: "var(--bg-elev)", color: "var(--text)", padding: "0 13px", fontSize: 11.5, fontWeight: 900, cursor: associatingId === account.id ? "wait" : "pointer" }}>
                  {associatingId === account.id ? "Leyendo dispositivo…" : "Obtener y asociar"}
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      <section style={panelStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 12 }}>
          <div>
            <strong style={{ display: "block", color: "var(--text)", fontSize: 15.5, fontWeight: 900 }}>Cuentas D'CENT asociadas</strong>
            <span style={{ color: "var(--text-soft)", fontSize: 11.5 }}>Solo se conserva la dirección pública o XPUB.</span>
          </div>
          <span style={{ borderRadius: 999, padding: "4px 9px", background: "var(--bg-sunken)", color: "var(--text-soft)", fontSize: 11, fontWeight: 900 }}>{connections.length}</span>
        </div>

        {loadingConnections ? (
          <p style={{ margin: 0, color: "var(--text-soft)", fontSize: 12.5 }}>Cargando cuentas…</p>
        ) : connections.length === 0 ? (
          <p style={{ margin: 0, color: "var(--text-soft)", fontSize: 12.5 }}>Aún no hay cuentas D'CENT asociadas.</p>
        ) : (
          <div style={{ display: "grid", gap: 8 }}>
            {connections.map((connection) => (
              <div key={connection.id} style={{ border: "1px solid var(--border)", borderRadius: 12, padding: "10px 12px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                <div style={{ minWidth: 0 }}>
                  <strong style={{ display: "block", color: "var(--text)", fontSize: 12.5 }}>{connection.label}</strong>
                  <span title={connection.address} style={{ color: "var(--text-soft)", fontSize: 11.5, fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}>{shortIdentifier(connection.address)}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <a href={connection.explorerUrl} target="_blank" rel="noreferrer" style={{ textDecoration: "none", minHeight: 34, display: "inline-flex", alignItems: "center", borderRadius: 9, border: "1px solid var(--border)", color: "var(--text)", padding: "0 11px", fontSize: 11.5, fontWeight: 900 }}>Ver información pública ↗</a>
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
