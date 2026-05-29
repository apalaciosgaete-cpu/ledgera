"use client";

import { useState } from "react";
import { colors, fonts } from "@/styles/tokens";

type Tab = "exchange" | "banco" | "wallets";

const TABS: { key: Tab; label: string; icon: React.ReactNode; color: string; bg: string }[] = [
  {
    key: "exchange",
    label: "Exchange",
    color: "#F0B90B",
    bg: "rgba(240,185,11,0.08)",
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="17 1 21 5 17 9"/>
        <path d="M3 11V9a4 4 0 0 1 4-4h14"/>
        <polyline points="7 23 3 19 7 15"/>
        <path d="M21 13v2a4 4 0 0 1-4 4H3"/>
      </svg>
    ),
  },
  {
    key: "banco",
    label: "Banco",
    color: "#0052FF",
    bg: "rgba(0,82,255,0.07)",
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="5" width="20" height="14" rx="3"/>
        <line x1="2" y1="10" x2="22" y2="10"/>
        <line x1="6" y1="15" x2="10" y2="15"/>
      </svg>
    ),
  },
  {
    key: "wallets",
    label: "Wallets",
    color: "#7C3AED",
    bg: "rgba(124,58,237,0.07)",
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 12V8H6a2 2 0 0 1 0-4h14v4"/>
        <path d="M4 6v12c0 1.1.9 2 2 2h14v-4"/>
        <path d="M18 12a2 2 0 0 0 0 4h4v-4h-4z"/>
      </svg>
    ),
  },
];

