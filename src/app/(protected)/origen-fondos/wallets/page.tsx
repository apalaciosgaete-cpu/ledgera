"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { WALLETS } from "@/modules/crypto/catalogs/sourceFundsCatalogs";
import { httpClient } from "@/shared/http/httpClient";
import { fonts } from "@/styles/tokens";

type ApiResponse<T> = { ok: boolean; message: string; data: T };

type WalletConnection = {
  id: string;
  network: string;
  address: string;
  label: string | null;
};

type WalletMeta = {
  description: string;
  capability: string;
  action: string;
};

const WALLET_META: Record<string, WalletMeta> = {
  dcent: {
    description: "Detecta el dispositivo mediante D'CENT Bridge y obtiene cuentas públicas compatibles.",
    capability: "USB · Direcciones y XPUB",
    action: "Conectar D'CENT →",
  },
  webauth: {
    description: "Autentica una cuenta XPR mediante WebAuth.com sin exponer claves privadas.",
    capability: "WebAuth · Identidad y cuenta pública",
    action: "Conectar WebAuth →",
  },
  bitcoin: {
    description: "Asocia una dirección pública o XPUB de cualquier wallet compatible con Bitcoin.",
    capability: "Bitcoin · Dirección o XPUB",
    action: "Asociar cuenta →",
  },
  ethereum: {
    description: "Asocia una dirección pública de Ethereum para consulta en modo de solo lectura.",
    capability: "Ethereum · Dirección pública",
    action: "Asociar cuenta →",
  },
  solana: {
    description: "Asocia una cuenta pública de Solana sin entregar permisos de firma o transferencia.",
    capability: "Solana · Dirección pública",
    action: "Asociar cuenta →",
  },
  xpr: {
    description: "Asocia un nombre de cuenta XPR y valida su existencia directamente en la red.",
    capability: "XPR Network · Cuenta pública",
    action: "Asociar cuenta XPR →",
  },
};

function connectionMatches(walletId: string, connection: WalletConnection): boolean {
  if (walletId === "dcent") return connection.label?.startsWith("D'CENT") === true;
  if (walletId === "webauth") return connection.network === "XPR" && connection.label === "WebAuth.com";
  if (walletId === "bitcoin") return connection.network === "BITCOIN" || connection.network === "BITCOIN_XPUB";
  if (walletId === "ethereum") return connection.network === "ETHEREUM";
  if (walletId === "solana") return connection.network === "SOLANA";
  if (walletId === "xpr") return connection.network === "XPR";
  return false;
}

export default function WalletsSourceFundsPage() {
  const router = useRouter();
  const [connections, setConnections] = useState<WalletConnection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    httpClient<ApiResponse<WalletConnection[]>>("/api/wallet-connections", { auth: true })
      .then((response) => {
        if (!cancelled) setConnections(response.data);
      })
      .catch(() => {
        if (!cancelled) setConnections([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const connectionCounts = useMemo(
    () =>
      Object.fromEntries(
        WALLETS.map((wallet) => [
          wallet.id,
          connections.filter((connection) => connectionMatches(wallet.id, connection)).length,
        ]),
      ) as Record<string, number>,
    [connections],
  );

  return (
    <main style={{ minHeight: "calc(100vh - 100px)", paddingBottom: 72, fontFamily: fonts.body }}>
      <div style={{ width: "100%", maxWidth: 1160, margin: "0 auto", display: "grid", gap: 24 }}>
        <header style={{ display: "grid", gap: 8 }}>
          <button
            type="button"
            onClick={() => router.push("/origen-fondos")}
            style={{ width: "fit-content", display: "flex", alignItems: "center", gap: 6, background: "transparent", border: "none", cursor: "pointer", color: "var(--text-soft)", fontSize: 13, fontFamily: fonts.body, padding: 0 }}
          >
            ← Volver a Origen de Fondos
          </button>

          <div style={{ display: "grid", gap: 6 }}>
            <h1 style={{ color: "var(--text)", fontSize: "clamp(1.65rem,3vw,2.25rem)", fontWeight: 900, margin: 0, letterSpacing: "-0.045em", fontFamily: fonts.display }}>
              Wallets
            </h1>
            <p style={{ color: "var(--text-soft)", fontSize: 14, lineHeight: 1.55, margin: 0, maxWidth: 780 }}>
              Conecta una wallet compatible o asocia cuentas públicas para consultar y respaldar movimientos en modo de solo lectura.
            </p>
          </div>
        </header>

        <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,210px),1fr))", gap: 14, alignItems: "stretch" }}>
          {WALLETS.map((wallet) => {
            const meta = WALLET_META[wallet.id];
            const count = connectionCounts[wallet.id] ?? 0;
            const connected = count > 0;

            return (
              <button
                key={wallet.id}
                type="button"
                onClick={() => router.push(`/origen-fondos/wallets/${wallet.id}`)}
                style={{
                  minHeight: 214,
                  borderRadius: 22,
                  border: "1px solid var(--border-strong)",
                  background: "var(--bg-elev)",
                  color: "var(--text)",
                  cursor: "pointer",
                  display: "grid",
                  gridTemplateRows: "auto 1fr auto",
                  gap: 14,
                  padding: 18,
                  textAlign: "left",
                  boxShadow: "var(--shadow-sm)",
                  fontFamily: fonts.body,
                }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                  <strong style={{ minWidth: 0, color: "var(--text)", fontFamily: fonts.display, fontSize: wallet.id === "webauth" ? 17 : 19, lineHeight: 1.15, fontWeight: 900, letterSpacing: "-.035em", whiteSpace: "nowrap" }}>
                    {wallet.name}
                  </strong>
                  <span style={{ flex: "0 0 auto", borderRadius: 999, border: "1px solid var(--border)", background: "var(--bg-sunken)", color: connected ? "var(--accent)" : "var(--text-soft)", padding: "6px 9px", fontSize: 9.5, fontWeight: 900, textTransform: "uppercase", letterSpacing: ".04em", textAlign: "center", lineHeight: 1.2 }}>
                    {loading ? "Verificando…" : connected ? "Conectado" : "Disponible"}
                  </span>
                </div>

                <div style={{ display: "grid", alignContent: "start", gap: 8 }}>
                  <p style={{ color: "var(--text-soft)", fontSize: 12.25, lineHeight: 1.48, margin: 0 }}>{meta.description}</p>
                  <span style={{ color: "var(--text)", fontSize: 11.25, fontWeight: 800 }}>{meta.capability}</span>
                </div>

                <span style={{ color: "var(--accent)", fontSize: 12.25, fontWeight: 900 }}>
                  {connected ? `Administrar ${count === 1 ? "cuenta" : "cuentas"} →` : meta.action}
                </span>
              </button>
            );
          })}
        </section>
      </div>
    </main>
  );
}
