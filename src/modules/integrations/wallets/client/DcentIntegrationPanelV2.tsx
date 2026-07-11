"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";

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
  info(): Promise<unknown>;
  getDeviceInfo(): Promise<unknown>;
  getAccountInfo(): Promise<unknown>;
  getAddress(coinType: unknown, keyPath: string): Promise<unknown>;
  getXPUB(keyPath: string): Promise<unknown>;
  setTimeOutMs?(milliseconds: number): void | Promise<void>;
  setConnectionListener?(listener: (state: unknown) => void): void;
  popupWindowClose?(): void;
  state?: Record<string, unknown>;
  coinType?: Record<string, unknown>;
};

type SupportedDcentAccount = DcentAccount & {
  id: string;
  displayName: string;
  connectionNetwork: "BITCOIN_XPUB" | "ETHEREUM" | "SOLANA";
};

type Feedback = { ok: boolean; message: string };
type SdkStatus = "loading" | "ready" | "error";

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
  const body = (value as Record<string, unknown>).body;
  if (!body || typeof body !== "object") return {};
  const parameter = (body as Record<string, unknown>).parameter;
  return parameter && typeof parameter === "object" ? (parameter as Record<string, unknown>) : {};
}

function accountList(value: unknown): DcentAccount[] {
  const account = nestedParameter(value).account;
  return Array.isArray(account) ? (account as DcentAccount[]) : [];
}

function deviceLabel(value: unknown): string {
  return String(nestedParameter(value).label ?? "D'CENT");
}

function isUsbAttached(value: unknown): boolean {
  const attached = nestedParameter(value).isUsbAttached;
  return attached === true || attached === "true";
}

function normalizeDcentAccounts(accounts: DcentAccount[], connector: DcentConnector): SupportedDcentAccount[] {
  const supported: SupportedDcentAccount[] = [];

  accounts.forEach((account, index) => {
    const group = String(account.coin_group ?? "").toUpperCase();
    const coin = String(account.coin_name ?? "").toUpperCase();
    const path = String(account.address_path ?? "").trim();
    if (!path) return;

    const base = {
      ...account,
      id: `${group}:${coin}:${path}:${index}`,
      displayName: account.label || account.coin_name || account.coin_group || `Cuenta ${index + 1}`,
    };

    if (group.includes("BITCOIN") || coin.includes("BITCOIN")) {
      supported.push({ ...base, connectionNetwork: "BITCOIN_XPUB" });
      return;
    }

    if (
      (group.includes("ETHEREUM") || group === "ERC20" || coin.includes("ETHEREUM") || coin === "ERC20") &&
      connector.coinType?.ETHEREUM
    ) {
      supported.push({ ...base, connectionNetwork: "ETHEREUM" });
      return;
    }

    if ((group.includes("SOLANA") || coin.includes("SOLANA")) && connector.coinType?.SOLANA) {
      supported.push({ ...base, connectionNetwork: "SOLANA" });
    }
  });

  return supported;
}

function publicIdentifier(response: unknown, key: "address" | "public_key"): string {
  return String(nestedParameter(response)[key] ?? "").trim();
}

function shortIdentifier(value: string): string {
  if (value.length <= 30) return value;
  return `${value.slice(0, 14)}…${value.slice(-12)}`;
}

function dcentErrorDetails(error: unknown): { code: string; message: string } {
  if (error && typeof error === "object") {
    const record = error as Record<string, unknown>;
    const body = record.body;
    const nestedError = body && typeof body === "object" ? (body as Record<string, unknown>).error : undefined;
    if (nestedError && typeof nestedError === "object") {
      const failure = nestedError as Record<string, unknown>;
      return {
        code: String(failure.code ?? "unknown"),
        message: String(failure.message ?? "D'CENT Bridge rechazó la solicitud."),
      };
    }

    if (typeof record.code === "string" || typeof record.message === "string") {
      return {
        code: String(record.code ?? "unknown"),
        message: String(record.message ?? "D'CENT Bridge rechazó la solicitud."),
      };
    }
  }

  if (error instanceof Error) return { code: "unknown", message: error.message };
  return { code: "unknown", message: "No fue posible comunicarse con D'CENT Bridge." };
}

function dcentErrorMessage(error: unknown): string {
  const { code, message } = dcentErrorDetails(error);
  const normalized = `${code} ${message}`.toLowerCase();

  if (normalized.includes("popup") || normalized.includes("window.open") || normalized.includes("unauthorized")) {
    return "El navegador bloqueó la ventana de D'CENT Bridge. Permite ventanas emergentes para ledgera.cl y vuelve a intentarlo.";
  }
  if (normalized.includes("no_device")) {
    return "D'CENT Bridge está disponible, pero no detecta el dispositivo. Desbloquéalo y conéctalo con un cable USB de datos.";
  }
  if (normalized.includes("connection_failed")) {
    return "D'CENT Bridge abrió correctamente, pero no pudo comunicarse con el dispositivo. Reinicia el Bridge, reconecta el USB y vuelve a intentarlo.";
  }
  if (normalized.includes("time_out") || normalized.includes("timed out")) {
    return "La conexión con D'CENT agotó el tiempo de espera. Mantén abierta la ventana del Bridge y confirma cualquier solicitud en el dispositivo.";
  }
  if (normalized.includes("pop-up_closed")) {
    return "La ventana de D'CENT Bridge se cerró antes de completar la conexión.";
  }
  if (normalized.includes("user_cancel")) {
    return "La solicitud fue cancelada desde el dispositivo D'CENT.";
  }

  return message;
}

async function importConnector(): Promise<DcentConnector> {
  const module = await import("dcent-web-connector");
  return ((module as unknown as { default?: DcentConnector }).default ?? module) as unknown as DcentConnector;
}

