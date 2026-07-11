"use client";

import { useState } from "react";
import { notFound, useParams } from "next/navigation";
import { fonts } from "@/styles/tokens";
import { findBankById, getBankLogoUrl } from "@/modules/banking/catalogs/chileBanks";
import type { ConnectionMethod } from "@/modules/banking/catalogs/chileBanks";

const METHOD_META: Record<ConnectionMethod, { icon: string; label: string; cta: string; accent: string; bg: string; border: string }> = {
  api: {
    icon: "🔐",
    label: "Conexión segura por API",
    cta: "Configurar API →",
    accent: "var(--accent)",
    bg: "var(--bg-elev)",
    border: "var(--accent-soft)",
  },
  manual_upload: {
    icon: "📄",
    label: "Carga documental centralizada",
    cta: "Usa Documentación en Origen de Fondos",
    accent: "var(--bg-elev)",
    bg: "var(--bg-sunken)",
    border: "var(--border)",
  },
};

export default function BankConnectionPage() {
  const params = useParams<{ bankId: string }>();
  const bank = findBankById(params.bankId);
  const [activeMethod, setActiveMethod] = useState<ConnectionMethod | null>(null);
  const [apiClientId, setApiClientId] = useState("");
  const [apiSecret, setApiSecret] = useState("");
  const [apiToken, setApiToken] = useState("");

  if (!bank) notFound();

  const isAvailable = bank.status === "available";

  function handleMethod(method: ConnectionMethod) {
    setActiveMethod(method);
  }

  function connectApi(event: React.FormEvent) {
    event.preventDefault();
  }

  return (
    <main style={{ height: "calc(100vh - 92px)", overflow: "hidden", display: "grid", gap: 10, gridTemplateRows: "auto auto 1fr" }}>
      <section>
        <button
          onClick={() => window.location.href = "/origen-fondos/bancos"}
          style={{ display: "flex", alignItems: "center", gap: 6, background: "transparent", border: "none", cursor: "pointer", color: "var(--text)", fontSize: 13, fontFamily: fonts.body, padding: 0, marginBottom: 4 }}
        >
          ← Volver a Bancos
        </button>
      </section>

      <section style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <img src={getBankLogoUrl(bank.domain)} alt={bank.name} style={{ width: 58, height: 48, objectFit: "contain", display: "block" }} />
        <h1 style={{ color: "var(--text)", fontSize: "clamp(1.35rem,2.4vw,1.72rem)", fontWeight: 900, margin: 0, letterSpacing: "-0.04em", fontFamily: fonts.display }}>
          Conectar {bank.shortName}
        </h1>
      </section>

      <section style={{ minHeight: 0, overflow: "hidden", display: "grid", gap: 10, gridTemplateRows: "auto 1fr" }}>
        <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(2, minmax(0, 1fr))", alignContent: "start" }}>
          {bank.connectionMethods.map((method) => {
            const meta = METHOD_META[method];
            const active = activeMethod === method;
            return (
              <button
                key={method}
                type="button"
                disabled={!isAvailable}
                onClick={() => handleMethod(method)}
                style={{ minHeight: 106, borderRadius: 18, border: `1px solid ${active ? meta.accent : meta.border}`, background: meta.bg, color: "var(--text)", cursor: isAvailable ? "pointer" : "not-allowed", display: "grid", gap: 8, padding: "16px", textAlign: "left", fontFamily: fonts.body, opacity: isAvailable ? 1 : 0.55, boxShadow: active ? `0 8px 20px ${meta.accent}18` : "none" }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 28, lineHeight: 1 }}>{meta.icon}</span>
                  <strong style={{ fontSize: 15, fontWeight: 900 }}>{meta.label}</strong>
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, color: meta.accent }}>{meta.cta}</span>
              </button>
            );
          })}
        </div>

        <div style={{ minHeight: 0, border: "1px solid var(--border)", borderRadius: 18, background: "var(--bg-elev)", padding: 14, fontFamily: fonts.body, overflow: "hidden" }}>
          {!activeMethod && (
            <p style={{ margin: 0, color: "var(--text-soft)", fontSize: 13 }}>Selecciona un conector para mostrar sus comandos.</p>
          )}

          {activeMethod === "api" && (
            <form onSubmit={connectApi} style={{ display: "grid", gap: 10 }}>
              <strong style={{ color: "var(--text)", fontSize: 15 }}>Configurar API de {bank.shortName}</strong>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr)) auto", gap: 8, alignItems: "center" }}>
                <input value={apiClientId} onChange={(event) => setApiClientId(event.target.value)} placeholder="Client ID / Usuario API" style={{ minHeight: 42, borderRadius: 12, border: "1px solid var(--border)", padding: "0 12px", fontFamily: fonts.body }} />
                <input value={apiSecret} onChange={(event) => setApiSecret(event.target.value)} placeholder="Secret / Llave privada" type="password" style={{ minHeight: 42, borderRadius: 12, border: "1px solid var(--border)", padding: "0 12px", fontFamily: fonts.body }} />
                <input value={apiToken} onChange={(event) => setApiToken(event.target.value)} placeholder="Token / API Key" type="password" style={{ minHeight: 42, borderRadius: 12, border: "1px solid var(--border)", padding: "0 12px", fontFamily: fonts.body }} />
                <button type="submit" style={{ minHeight: 42, borderRadius: 12, border: "none", background: "var(--accent)", color: "var(--text)", fontWeight: 900, padding: "0 16px", cursor: "pointer" }}>Conectar API</button>
              </div>
            </form>
          )}
        </div>
      </section>
    </main>
  );
}
