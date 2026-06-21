"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { fonts } from "@/styles/tokens";

type WealthStepKey = "origen-fondos" | "activos";
type FlowCard = { title: string; description: string; items: string[] };
type WealthStep = {
  key: WealthStepKey;
  number: string;
  label: string;
  href: string;
  title: string;
  description: string;
  question: string;
  examples: string[];
  cards: FlowCard[];
};

const WEALTH_STEPS: WealthStep[] = [
  {
    key: "origen-fondos",
    number: "01",
    label: "Origen de Fondos",
    href: "/origen-fondos",
    title: "Origen de Fondos",
    description: "Registra las conexiones que explican de dónde vienen los fondos y qué archivos respaldan ese recorrido.",
    question: "¿Qué conexión quieres registrar o revisar?",
    examples: ["Banco a exchange", "Exchange a wallet", "Wallet a exchange", "Subir PDF o Excel"],
    cards: [
      { title: "Bancos", description: "Entrada o salida de dinero desde cuentas bancarias.", items: ["Cuenta bancaria", "Transferencias", "Movimientos"] },
      { title: "Exchanges", description: "Plataformas donde entran, salen o se convierten fondos.", items: ["Binance", "Coinbase", "Buda"] },
      { title: "Wallets", description: "Direcciones usadas para mover o custodiar fondos.", items: ["Dirección", "Transacción", "Autocustodia"] },
      { title: "Documentación", description: "Carga simple de respaldo documental.", items: ["PDF", "Excel"] },
    ],
  },
  {
    key: "activos",
    number: "02",
    label: "Activos",
    href: "/cryptoactivos",
    title: "Activos",
    description: "Registra los activos y lugares de custodia asociados al patrimonio digital.",
    question: "¿Qué activo o custodia necesitas ordenar?",
    examples: ["Tengo BTC", "Tengo NFTs", "Uso wallet fría", "Tengo activos en exchange"],
    cards: [
      { title: "Criptoactivos", description: "Activos digitales principales que forman parte del patrimonio.", items: ["BTC", "ETH", "SOL", "Tokens"] },
      { title: "NFTs", description: "Activos no fungibles vinculados a una wallet, colección u operación.", items: ["Colección", "Wallet", "Compra", "Venta"] },
      { title: "Wallets Frías", description: "Dispositivos o medios de autocustodia donde se mantienen activos digitales.", items: ["Ledger", "Trezor", "Coldcard", "Tangem"] },
      { title: "Exchanges", description: "Plataformas donde se mantienen saldos o posiciones activas.", items: ["Binance", "Coinbase", "Buda", "Saldos"] },
    ],
  },
];

function getStep(key: WealthStepKey) {
  return WEALTH_STEPS.find((step) => step.key === key) ?? WEALTH_STEPS[0];
}

const chipStyle = {
  border: "1px solid #E2E8F0",
  borderRadius: 999,
  color: "#475569",
  fontSize: 11,
  fontWeight: 700,
  padding: "4px 8px",
  fontFamily: fonts.body,
};

export function WealthFlowPage({ activeStep }: { activeStep: WealthStepKey }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const step = getStep(activeStep);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const clean = query.trim();
    if (!clean) return;
    router.push(`/panel?q=${encodeURIComponent(clean)}&scope=wealth-flow&step=${activeStep}`);
  }

  return (
    <main style={{ display: "grid", gap: 18 }}>
      <section style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 18, padding: "22px 24px" }}>
        <p style={{ color: "#0F766E", fontSize: 11, fontWeight: 850, letterSpacing: "0.08em", margin: "0 0 8px", textTransform: "uppercase", fontFamily: fonts.body }}>Mi Patrimonio</p>
        <h1 style={{ color: "#0F2A3D", fontSize: "clamp(1.45rem, 3vw, 2rem)", fontWeight: 850, margin: "0 0 8px", letterSpacing: "-0.025em", fontFamily: fonts.display }}>{step.title}</h1>
        <p style={{ color: "#64748B", fontSize: 14, lineHeight: 1.55, maxWidth: 760, margin: 0, fontFamily: fonts.body }}>{step.description}</p>
      </section>

      <section style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        {WEALTH_STEPS.map((item) => {
          const active = item.key === activeStep;
          return (
            <Link key={item.key} href={item.href} style={{ textDecoration: "none", background: active ? "#071B28" : "#FFFFFF", border: active ? "1px solid rgba(74,222,128,0.35)" : "1px solid #E2E8F0", borderRadius: 14, padding: "11px 14px", color: active ? "#F8FAFC" : "#0F2A3D", fontSize: 14, fontWeight: 800, fontFamily: fonts.body }}>
              {item.number}. {item.label}
            </Link>
          );
        })}
      </section>

      <section style={{ display: "grid", gap: 14, gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))" }}>
        {step.cards.map((card) => (
          <article key={card.title} style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 16, padding: 18 }}>
            <h2 style={{ color: "#0F2A3D", fontSize: 17, fontWeight: 850, margin: "0 0 7px", fontFamily: fonts.body }}>{card.title}</h2>
            <p style={{ color: "#64748B", fontSize: 13, lineHeight: 1.5, margin: "0 0 12px", fontFamily: fonts.body }}>{card.description}</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {card.items.map((item) => <span key={item} style={chipStyle}>{item}</span>)}
            </div>
          </article>
        ))}
      </section>

      <section style={{ background: "#071B28", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 18, padding: "20px 22px" }}>
        <p style={{ color: "#4ADE80", fontSize: 11, fontWeight: 850, letterSpacing: "0.08em", margin: "0 0 10px", textTransform: "uppercase", fontFamily: fonts.body }}>LEDGERA</p>
        <form onSubmit={submit} style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={step.question} style={{ flex: "1 1 320px", minHeight: 44, borderRadius: 12, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.05)", color: "#F8FAFC", padding: "0 14px", fontSize: 14, outline: "none", fontFamily: fonts.body }} />
          <button type="submit" style={{ minHeight: 44, borderRadius: 12, border: "none", background: "#16A34A", color: "#FFFFFF", padding: "0 16px", fontWeight: 850, cursor: "pointer", fontFamily: fonts.body }}>Analizar →</button>
        </form>
      </section>
    </main>
  );
}
