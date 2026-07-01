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
    accent: "#7C3AED",
    bg: "#FBFAFF",
    border: "#E6E0FF",
  },
  manual_upload: {
    icon: "📄",
    label: "Carga documental centralizada",
    cta: "Usa Documentación en Origen de Fondos",
    accent: "#64748B",
    bg: "#F8FAFC",
    border: "#E2E8F0",
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
  const guide = `Estás en la conexión con ${bank.name}. Selecciona el método de conexión para continuar.`;

  function handleMethod(method: ConnectionMethod) {
    setActiveMethod(method);
  }

  function connectApi(event: React.FormEvent) {
    event.preventDefault();
  }

  return (
    <main style={{ height: "calc(100vh - 92px)", overflow: "hidden", display: "grid", gap: 10, gridTemplateRows: "auto auto 1fr auto" }}>
      <section>
        <button
          onClick={() => window.location.href = "/origen-fondos/bancos"}
          style={{ display: "flex", alignItems: "center", gap: 6, background: "transparent", border: "none", cursor: "pointer", color: "#475569", fontSize: 13, fontFamily: fonts.body, padding: 0, marginBottom: 4 }}
        >
          ← Volver a Bancos
        </button>
      </section>

      <section style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <img src={getBankLogoUrl(bank.domain)} alt={bank.name} style={{ width: 58, height: 48, objectFit: "contain", display: "block" }} />
        <h1 style={{ color: "#0F2A3D", fontSize: "clamp(1.35rem,2.4vw,1.72rem)", fontWeight: 900, margin: 0, letterSpacing: "-0.04em", fontFamily: fonts.display }}>
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
                style={{ minHeight: 106, borderRadius: 18, border: `1px solid ${active ? meta.accent : meta.border}`, background: meta.bg, color: "#0F2A3D", cursor: isAvailable ? "pointer" : "not-allowed", display: "grid", gap: 8, padding: "16px", textAlign: "left", fontFamily: fonts.body, opacity: isAvailable ? 1 : 0.55, boxShadow: active ? `0 8px 20px ${meta.accent}18` : "none" }}
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

        <div style={{ minHeight: 0, border: "1px solid #E2E8F0", borderRadius: 18, background: "#FFFFFF", padding: 14, fontFamily: fonts.body, overflow: "hidden" }}>
          {!activeMethod && (
            <p style={{ margin: 0, color: "#64748B", fontSize: 13 }}>Selecciona un conector para mostrar sus comandos.</p>
          )}

          {activeMethod === "api" && (
            <form onSubmit={connectApi} style={{ display: "grid", gap: 10 }}>
              <strong style={{ color: "#0F2A3D", fontSize: 15 }}>Configurar API de {bank.shortName}</strong>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr)) auto", gap: 8, alignItems: "center" }}>
                <input value={apiClientId} onChange={(event) => setApiClientId(event.target.value)} placeholder="Client ID / Usuario API" style={{ minHeight: 42, borderRadius: 12, border: "1px solid #CBD5E1", padding: "0 12px", fontFamily: fonts.body }} />
                <input value={apiSecret} onChange={(event) => setApiSecret(event.target.value)} placeholder="Secret / Llave privada" type="password" style={{ minHeight: 42, borderRadius: 12, border: "1px solid #CBD5E1", padding: "0 12px", fontFamily: fonts.body }} />
                <input value={apiToken} onChange={(event) => setApiToken(event.target.value)} placeholder="Token / API Key" type="password" style={{ minHeight: 42, borderRadius: 12, border: "1px solid #CBD5E1", padding: "0 12px", fontFamily: fonts.body }} />
                <button type="submit" style={{ minHeight: 42, borderRadius: 12, border: "none", background: "#7C3AED", color: "#FFFFFF", fontWeight: 900, padding: "0 16px", cursor: "pointer" }}>Conectar API</button>
              </div>
            </form>
          )}
        </div>
      </section>

      <section style={{ alignSelf: "end", border: "1px solid #DDD6FE", borderRadius: 20, background: "#FFFFFF", padding: 14, boxShadow: "0 12px 28px rgba(109,74,255,0.05)" }}>
        <p style={{ margin: 0, color: "#475569", fontSize: 12.5, lineHeight: 1.3, fontFamily: fonts.body }}>{guide}</p>
      </section>
    </main>
  );
}
