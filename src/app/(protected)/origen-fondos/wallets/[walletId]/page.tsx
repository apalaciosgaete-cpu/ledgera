"use client";

import { notFound, useParams, useRouter } from "next/navigation";

import { findWalletById } from "@/modules/crypto/catalogs/sourceFundsCatalogs";
import { DcentIntegrationPanel } from "@/modules/integrations/wallets/client/DcentIntegrationPanel";
import { PublicWalletConnectionPanel } from "@/modules/integrations/wallets/client/PublicWalletConnectionPanel";
import { WebAuthXprIntegrationPanel } from "@/modules/integrations/wallets/client/WebAuthXprIntegrationPanel";
import { fonts } from "@/styles/tokens";

type PublicWalletConfig = {
  network: "BITCOIN" | "ETHEREUM" | "SOLANA" | "XPR";
  title: string;
  description: string;
  inputLabel: string;
  placeholder: string;
  connectionLabel: string;
};

const PUBLIC_WALLET_CONFIGS: Record<string, PublicWalletConfig> = {
  bitcoin: {
    network: "BITCOIN",
    title: "Asociar cuenta Bitcoin",
    description: "Ingresa una dirección pública o una clave pública extendida XPUB. La XPUB permite representar una cuenta HD sin capacidad de firmar ni mover fondos.",
    inputLabel: "Dirección pública o XPUB",
    placeholder: "bc1… / 1… / 3… / xpub… / ypub… / zpub…",
    connectionLabel: "Bitcoin · Cuenta pública",
  },
  ethereum: {
    network: "ETHEREUM",
    title: "Asociar cuenta Ethereum",
    description: "Ingresa una dirección pública de Ethereum. LEDGERA no solicitará firma, aprobación de contratos ni acceso a la wallet.",
    inputLabel: "Dirección pública",
    placeholder: "0x…",
    connectionLabel: "Ethereum · Cuenta pública",
  },
  solana: {
    network: "SOLANA",
    title: "Asociar cuenta Solana",
    description: "Ingresa la clave pública de la cuenta Solana. La asociación es exclusivamente de lectura.",
    inputLabel: "Dirección pública",
    placeholder: "Dirección Solana",
    connectionLabel: "Solana · Cuenta pública",
  },
  xpr: {
    network: "XPR",
    title: "Asociar cuenta XPR Network",
    description: "Ingresa el nombre público de la cuenta. LEDGERA verificará su existencia directamente en XPR Network antes de asociarla.",
    inputLabel: "Nombre de cuenta XPR",
    placeholder: "micuenta",
    connectionLabel: "XPR Network · Cuenta pública",
  },
};

function pageCopy(walletId: string, walletName: string) {
  if (walletId === "dcent") {
    return {
      title: "Conectar D'CENT",
      description: "Conexión directa de solo lectura mediante D'CENT Bridge para recuperar cuentas públicas compatibles.",
    };
  }

  if (walletId === "webauth") {
    return {
      title: "Conectar WebAuth.com",
      description: "Autenticación de identidad para asociar una cuenta pública de XPR Network sin permisos de gasto.",
    };
  }

  return {
    title: `Asociar ${walletName}`,
    description: "Asocia información pública de la cuenta para consulta y respaldo en modo de solo lectura.",
  };
}

export default function WalletDetailPage() {
  const router = useRouter();
  const params = useParams<{ walletId: string }>();
  const wallet = findWalletById(params.walletId);

  if (!wallet) notFound();

  const copy = pageCopy(wallet.id, wallet.name);
  const publicConfig = PUBLIC_WALLET_CONFIGS[wallet.id];

  return (
    <main style={{ minHeight: "calc(100vh - 100px)", paddingBottom: 72, fontFamily: fonts.body }}>
      <div style={{ width: "100%", maxWidth: 1160, margin: "0 auto", display: "grid", gap: 22 }}>
        <header style={{ display: "grid", gap: 12 }}>
          <button
            type="button"
            onClick={() => router.push("/origen-fondos/wallets")}
            style={{ width: "fit-content", background: "transparent", border: "none", cursor: "pointer", color: "var(--text-soft)", fontSize: 13, fontFamily: fonts.body, padding: 0 }}
          >
            ← Volver a Wallets
          </button>

          <div style={{ display: "grid", gap: 4 }}>
            <h1 style={{ color: "var(--text)", fontSize: "clamp(1.65rem,3vw,2.25rem)", fontWeight: 900, margin: 0, letterSpacing: "-0.045em", fontFamily: fonts.display }}>
              {copy.title}
            </h1>
            <p style={{ margin: 0, color: "var(--text-soft)", fontSize: 13.5, lineHeight: 1.5, maxWidth: 820 }}>
              {copy.description}
            </p>
          </div>
        </header>

        {wallet.id === "dcent" && <DcentIntegrationPanel />}
        {wallet.id === "webauth" && <WebAuthXprIntegrationPanel />}
        {publicConfig && (
          <PublicWalletConnectionPanel
            network={publicConfig.network}
            title={publicConfig.title}
            description={publicConfig.description}
            inputLabel={publicConfig.inputLabel}
            placeholder={publicConfig.placeholder}
            connectionLabel={publicConfig.connectionLabel}
          />
        )}
      </div>
    </main>
  );
}
