"use client";

import { useState } from "react";
import { colors, fonts } from "@/styles/tokens";

type Tab = "exchange" | "banco" | "wallets";

const TABS: { key: Tab; label: string }[] = [
  { key: "exchange", label: "Exchange" },
  { key: "banco",    label: "Banco"    },
  { key: "wallets",  label: "Wallets"  },
];

export default function IntegracionesPage() {
  const [tab, setTab] = useState<Tab>("exchange");

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: "24px" }}>
        <h1 style={{ fontFamily: fonts.display, fontSize: "20px", fontWeight: 700, color: colors.textPrimary, margin: "0 0 4px" }}>
          Integraciones
        </h1>
        <p style={{ fontSize: "13px", color: colors.textSecondary, margin: 0 }}>
          Conecta tus fuentes de datos. Cada integración alimenta automáticamente la piscina de movimientos.
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "4px", background: colors.surfaceAlt, border: `1px solid ${colors.border}`, borderRadius: "10px", padding: "4px", marginBottom: "24px", width: "fit-content" }}>
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              padding: "8px 20px", borderRadius: "7px", border: "none",
              background: tab === t.key ? colors.surface : "transparent",
              color: tab === t.key ? colors.textPrimary : colors.textSecondary,
              fontSize: "13px", fontWeight: tab === t.key ? 600 : 400,
              cursor: "pointer", fontFamily: fonts.body,
              boxShadow: tab === t.key ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
              transition: "all 0.15s",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Exchange */}
      {tab === "exchange" && (
        <div style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: "12px", padding: "3rem 2rem", textAlign: "center" }}>
          <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>🔗</div>
          <h3 style={{ fontFamily: fonts.display, fontSize: "16px", fontWeight: 700, color: colors.textPrimary, margin: "0 0 8px" }}>
            Conexión con exchanges
          </h3>
          <p style={{ fontSize: "13px", color: colors.textSecondary, margin: "0 0 1.5rem", lineHeight: 1.6 }}>
            Conecta Binance, Buda.com, Orionx, Coinbase, Kraken y más.<br/>
            Los movimientos se importarán automáticamente.
          </p>
          <span style={{
            display: "inline-block",
            background: colors.warningMuted, border: `1px solid rgba(245,158,11,0.25)`,
            color: colors.warning, padding: "6px 16px", borderRadius: "8px",
            fontSize: "12px", fontWeight: 600,
          }}>
            Próximamente
          </span>
        </div>
      )}

      {/* Banco */}
      {tab === "banco" && (
        <div style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: "12px", padding: "3rem 2rem", textAlign: "center" }}>
          <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>🏦</div>
          <h3 style={{ fontFamily: fonts.display, fontSize: "16px", fontWeight: 700, color: colors.textPrimary, margin: "0 0 8px" }}>
            Conexión bancaria
          </h3>
          <p style={{ fontSize: "13px", color: colors.textSecondary, margin: "0 0 1.5rem", lineHeight: 1.6 }}>
            Importa movimientos bancarios desde tu banco.<br/>
            Soporta Banco de Chile, Santander, BCI, Scotiabank y más.
          </p>
          <a href="/import/bank" style={{
            display: "inline-flex", alignItems: "center", gap: "6px",
            background: colors.accent, color: "#fff", padding: "9px 20px",
            borderRadius: "8px", textDecoration: "none",
            fontSize: "13px", fontWeight: 600, fontFamily: fonts.body,
          }}>
            Importar movimientos bancarios →
          </a>
        </div>
      )}

      {/* Wallets */}
      {tab === "wallets" && (
        <div style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: "12px", padding: "3rem 2rem", textAlign: "center" }}>
          <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>👛</div>
          <h3 style={{ fontFamily: fonts.display, fontSize: "16px", fontWeight: 700, color: colors.textPrimary, margin: "0 0 8px" }}>
            Wallets on-chain
          </h3>
          <p style={{ fontSize: "13px", color: colors.textSecondary, margin: "0 0 1.5rem", lineHeight: 1.6 }}>
            Conecta direcciones de blockchain para importar transacciones on-chain.<br/>
            Ethereum, Bitcoin y más redes próximamente.
          </p>
          <span style={{
            display: "inline-block",
            background: colors.warningMuted, border: `1px solid rgba(245,158,11,0.25)`,
            color: colors.warning, padding: "6px 16px", borderRadius: "8px",
            fontSize: "12px", fontWeight: 600,
          }}>
            Próximamente
          </span>
        </div>
      )}
    </div>
  );
}