export default function IntegracionesPage() {
  const [tab, setTab] = useState<Tab | null>(null);

  if (!tab) {
    return (
      <div>
        <div style={{ marginBottom: "40px" }}>
          <h1 style={{ fontFamily: fonts.display, fontSize: "20px", fontWeight: 700, color: colors.textPrimary, margin: "0 0 4px" }}>
            Integraciones
          </h1>
          <p style={{ fontSize: "13px", color: colors.textSecondary, margin: 0 }}>
            Conecta tus fuentes de datos. Cada integración alimenta automáticamente la piscina de movimientos.
          </p>
        </div>

        {/* Cards centrales */}
        <div style={{ display: "flex", justifyContent: "center", gap: "20px", flexWrap: "wrap", marginTop: "40px" }}>
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                width: "220px", background: colors.surface,
                border: `1px solid ${colors.border}`,
                borderRadius: "16px", padding: "2rem 1.5rem",
                display: "flex", flexDirection: "column", alignItems: "center", gap: "16px",
                cursor: "pointer", fontFamily: fonts.body,
                boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                transition: "box-shadow 0.2s, transform 0.15s",
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 6px 24px rgba(0,0,0,0.12)";
                (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-2px)";
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 2px 8px rgba(0,0,0,0.06)";
                (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
              }}
            >
              <div style={{
                width: "64px", height: "64px", borderRadius: "16px",
                background: t.bg, color: t.color,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {t.icon}
              </div>
              <span style={{ fontSize: "16px", fontWeight: 700, color: colors.textPrimary, fontFamily: fonts.display }}>
                {t.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  const current = TABS.find(t => t.key === tab)!;

  return (
    <div>
      {/* Back */}
      <button
        onClick={() => setTab(null)}
        style={{
          display: "flex", alignItems: "center", gap: "6px",
          background: "transparent", border: "none", cursor: "pointer",
          color: colors.textSecondary, fontSize: "13px", fontFamily: fonts.body,
          padding: "0 0 20px", marginBottom: "4px",
        }}
      >
        ← Volver a Integraciones
      </button>

      {/* Header sección */}
      <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "28px" }}>
        <div style={{
          width: "48px", height: "48px", borderRadius: "12px",
          background: current.bg, color: current.color,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          {current.icon}
        </div>
        <div>
          <h1 style={{ fontFamily: fonts.display, fontSize: "20px", fontWeight: 700, color: colors.textPrimary, margin: "0 0 2px" }}>
            {current.label}
          </h1>
          <p style={{ fontSize: "13px", color: colors.textSecondary, margin: 0 }}>
            {tab === "exchange" && "Conecta tus exchanges de criptomonedas"}
            {tab === "banco"    && "Conecta tu cuenta bancaria"}
            {tab === "wallets"  && "Conecta tus wallets on-chain"}
          </p>
        </div>
      </div>

      {/* Contenido */}
      {tab === "exchange" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>

          {/* Chile */}
          <div>
            <p style={{ fontSize: "11px", fontWeight: 700, color: colors.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 14px" }}>
              Exchanges que operan en Chile
            </p>
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              {[
                { name: "Buda.com", color: "#FF6B35", bg: "#1a0f0a", initials: "BU" },
                { name: "Orionx",   color: "#A78BFA", bg: "#0f0a1a", initials: "OR" },
              ].map(ex => (
                <div key={ex.name} style={{
                  background: ex.bg, border: `1px solid ${ex.color}30`,
                  borderRadius: "10px", padding: "0.625rem 1.25rem",
                  display: "flex", alignItems: "center", gap: "8px",
                  opacity: 0.65, cursor: "default",
                }}>
                  <div style={{
                    width: "20px", height: "20px", borderRadius: "4px",
                    background: `${ex.color}25`, border: `1px solid ${ex.color}40`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "8px", fontWeight: 800, color: ex.color, flexShrink: 0,
                    fontFamily: fonts.display,
                  }}>
                    {ex.initials}
                  </div>
                  <span style={{ fontSize: "0.875rem", fontWeight: 600, color: ex.color, fontFamily: fonts.body }}>
                    {ex.name}
                  </span>
                  <span style={{
                    fontSize: "9px", fontWeight: 700, color: colors.textMuted,
                    background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "4px", padding: "2px 6px", letterSpacing: "0.05em",
                    textTransform: "uppercase", marginLeft: "4px",
                  }}>
                    Próximamente
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Internacionales */}
          <div>
            <p style={{ fontSize: "11px", fontWeight: 700, color: colors.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 14px" }}>
              Exchanges internacionales
            </p>
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              {/* Binance — con logo real */}
              <div style={{
                background: "#1E2026", border: "1px solid rgba(243,186,47,0.2)",
                borderRadius: "10px", padding: "0.625rem 1.25rem",
                display: "flex", alignItems: "center", gap: "8px",
                opacity: 0.65, cursor: "default",
              }}>
                <img src="/binance-symbol.svg" alt="Binance" width="20" height="20" aria-hidden="true" />
                <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "#F3BA2F", fontFamily: fonts.body }}>
                  Binance
                </span>
                <span style={{
                  fontSize: "9px", fontWeight: 700, color: "#94A3B8",
                  background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "4px", padding: "2px 6px", letterSpacing: "0.05em",
                  textTransform: "uppercase", marginLeft: "4px",
                }}>
                  Próximamente
                </span>
              </div>

              {/* Resto */}
              {[
                { name: "Coinbase", color: "#4D9AFF", bg: "#0a0f1a", initials: "CO" },
                { name: "Kraken",   color: "#9F8AEF", bg: "#100a1a", initials: "KR" },
                { name: "CoinGecko", color: "#8DC63F", bg: "#0a120a", initials: "CG" },
              ].map(ex => (
                <div key={ex.name} style={{
                  background: ex.bg, border: `1px solid ${ex.color}30`,
                  borderRadius: "10px", padding: "0.625rem 1.25rem",
                  display: "flex", alignItems: "center", gap: "8px",
                  opacity: 0.65, cursor: "default",
                }}>
                  <div style={{
                    width: "20px", height: "20px", borderRadius: "4px",
                    background: `${ex.color}25`, border: `1px solid ${ex.color}40`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "8px", fontWeight: 800, color: ex.color, flexShrink: 0,
                    fontFamily: fonts.display,
                  }}>
                    {ex.initials}
                  </div>
                  <span style={{ fontSize: "0.875rem", fontWeight: 600, color: ex.color, fontFamily: fonts.body }}>
                    {ex.name}
                  </span>
                  <span style={{
                    fontSize: "9px", fontWeight: 700, color: colors.textMuted,
                    background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "4px", padding: "2px 6px", letterSpacing: "0.05em",
                    textTransform: "uppercase", marginLeft: "4px",
                  }}>
                    Próximamente
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {tab === "banco" && (
        <div style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: "12px", padding: "3rem 2rem", textAlign: "center" }}>
          <p style={{ fontSize: "13px", color: colors.textSecondary, margin: "0 0 1.5rem", lineHeight: 1.7 }}>
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

      {tab === "wallets" && (
        <div style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: "12px", padding: "3rem 2rem", textAlign: "center" }}>
          <p style={{ fontSize: "13px", color: colors.textSecondary, margin: "0 0 1.5rem", lineHeight: 1.7 }}>
            Conecta direcciones de blockchain para importar transacciones on-chain.<br/>
            Ethereum, Bitcoin y más redes próximamente.
          </p>
          <span style={{
            display: "inline-block",
            background: colors.warningMuted, border: "1px solid rgba(245,158,11,0.25)",
            color: colors.warning, padding: "6px 16px", borderRadius: "8px",
            fontSize: "12px", fontWeight: 600,
          }}>Próximamente</span>
        </div>
      )}
    </div>
  );
}
