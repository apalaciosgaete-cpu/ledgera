"use client";

import { useState } from "react";
import { colors, fonts } from "@/styles/tokens";
import { BinanceIntegrationPanel } from "@/modules/integrations/binance/client/BinanceIntegrationPanel";

type Tab = "exchange" | "banco" | "wallets" | "staking";
type ExchangeKey = "binance" | null;

type Bank = {
  name: string;
  domain: string;
  logo?: string;
};

type BankImportResponse = {
  ok: boolean;
  message: string;
  data?: {
    uploadId?: string;
    duplicate?: boolean;
    totalRows?: number;
    importedRows?: number;
    errorRows?: number;
    preview?: Array<{
      occurredAt: string;
      description: string;
      amountClp: number;
      direction: string;
    }>;
  } | null;
};

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
    label: "Más integraciones",
    color: "#7C3AED",
    bg: "rgba(124,58,237,0.07)",
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="1"/>
        <circle cx="19" cy="12" r="1"/>
        <circle cx="5" cy="12" r="1"/>
      </svg>
    ),
  },
  {
    key: "staking",
    label: "Staking",
    color: "#0F766E",
    bg: "rgba(15,118,110,0.08)",
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2v20" />
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7H14a3.5 3.5 0 0 1 0 7H6" />
        <path d="M19 9l2 2-2 2" />
        <path d="M5 15l-2-2 2-2" />
      </svg>
    ),
  },
];

const CHILEAN_BANKS: Bank[] = [
  { name: "Banco de Chile",       domain: "bancochile.cl" },
  { name: "Banco Internacional",  domain: "bancointernacional.cl" },
  { name: "Scotiabank Chile",     domain: "scotiabank.com" },
  { name: "BCI",                  domain: "bci.cl" },
  { name: "Banco BICE",           domain: "bice.cl" },
  { name: "HSBC Bank Chile",      domain: "hsbc.com" },
  { name: "Santander Chile",      domain: "santander.com" },
  { name: "Itaú Corpbanca",       domain: "itau.com" },
  { name: "Banco Security",       domain: "security.cl", logo: "/bancosecurity-logo.png" },
  { name: "Banco Falabella",      domain: "bancofalabella.cl" },
  { name: "Banco Ripley",         domain: "bancoripley.cl" },
  { name: "Banco Consorcio",      domain: "bancoconsorcio.cl" },
  { name: "Scotiabank Azul",      domain: "scotiabank.com" },
  { name: "BTG Pactual Chile",    domain: "btgpactual.com" },
];

function getCsrfTokenFromCookie() {
  if (typeof document === "undefined") return "";

  return document.cookie
    .split(";")
    .map((entry) => entry.trim())
    .find((entry) => entry.startsWith("ledgera_csrf="))
    ?.split("=")[1] ?? "";
}