export function DcentIntegrationPanel() {
  const connectorRef = useRef<DcentConnector | null>(null);
  const [sdkStatus, setSdkStatus] = useState<SdkStatus>("loading");
  const [bridgeState, setBridgeState] = useState("Preparando conector…");
  const [deviceName, setDeviceName] = useState<string | null>(null);
  const [accounts, setAccounts] = useState<SupportedDcentAccount[]>([]);
  const [connections, setConnections] = useState<WalletConnection[]>([]);
  const [loadingConnections, setLoadingConnections] = useState(true);
  const [detecting, setDetecting] = useState(false);
  const [associatingId, setAssociatingId] = useState<string | null>(null);
  const [disconnectingId, setDisconnectingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);

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
    let cancelled = false;

    void importConnector()
      .then((connector) => {
        if (cancelled) return;
        connectorRef.current = connector;
        try {
          connector.setTimeOutMs?.(90_000);
          connector.setConnectionListener?.((state) => {
            if (!cancelled) setBridgeState(String(state).toLowerCase().includes("disconnect") ? "Dispositivo desconectado" : "Bridge conectado");
          });
        } catch {
          // La detección explícita informará cualquier problema de Bridge.
        }
        setSdkStatus("ready");
        setBridgeState("Conector listo");
      })
      .catch(() => {
        if (!cancelled) {
          setSdkStatus("error");
          setBridgeState("No se pudo cargar el conector");
        }
      });

    void loadConnections();

    return () => {
      cancelled = true;
      connectorRef.current?.popupWindowClose?.();
    };
  }, [loadConnections]);

  async function detectDevice() {
    const connector = connectorRef.current;
    if (!connector) {
      setFeedback({ ok: false, message: "El conector D'CENT todavía no está listo. Recarga la pantalla e inténtalo nuevamente." });
      return;
    }

    setDetecting(true);
    setFeedback(null);
    setAccounts([]);
    setBridgeState("Abriendo D'CENT Bridge…");

    // Debe ejecutarse antes de cualquier await para conservar el gesto del usuario y permitir el popup.
    const bridgeRequest = connector.info();

    try {
      const bridgeInfo = await bridgeRequest;
      if (!isUsbAttached(bridgeInfo)) {
        throw { body: { error: { code: "no_device", message: "D'CENT Biometric Wallet is not connected" } } };
      }

      setBridgeState("Dispositivo detectado");
      const deviceInfo = await connector.getDeviceInfo();
      const accountInfo = await connector.getAccountInfo();
      const supportedAccounts = normalizeDcentAccounts(accountList(accountInfo), connector);

      setDeviceName(deviceLabel(deviceInfo));
      setAccounts(supportedAccounts);
      setFeedback({
        ok: true,
        message: supportedAccounts.length > 0
          ? `${supportedAccounts.length} cuenta${supportedAccounts.length === 1 ? "" : "s"} pública${supportedAccounts.length === 1 ? "" : "s"} compatible${supportedAccounts.length === 1 ? "" : "s"} encontrada${supportedAccounts.length === 1 ? "" : "s"}.`
          : "El dispositivo se conectó, pero no contiene cuentas Bitcoin, Ethereum o Solana compatibles.",
      });
    } catch (error) {
      setDeviceName(null);
      setBridgeState("Conexión pendiente");
      setFeedback({ ok: false, message: dcentErrorMessage(error) });
    } finally {
      connector.popupWindowClose?.();
      setDetecting(false);
    }
  }

  async function associate(account: SupportedDcentAccount) {
    const connector = connectorRef.current;
    const path = String(account.address_path ?? "").trim();
    if (!connector || !path) return;

    setAssociatingId(account.id);
    setFeedback(null);

    try {
      const request = account.connectionNetwork === "BITCOIN_XPUB"
        ? connector.getXPUB(path)
        : connector.getAddress(connector.coinType?.[account.connectionNetwork], path);
      const result = await request;
      const identifier = publicIdentifier(result, account.connectionNetwork === "BITCOIN_XPUB" ? "public_key" : "address");
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
      await loadConnections();
    } catch (error) {
      setFeedback({
        ok: false,
        message: isHttpClientError(error) ? error.message : dcentErrorMessage(error),
      });
    } finally {
      connector.popupWindowClose?.();
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
      setFeedback({ ok: false, message: isHttpClientError(error) ? error.message : "No fue posible desconectar D'CENT." });
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
              Mantén D'CENT Bridge abierto, conecta el dispositivo con un cable USB de datos y desbloquéalo antes de iniciar.
            </p>
          </div>
          <button type="button" onClick={detectDevice} disabled={detecting || sdkStatus !== "ready"} style={{ minHeight: 44, borderRadius: 12, border: "none", background: "var(--accent)", color: "var(--accent-contrast, #00131f)", padding: "0 16px", fontWeight: 900, cursor: detecting ? "wait" : sdkStatus === "ready" ? "pointer" : "not-allowed", opacity: sdkStatus === "ready" ? 1 : 0.62 }}>
            {detecting ? "Detectando…" : sdkStatus === "loading" ? "Cargando conector…" : "Detectar D'CENT"}
          </button>
        </div>
        <div style={{ marginTop: 10, display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", color: "var(--text-soft)", fontSize: 11.5 }}>
          <span>Estado: {bridgeState}</span>
          <span>Permite ventanas emergentes para ledgera.cl.</span>
          <a href="https://bridge.dcentwallet.com/download" target="_blank" rel="noreferrer" style={{ color: "var(--accent)", fontWeight: 900, textDecoration: "none" }}>Descargar Bridge ↗</a>
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
          <p style={{ margin: "0 0 12px", color: "var(--text-soft)", fontSize: 11.5 }}>Selecciona las cuentas públicas que deseas asociar a LEDGERA.</p>
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
