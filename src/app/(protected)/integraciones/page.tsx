"use client";

import { useState } from "react";
import { colors, fonts } from "@/styles/tokens";
import { BinanceIntegrationPanel } from "@/modules/integrations/binance/client/BinanceIntegrationPanel";

type Tab = "exchange" | "banco" | "wallets";
type ExchangeKey = "binance" | null;

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
  const [exchange, setExchange] = useState<ExchangeKey>(null);

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

      {/* Contenido Exchange */}
      {tab === "exchange" && !exchange && (
        <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>

          {/* Chile */}
          <div>
            <p style={{ fontSize: "12px", fontWeight: 700, color: colors.textPrimary, textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 16px" }}>
              Exchanges que operan en Chile
            </p>
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              {[
                { name: "Buda.com", domain: "buda.com"   },
                { name: "Orionx",   domain: "orionx.com" },
              ].map(ex => (
                <div key={ex.name} style={{
                  background: colors.surface, border: `1px solid ${colors.border}`,
                  borderRadius: "12px", padding: "0.75rem 1.5rem",
                  display: "flex", alignItems: "center", gap: "10px",
                  opacity: 0.65, cursor: "default",
                }}>
                  <img
                    src={`https://logo.clearbit.com/${ex.domain}`}
                    alt={ex.name} width="28" height="28"
                    style={{ borderRadius: "6px", background: "#fff" }}
                    onError={(e) => { (e.target as HTMLImageElement).src = `https://www.google.com/s2/favicons?domain=${ex.domain}&sz=64`; }}
                  />
                  <span style={{ fontSize: "15px", fontWeight: 700, color: colors.textPrimary, fontFamily: fonts.display }}>{ex.name}</span>
                  <span style={{ fontSize: "9px", fontWeight: 700, color: colors.textMuted, background: colors.surfaceAlt, border: `1px solid ${colors.border}`, borderRadius: "4px", padding: "2px 7px", letterSpacing: "0.05em", textTransform: "uppercase", marginLeft: "6px" }}>
                    Próximamente
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Internacionales */}
          <div>
            <p style={{ fontSize: "12px", fontWeight: 700, color: colors.textPrimary, textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 16px" }}>
              Exchanges internacionales
            </p>
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>

              {/* Binance — clickeable */}
              <button
                onClick={() => setExchange("binance")}
                style={{
                  background: "#1E2026", border: "1px solid rgba(243,186,47,0.35)",
                  borderRadius: "12px", padding: "0.75rem 1.5rem",
                  display: "flex", alignItems: "center", gap: "10px",
                  cursor: "pointer", fontFamily: fonts.body,
                  transition: "border-color 0.15s, box-shadow 0.15s",
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(243,186,47,0.7)"; e.currentTarget.style.boxShadow = "0 4px 16px rgba(243,186,47,0.15)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(243,186,47,0.35)"; e.currentTarget.style.boxShadow = "none"; }}
              >
                <img src="/binance-symbol.svg" alt="Binance" width="28" height="28" />
                <span style={{ fontSize: "15px", fontWeight: 700, color: "#F3BA2F", fontFamily: fonts.display }}>Binance</span>
                <span style={{ fontSize: "9px", fontWeight: 700, color: "#16A34A", background: "rgba(22,163,74,0.15)", border: "1px solid rgba(22,163,74,0.3)", borderRadius: "4px", padding: "2px 7px", letterSpacing: "0.05em", textTransform: "uppercase", marginLeft: "6px" }}>
                  Activo
                </span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#F3BA2F" strokeWidth="2" strokeLinecap="round" style={{ marginLeft: "4px", opacity: 0.6 }}>
                  <path d="M9 18l6-6-6-6"/>
                </svg>
              </button>

              {/* Resto */}
              {[
                { name: "Coinbase",  domain: "coinbase.com"  },
                { name: "Kraken",    domain: "kraken.com"    },
                { name: "CoinGecko", domain: "coingecko.com" },
              ].map(ex => (
                <div key={ex.name} style={{
                  background: colors.surface, border: `1px solid ${colors.border}`,
                  borderRadius: "12px", padding: "0.75rem 1.5rem",
                  display: "flex", alignItems: "center", gap: "10px",
                  opacity: 0.65, cursor: "default",
                }}>
                  <img
                    src={`https://logo.clearbit.com/${ex.domain}`}
                    alt={ex.name} width="28" height="28"
                    style={{ borderRadius: "6px", background: "#fff" }}
                    onError={(e) => { (e.target as HTMLImageElement).src = `https://www.google.com/s2/favicons?domain=${ex.domain}&sz=64`; }}
                  />
                  <span style={{ fontSize: "15px", fontWeight: 700, color: colors.textPrimary, fontFamily: fonts.display }}>{ex.name}</span>
                  <span style={{ fontSize: "9px", fontWeight: 700, color: colors.textMuted, background: colors.surfaceAlt, border: `1px solid ${colors.border}`, borderRadius: "4px", padding: "2px 7px", letterSpacing: "0.05em", textTransform: "uppercase", marginLeft: "6px" }}>
                    Próximamente
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Vista interior: Binance */}
      {tab === "exchange" && exchange === "binance" && (
        <div>
          <button
            onClick={() => setExchange(null)}
            style={{ display: "flex", alignItems: "center", gap: "6px", background: "transparent", border: "none", cursor: "pointer", color: colors.textSecondary, fontSize: "13px", fontFamily: fonts.body, padding: "0 0 24px", marginBottom: "4px" }}
          >
            ← Volver a Exchanges
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "28px" }}>
            <div style={{ background: "#1E2026", border: "1px solid rgba(243,186,47,0.3)", borderRadius: "12px", width: "48px", height: "48px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <img src="/binance-symbol.svg" alt="Binance" width="28" height="28" />
            </div>
            <div>
              <h2 style={{ fontFamily: fonts.display, fontSize: "18px", fontWeight: 700, color: colors.textPrimary, margin: "0 0 2px" }}>Binance</h2>
              <p style={{ fontSize: "13px", color: colors.textSecondary, margin: 0 }}>Conecta tus APIs de Binance para importar movimientos automáticamente</p>
            </div>
          </div>
          <BinanceIntegrationPanel />
        </div>
      )}

      {tab === "banco" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>

          {/* Bancos Chile */}
          <div>
            <p style={{ fontSize: "12px", fontWeight: 700, color: colors.textPrimary, textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 16px" }}>
              Bancos que operan en Chile
            </p>
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              {[
                { name: "Banco de Chile",    domain: "bancochile.cl"         },
                { name: "Banco Internacional", domain: "bancointernacional.cl"},
                { name: "Scotiabank Chile",  domain: "scotiabank.cl"          },
                { name: "BCI",               domain: "bci.cl"                 },
                { name: "Banco BICE",        domain: "bice.cl"                },
                { name: "HSBC Bank Chile",   domain: "hsbc.cl"                },
                { name: "Santander Chile",   domain: "santander.cl"           },
                { name: "Itaú Corpbanca",    domain: "itau.cl"                },
                { name: "Banco Security",    domain: "security.cl"            },
                { name: "Banco Falabella",   domain: "bancofalabella.cl"      },
                { name: "Banco Ripley",      domain: "bancoripley.cl"         },
                { name: "Banco Consorcio",   domain: "bancoconsorcio.cl"      },
                { name: "Scotiabank Azul",   domain: "scotiabank.cl"          },
                { name: "BTG Pactual Chile", domain: "btgpactual.com"         },
              ].map(bank => (
                <div key={bank.name} style={{
                  background: colors.surface, border: `1px solid ${colors.border}`,
                  borderRadius: "12px", padding: "0.75rem 1.25rem",
                  display: "flex", alignItems: "center", gap: "10px",
                  opacity: 0.7, cursor: "default",
                }}>
                  <img
                    src={`https://logo.clearbit.com/${bank.domain}`}
                    alt={bank.name}
                    width="28" height="28"
                    style={{ borderRadius: "6px", flexShrink: 0, background: "#fff" }}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = `https://www.google.com/s2/favicons?domain=${bank.domain}&sz=64`;
                    }}
                  />
                  <span style={{ fontSize: "14px", fontWeight: 700, color: colors.textPrimary, fontFamily: fonts.display, whiteSpace: "nowrap" }}>
                    {bank.name}
                  </span>
                  <span style={{ fontSize: "9px", fontWeight: 700, color: colors.textMuted, background: colors.surfaceAlt, border: `1px solid ${colors.border}`, borderRadius: "4px", padding: "2px 7px", letterSpacing: "0.05em", textTransform: "uppercase", marginLeft: "4px" }}>
                    Próximamente
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Bancos internacionales */}
          <div>
            <p style={{ fontSize: "12px", fontWeight: 700, color: colors.textPrimary, textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 16px" }}>
              Bancos internacionales
            </p>
            <div style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: "12px", padding: "2rem", textAlign: "center" }}>
              <span style={{ display: "inline-block", background: colors.warningMuted, border: "1px solid rgba(245,158,11,0.25)", color: colors.warning, padding: "6px 16px", borderRadius: "8px", fontSize: "12px", fontWeight: 600 }}>
                Próximamente
              </span>
            </div>
          </div>

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
