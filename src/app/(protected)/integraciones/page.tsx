"use client";

import { useState } from "react";
import { colors, fonts } from "@/styles/tokens";

type Tab = "exchange" | "banco" | "wallets";

const EXCHANGES = [
  { name: "Binance",  desc: "Spot, futuros y staking. API REST.",          color: "#F0B90B" },
  { name: "Buda.com", desc: "Exchange chileno. Transacciones CLP/cripto.", color: "#FF6B35" },
  { name: "Orionx",   desc: "Exchange chileno. Órdenes y retiros.",        color: "#6B5CE7" },
  { name: "Coinbase", desc: "Spot, staking y earn.",                       color: "#0052FF" },
  { name: "Kraken",   desc: "Spot y futuros. Historial completo.",         color: "#5741D9" },
];

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
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {EXCHANGES.map(ex => (
            <div key={ex.name} style={{
              background: colors.surface, border: `1px solid ${colors.border}`,
              borderRadius: "12px", padding: "1rem 1.25rem",
              display: "flex", alignItems: "center", justifyContent: "space-between",
              gap: "1rem", opacity: 0.6,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{
                  width: "36px", height: "36px", borderRadius: "8px",
                  background: `${ex.color}18`, border: `1px solid ${ex.color}30`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "10px", fontWeight: 700, color: ex.color,
                  fontFamily: fonts.display, flexShrink: 0,
                }}>
                  {ex.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <p style={{ fontSize: "13px", fontWeight: 600, color: colors.textPrimary, margin: "0 0 2px" }}>{ex.name}</p>
                  <p style={{ fontSize: "11px", color: colors.textSecondary, margin: 0 }}>{ex.desc}</p>
                </div>
              </div>
              <span style={{
                fontSize: "10px", fontWeight: 700, color: colors.textMuted,
                background: colors.surfaceAlt, border: `1px solid ${colors.border}`,
                borderRadius: "6px", padding: "3px 8px",
                letterSpacing: "0.06em", textTransform: "uppercase", whiteSpace: "nowrap",
              }}>
                Próximamente
              </span>
            </div>
          ))}
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