function formatFileSize(size: number) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export default function IntegracionesPage() {
  const [tab, setTab] = useState<Tab | null>(null);
  const [exchange, setExchange] = useState<ExchangeKey>(null);
  const [selectedBank, setSelectedBank] = useState<Bank | null>(null);
  const [bankFile, setBankFile] = useState<File | null>(null);
  const [isDraggingBankFile, setIsDraggingBankFile] = useState(false);
  const [isImportingBankFile, setIsImportingBankFile] = useState(false);
  const [bankImportError, setBankImportError] = useState<string | null>(null);
  const [bankImportResult, setBankImportResult] = useState<BankImportResponse | null>(null);
  const [showMore, setShowMore] = useState(false);

  function resetBankImportState() {
    setBankFile(null);
    setIsDraggingBankFile(false);
    setIsImportingBankFile(false);
    setBankImportError(null);
    setBankImportResult(null);
  }

  function handleBankSelect(bank: Bank) {
    setSelectedBank(bank);
    resetBankImportState();
  }

  function handleBankFile(file: File | null | undefined) {
    setBankImportError(null);
    setBankImportResult(null);

    if (!file) return;

    const lower = file.name.toLowerCase();
    const supported = lower.endsWith(".pdf") || lower.endsWith(".xlsx") || lower.endsWith(".xls") || lower.endsWith(".csv");

    if (!supported) {
      setBankFile(null);
      setBankImportError("Formato no soportado. Sube un archivo PDF, Excel o CSV.");
      return;
    }

    setBankFile(file);
  }

  async function submitBankFileImport() {
    if (!selectedBank || !bankFile) {
      setBankImportError("Selecciona un banco y adjunta un archivo antes de importar.");
      return;
    }

    setIsImportingBankFile(true);
    setBankImportError(null);
    setBankImportResult(null);

    try {
      const formData = new FormData();
      formData.append("bankName", selectedBank.name);
      formData.append("file", bankFile);

      const csrfToken = getCsrfTokenFromCookie();
      const response = await fetch("/api/bank/import", {
        method: "POST",
        headers: csrfToken ? { "x-ledgera-csrf": csrfToken } : undefined,
        body: formData,
      });

      const payload = (await response.json()) as BankImportResponse;

      if (!response.ok || !payload.ok) {
        throw new Error(payload.message || "No se pudo importar el archivo bancario.");
      }

      setBankImportResult(payload);
      setBankFile(null);
    } catch (error) {
      setBankImportError(error instanceof Error ? error.message : "No se pudo importar el archivo bancario.");
    } finally {
      setIsImportingBankFile(false);
    }
  }

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
      <button
        onClick={() => {
          setTab(null);
          setExchange(null);
          setSelectedBank(null);
          resetBankImportState();
        }}
        style={{
          display: "flex", alignItems: "center", gap: "6px",
          background: "transparent", border: "none", cursor: "pointer",
          color: colors.textSecondary, fontSize: "13px", fontFamily: fonts.body,
          padding: "0 0 20px", marginBottom: "4px",
        }}
      >
        ← Volver a Integraciones
      </button>

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
            {tab === "banco"    && "Importa cartolas o movimientos bancarios desde PDF, Excel o CSV"}
            {tab === "wallets"  && "Conecta tus wallets on-chain"}
            {tab === "staking"  && "Registra o revisa recompensas de staking asociadas a tus activos"}
          </p>
        </div>
      </div>

      {tab === "exchange" && !exchange && (
        <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
          <div>
            <p style={{ fontSize: "12px", fontWeight: 700, color: colors.textPrimary, textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 16px" }}>
              Exchanges que operan en Chile
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "10px" }}>
              {[
                { name: "Buda.com", domain: "buda.com"   },
                { name: "Orionx",   domain: "orionx.com" },
              ].map(ex => (
                <div key={ex.name} style={{
                  background: colors.surface, border: `1px solid ${colors.border}`,
                  borderRadius: "12px", padding: "14px 16px",
                  display: "flex", alignItems: "center", gap: "12px",
                  opacity: 0.65, cursor: "default",
                }}>
                  <img
                    src={`https://cdn.brandfetch.io/${ex.domain}/w/128/h/128`}
                    alt={ex.name} width="36" height="36"
                    style={{ borderRadius: "8px", flexShrink: 0, objectFit: "contain" }}
                    onError={(e) => { (e.target as HTMLImageElement).src = `https://t1.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://${ex.domain}&size=128`; }}
                  />
                  <span style={{ fontSize: "13px", fontWeight: 700, color: colors.textPrimary, fontFamily: fonts.display, flex: 1 }}>{ex.name}</span>
                  <span style={{ fontSize: "9px", fontWeight: 700, color: colors.textMuted, background: colors.surfaceAlt, border: `1px solid ${colors.border}`, borderRadius: "4px", padding: "2px 6px", letterSpacing: "0.05em", textTransform: "uppercase", flexShrink: 0 }}>Próx.</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <p style={{ fontSize: "12px", fontWeight: 700, color: colors.textPrimary, textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 16px" }}>
              Exchanges internacionales
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "10px" }}>
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

              {[
                { name: "Coinbase",  domain: "coinbase.com"  },
                { name: "Kraken",    domain: "kraken.com"    },
                { name: "CoinGecko", domain: "coingecko.com" },
              ].map(ex => (
                <div key={ex.name} style={{
                  background: colors.surface, border: `1px solid ${colors.border}`,
                  borderRadius: "12px", padding: "14px 16px",
                  display: "flex", alignItems: "center", gap: "12px",
                  opacity: 0.65, cursor: "default",
                }}>
                  <img
                    src={`https://cdn.brandfetch.io/${ex.domain}/w/128/h/128`}
                    alt={ex.name} width="36" height="36"
                    style={{ borderRadius: "8px", flexShrink: 0, objectFit: "contain" }}
                    onError={(e) => { (e.target as HTMLImageElement).src = `https://t1.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://${ex.domain}&size=128`; }}
                  />
                  <span style={{ fontSize: "13px", fontWeight: 700, color: colors.textPrimary, fontFamily: fonts.display, flex: 1 }}>{ex.name}</span>
                  <span style={{ fontSize: "9px", fontWeight: 700, color: colors.textMuted, background: colors.surfaceAlt, border: `1px solid ${colors.border}`, borderRadius: "4px", padding: "2px 6px", letterSpacing: "0.05em", textTransform: "uppercase", flexShrink: 0 }}>Próx.</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

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

      {tab === "banco" && !selectedBank && (
        <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
          <div>
            <p style={{ fontSize: "12px", fontWeight: 700, color: colors.textPrimary, textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 16px" }}>
              Bancos que operan en Chile
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "10px" }}>
              {CHILEAN_BANKS.map((bank) => (
                <button
                  key={bank.name}
                  onClick={() => handleBankSelect(bank)}
                  style={{
                    background: colors.surface,
                    border: `1px solid ${colors.border}`,
                    borderRadius: "12px",
                    padding: "14px 16px",
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    cursor: "pointer",
                    fontFamily: fonts.body,
                    textAlign: "left",
                    transition: "border-color 0.15s, box-shadow 0.15s, transform 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "rgba(0,82,255,0.45)";
                    e.currentTarget.style.boxShadow = "0 4px 16px rgba(15,23,42,0.08)";
                    e.currentTarget.style.transform = "translateY(-1px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = colors.border;
                    e.currentTarget.style.boxShadow = "none";
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  <img
                    src={bank.logo ?? `https://cdn.brandfetch.io/${bank.domain}/w/128/h/128`}
                    alt={bank.name}
                    width="36" height="36"
                    style={{ borderRadius: "8px", flexShrink: 0, objectFit: "contain", background: "#f8fafc" }}
                    onError={(e) => {
                      const el = e.target as HTMLImageElement;
                      if (!el.src.includes("clearbit")) {
                        el.src = `https://logo.clearbit.com/${bank.domain}`;
                      }
                    }}
                  />
                  <span style={{ fontSize: "13px", fontWeight: 700, color: colors.textPrimary, fontFamily: fonts.display, flex: 1 }}>
                    {bank.name}
                  </span>
                  <span style={{ fontSize: "9px", fontWeight: 700, color: "#0052FF", background: "rgba(0,82,255,0.08)", border: "1px solid rgba(0,82,255,0.18)", borderRadius: "4px", padding: "2px 6px", letterSpacing: "0.05em", textTransform: "uppercase", flexShrink: 0 }}>
                    Importar
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginTop: "8px" }}>
            <button
              type="button"
              onClick={() => setShowMore(v => !v)}
              style={{ background: "transparent", border: "none", color: colors.textSecondary, fontSize: "13px", fontWeight: 600, cursor: "pointer", padding: "6px 0", fontFamily: fonts.body }}
            >
              {showMore ? "← Ocultar opciones avanzadas" : "+ Más integraciones"}
            </button>
            {showMore && (
              <div style={{ marginTop: "12px" }}>
                <p style={{ fontSize: "12px", fontWeight: 700, color: colors.textPrimary, textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 16px" }}>
                  Bancos internacionales
                </p>
                <div style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: "12px", padding: "2rem", textAlign: "center" }}>
                  <span style={{ display: "inline-block", background: colors.warningMuted, border: "1px solid rgba(245,158,11,0.25)", color: colors.warning, padding: "6px 16px", borderRadius: "8px", fontSize: "12px", fontWeight: 600 }}>
                    Disponible próximamente
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {tab === "banco" && selectedBank && (
        <div>
          <button
            onClick={() => {
              setSelectedBank(null);
              resetBankImportState();
            }}
            style={{ display: "flex", alignItems: "center", gap: "6px", background: "transparent", border: "none", cursor: "pointer", color: colors.textSecondary, fontSize: "13px", fontFamily: fonts.body, padding: "0 0 24px", marginBottom: "4px" }}
          >
            ← Volver a Bancos
          </button>

          <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(280px, 360px)", gap: "20px", alignItems: "start" }}>
            <section style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: "16px", padding: "24px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "22px" }}>
                <img
                  src={selectedBank.logo ?? `https://cdn.brandfetch.io/${selectedBank.domain}/w/128/h/128`}
                  alt={selectedBank.name}
                  width="42"
                  height="42"
                  style={{ borderRadius: "10px", flexShrink: 0, objectFit: "contain", background: "#f8fafc" }}
                  onError={(e) => {
                    const el = e.target as HTMLImageElement;
                    if (!el.src.includes("clearbit")) {
                      el.src = `https://logo.clearbit.com/${selectedBank.domain}`;
                    }
                  }}
                />
                <div>
                  <h2 style={{ fontFamily: fonts.display, fontSize: "18px", fontWeight: 800, color: colors.textPrimary, margin: "0 0 2px" }}>{selectedBank.name}</h2>
                  <p style={{ fontSize: "13px", color: colors.textSecondary, margin: 0 }}>Sube una cartola o archivo de movimientos para iniciar la ingesta bancaria.</p>
                </div>
              </div>

              <label
                htmlFor="bank-file-upload"
                onDragOver={(event) => {
                  event.preventDefault();
                  setIsDraggingBankFile(true);
                }}
                onDragLeave={() => setIsDraggingBankFile(false)}
                onDrop={(event) => {
                  event.preventDefault();
                  setIsDraggingBankFile(false);
                  handleBankFile(event.dataTransfer.files?.[0]);
                }}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "12px",
                  minHeight: "220px",
                  borderRadius: "16px",
                  border: isDraggingBankFile ? "1.5px dashed rgba(0,82,255,0.75)" : `1.5px dashed ${colors.border}`,
                  background: isDraggingBankFile ? "rgba(0,82,255,0.07)" : colors.surfaceAlt,
                  cursor: "pointer",
                  padding: "28px",
                  textAlign: "center",
                  transition: "all 0.15s ease",
                }}
              >
                <input
                  id="bank-file-upload"
                  type="file"
                  accept=".pdf,.xlsx,.xls,.csv,application/pdf,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
                  style={{ display: "none" }}
                  onChange={(event) => handleBankFile(event.target.files?.[0])}
                />
                <div style={{ width: "54px", height: "54px", borderRadius: "16px", display: "flex", alignItems: "center", justifyContent: "center", color: "#0052FF", background: "rgba(0,82,255,0.08)" }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                </div>
                <div>
                  <p style={{ fontFamily: fonts.display, fontSize: "15px", fontWeight: 800, color: colors.textPrimary, margin: "0 0 6px" }}>
                    Arrastra tu PDF, Excel o CSV aquí
                  </p>
                  <p style={{ fontSize: "13px", color: colors.textSecondary, margin: 0 }}>
                    También puedes hacer click para seleccionar el archivo desde tu equipo.
                  </p>
                </div>
                {bankFile && (
                  <div style={{ marginTop: "8px", padding: "10px 12px", borderRadius: "10px", background: colors.surface, border: `1px solid ${colors.border}`, color: colors.textPrimary, fontSize: "13px", fontWeight: 700 }}>
                    {bankFile.name} · {formatFileSize(bankFile.size)}
                  </div>
                )}
              </label>

              {bankImportError && (
                <div style={{ marginTop: "16px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.22)", color: "#B91C1C", borderRadius: "12px", padding: "12px 14px", fontSize: "13px", fontWeight: 600 }}>
                  {bankImportError}
                </div>
              )}

              {bankImportResult && (
                <div style={{ marginTop: "16px", background: "rgba(22,163,74,0.08)", border: "1px solid rgba(22,163,74,0.22)", color: "#166534", borderRadius: "12px", padding: "12px 14px", fontSize: "13px", fontWeight: 600 }}>
                  {bankImportResult.message}
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "18px" }}>
                <button
                  type="button"
                  onClick={() => resetBankImportState()}
                  disabled={isImportingBankFile}
                  style={{ border: `1px solid ${colors.border}`, background: colors.surface, color: colors.textSecondary, borderRadius: "10px", padding: "10px 14px", fontSize: "13px", fontWeight: 700, cursor: isImportingBankFile ? "not-allowed" : "pointer" }}
                >
                  Limpiar
                </button>
                <button
                  type="button"
                  onClick={submitBankFileImport}
                  disabled={!bankFile || isImportingBankFile}
                  style={{ border: "1px solid rgba(0,82,255,0.45)", background: !bankFile || isImportingBankFile ? "rgba(0,82,255,0.35)" : "#0052FF", color: "white", borderRadius: "10px", padding: "10px 16px", fontSize: "13px", fontWeight: 800, cursor: !bankFile || isImportingBankFile ? "not-allowed" : "pointer" }}
                >
                  {isImportingBankFile ? "Importando..." : "Guardar e importar"}
                </button>
              </div>
            </section>

            <aside style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: "16px", padding: "20px" }}>
              <h3 style={{ fontFamily: fonts.display, fontSize: "15px", fontWeight: 800, color: colors.textPrimary, margin: "0 0 10px" }}>Qué hace LEDGERA</h3>
              <ul style={{ display: "flex", flexDirection: "column", gap: "10px", margin: 0, paddingLeft: "18px", color: colors.textSecondary, fontSize: "13px", lineHeight: 1.55 }}>
                <li>Lee archivos PDF, XLS, XLSX o CSV del banco seleccionado.</li>
                <li>Normaliza fecha, descripción, monto, dirección y saldo cuando esté disponible.</li>
                <li>Deduplica por hash de archivo y por identificador externo del movimiento.</li>
                <li>Clasifica el movimiento bancario para conciliación posterior con portafolio.</li>
              </ul>

              {bankImportResult?.data && (
                <div style={{ marginTop: "18px", borderTop: `1px solid ${colors.border}`, paddingTop: "16px" }}>
                  <p style={{ fontSize: "12px", color: colors.textSecondary, margin: "0 0 8px" }}>Resultado de ingesta</p>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                    <div style={{ background: colors.surfaceAlt, borderRadius: "10px", padding: "10px" }}>
                      <p style={{ margin: "0 0 4px", fontSize: "11px", color: colors.textMuted }}>Importados</p>
                      <strong style={{ color: colors.textPrimary, fontSize: "18px" }}>{bankImportResult.data.importedRows ?? 0}</strong>
                    </div>
                    <div style={{ background: colors.surfaceAlt, borderRadius: "10px", padding: "10px" }}>
                      <p style={{ margin: "0 0 4px", fontSize: "11px", color: colors.textMuted }}>Errores</p>
                      <strong style={{ color: colors.textPrimary, fontSize: "18px" }}>{bankImportResult.data.errorRows ?? 0}</strong>
                    </div>
                  </div>
                </div>
              )}
            </aside>
          </div>
        </div>
      )}

      {tab === "wallets" && (
        <div style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: "12px", padding: "3rem 2rem", textAlign: "center" }}>
          <p style={{ fontSize: "13px", color: colors.textSecondary, margin: "0 0 1.5rem", lineHeight: 1.7 }}>
            Conecta direcciones de blockchain para importar transacciones on-chain.<br/>
            Ethereum, Bitcoin y más redes disponibles próximamente.
          </p>
          <span style={{
            display: "inline-block",
            background: colors.warningMuted, border: "1px solid rgba(245,158,11,0.25)",
            color: colors.warning, padding: "6px 16px", borderRadius: "8px",
            fontSize: "12px", fontWeight: 600,
          }}>Disponible próximamente</span>
        </div>
      )}

      {tab === "staking" && (
        <div
          style={{
            background: colors.surface,
            border: `1px solid ${colors.border}`,
            borderRadius: "16px",
            padding: "24px",
          }}
        >
          <h2
            style={{
              fontFamily: fonts.display,
              fontSize: "18px",
              fontWeight: 700,
              color: colors.textPrimary,
              margin: "0 0 8px",
            }}
          >
            Staking
          </h2>

          <p
            style={{
              fontSize: "13px",
              color: colors.textSecondary,
              lineHeight: 1.6,
              margin: "0 0 20px",
            }}
          >
            Las recompensas de staking se registran como movimientos del portafolio
            y pueden tener impacto tributario. Desde aquí puedes revisar el detalle
            de staking acumulado.
          </p>

          <a
            href="/staking"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              height: "40px",
              padding: "0 16px",
              borderRadius: "10px",
              background: "#0F766E",
              color: "#FFFFFF",
              fontSize: "13px",
              fontWeight: 800,
              textDecoration: "none",
            }}
          >
            Abrir staking
          </a>
        </div>
      )}
    </div>
  );
}
