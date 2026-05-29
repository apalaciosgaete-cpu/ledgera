"use client";

import { useState } from "react";
import { BinanceIntegrationPanel } from "@/modules/integrations/binance/client/BinanceIntegrationPanel";
import { fonts } from "@/styles/tokens";

type Tab = "exchange" | "banco" | "wallets";

const EXCHANGES = [
  { name: "Binance",      desc: "Spot, futuros y staking. API REST.",          color: "#F0B90B", active: true  },
  { name: "Buda.com",     desc: "Exchange chileno. Transacciones CLP/cripto.", color: "#FF6B35", active: false },
  { name: "Orionx",       desc: "Exchange chileno. Órdenes y retiros.",        color: "#6B5CE7", active: false },
  { name: "Coinbase",     desc: "Spot, staking y earn.",                       color: "#0052FF", active: false },
  { name: "Kraken",       desc: "Spot y futuros. Historial completo.",         color: "#5741D9", active: false },
];

const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
  {
    key: "exchange",
    label: "Exchanges",
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>
      </svg>
    ),
  },
  {
    key: "banco",
    label: "Banco",
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/>
      </svg>
    ),
  },
  {
    key: "wallets",
    label: "Wallets",
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 12V8H6a2 2 0 0 1 0-4h14v4"/><path d="M4 6v12c0 1.1.9 2 2 2h14v-4"/><path d="M18 12a2 2 0 0 0 0 4h4v-4h-4z"/>
      </svg>
    ),
  },
];

export default function IntegracionesPage() {
  const [tab, setTab] = useState<Tab>("exchange");

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: "1.5rem" }}>
        <h1 style={{ fontFamily: fonts.display, fontSize: "20px", fontWeight: 700, color: "#f1f5f9", margin: "0 0 4px" }}>
          Integraciones
        </h1>
        <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>
          Conecta tus fuentes de datos. Cada integración alimenta automáticamente la piscina de movimientos.
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "4px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "10px", padding: "4px", marginBottom: "1.5rem", width: "fit-content" }}>
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              display: "flex", alignItems: "center", gap: "6px",
              padding: "7px 16px", borderRadius: "7px", border: "none",
              background: tab === t.key ? "rgba(255,255,255,0.1)" : "transparent",
              color: tab === t.key ? "#f1f5f9" : "#64748b",
              fontSize: "13px", fontWeight: tab === t.key ? 600 : 400,
              cursor: "pointer", fontFamily: fonts.body, transition: "all 0.15s",
            }}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* Exchange */}
      {tab === "exchange" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {/* Binance — activo */}
          <BinanceIntegrationPanel />

          {/* Próximamente */}
          <div style={{ marginTop: "8px" }}>
            <p style={{ fontSize: "11px", fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 10px" }}>
              Próximamente
            </p>
            {EXCHANGES.filter(ex => !ex.active).map(ex => (
              <div key={ex.name} style={{
                background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: "12px", padding: "1rem 1.25rem",
                display: "flex", alignItems: "center", justifyContent: "space-between",
                marginBottom: "8px", gap: "1rem", opacity: 0.55,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
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
                    <p style={{ fontSize: "13px", fontWeight: 600, color: "#94a3b8", margin: "0 0 2px" }}>{ex.name}</p>
                    <p style={{ fontSize: "11px", color: "#475569", margin: 0 }}>{ex.desc}</p>
                  </div>
                </div>
                <span style={{
                  fontSize: "10px", fontWeight: 700, color: "#475569",
                  background: "rgba(100,116,139,0.1)", border: "1px solid rgba(100,116,139,0.2)",
                  borderRadius: "6px", padding: "3px 8px",
                  letterSpacing: "0.06em", textTransform: "uppercase", whiteSpace: "nowrap",
                }}>
                  Próximamente
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Banco */}
      {tab === "banco" && (
        <div style={{
          background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: "12px", padding: "2rem", textAlign: "center",
        }}>
          <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>🏦</div>
          <h3 style={{ fontFamily: fonts.display, fontSize: "16px", fontWeight: 700, color: "#f1f5f9", margin: "0 0 8px" }}>
            Conexión bancaria
          </h3>
          <p style={{ fontSize: "13px", color: "#64748b", margin: "0 0 1.5rem", lineHeight: 1.6 }}>
            Importa movimientos bancarios directamente desde tu banco.<br/>
            Soporta Banco de Chile, Santander, BCI, Scotiabank y más.
          </p>
          <a
            href="/import/bank"
            style={{
              display: "inline-flex", alignItems: "center", gap: "6px",
              background: "#3a76f0", color: "#fff", padding: "9px 20px",
              borderRadius: "8px", textDecoration: "none",
              fontSize: "13px", fontWeight: 600,
            }}
          >
            Importar movimientos bancarios →
          </a>
        </div>
      )}

      {/* Wallets */}
      {tab === "wallets" && (
        <div style={{
          background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: "12px", padding: "2rem", textAlign: "center",
        }}>
          <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>👛</div>
          <h3 style={{ fontFamily: fonts.display, fontSize: "16px", fontWeight: 700, color: "#f1f5f9", margin: "0 0 8px" }}>
            Wallets on-chain
          </h3>
          <p style={{ fontSize: "13px", color: "#64748b", margin: "0 0 1.5rem", lineHeight: 1.6 }}>
            Conecta direcciones de blockchain para importar transacciones on-chain automáticamente.<br/>
            Soporte para Ethereum, Bitcoin y más redes próximamente.
          </p>
          <span style={{
            display: "inline-block",
            background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.25)",
            color: "#fcd34d", padding: "6px 16px", borderRadius: "8px",
            fontSize: "12px", fontWeight: 600, letterSpacing: "0.04em",
          }}>
            Próximamente
          </span>
        </div>
      )}
    </div>
  );
}
