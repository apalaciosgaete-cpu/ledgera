"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { fonts } from "@/styles/tokens";

type WealthStepKey = "origen-fondos" | "activos" | "documentacion";

type FlowCard = {
  title: string;
  description: string;
  items: string[];
};

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
    description: "Primero se ordena de dónde vienen los fondos y por dónde circularon antes de convertirse en activos.",
    question: "¿De dónde vienen los fondos y qué respaldo tienes?",
    examples: ["Fondos desde banco", "Movimientos desde exchange", "Fondos enviados a wallet", "Cartola y comprobante disponibles"],
    cards: [
      {
        title: "Bancos",
        description: "Cuentas, cartolas, transferencias y movimientos bancarios asociados al origen del dinero.",
        items: ["Cartolas bancarias", "Transferencias", "Comprobantes", "Fechas y montos"],
      },
      {
        title: "Exchanges",
        description: "Entradas y salidas desde plataformas donde se compraron, vendieron o movieron cryptoactivos.",
        items: ["Binance", "Coinbase", "Buda", "CSV / reportes"],
      },
      {
        title: "Wallets",
        description: "Trazabilidad entre direcciones, autocustodia y movimientos relevantes del usuario.",
        items: ["Direcciones", "Hash de transacciones", "Wallet proofs", "Relación con exchanges"],
      },
      {
        title: "Documentación de respaldo",
        description: "La evidencia vive aquí porque respalda el origen del dinero y su recorrido patrimonial.",
        items: ["Cartolas", "Comprobantes", "Contratos", "Declaraciones", "Informes tributarios"],
      },
    ],
  },
  {
    key: "activos",
    number: "02",
    label: "Activos",
    href: "/cryptoactivos",
    title: "Activos",
    description: "Después del origen se registran los activos adquiridos o recibidos, sin mezclar categorías que no pertenecen al MVP crypto first.",
    question: "¿Qué activos digitales necesitas ordenar?",
    examples: ["Tengo BTC", "Recibí USDT", "Compré ETH", "Tengo NFTs"],
    cards: [
      {
        title: "Criptoactivos",
        description: "Activos principales que forman parte del patrimonio digital declarado o por ordenar.",
        items: ["BTC", "ETH", "SOL", "Tokens"],
      },
      {
        title: "Stablecoins",
        description: "Activos estables usados como puente, ahorro, pago o transferencia entre plataformas.",
        items: ["USDT", "USDC", "DAI", "Movimientos asociados"],
      },
      {
        title: "NFTs",
        description: "Activos no fungibles que requieren identificación, origen y documentación básica.",
        items: ["Colección", "Wallet", "Compra / venta", "Evidencia"],
      },
      {
        title: "Estado documental",
        description: "Cada activo debe quedar vinculado a su origen y a los respaldos disponibles.",
        items: ["Origen asociado", "Exchange", "Wallet", "Documento vinculado"],
      },
    ],
  },
  {
    key: "documentacion",
    number: "03",
    label: "Documentación",
    href: "/documentacion",
    title: "Documentación",
    description: "La documentación no es un módulo aislado: es la evidencia que conecta origen de fondos y activos.",
    question: "¿Qué respaldo necesitas vincular al origen o a un activo?",
    examples: ["Subir cartola", "Agregar comprobante", "Vincular contrato", "Adjuntar informe tributario"],
    cards: [
      {
        title: "Cartolas",
        description: "Respaldo bancario para justificar entrada, salida o disponibilidad de fondos.",
        items: ["Banco", "Periodo", "Monto", "Movimiento relacionado"],
      },
      {
        title: "Comprobantes",
        description: "Soporte directo de transferencias, compras, ventas o retiros.",
        items: ["Transferencia", "Compra", "Venta", "Retiro"],
      },
      {
        title: "Contratos y declaraciones",
        description: "Documentos formales que respaldan operaciones o posiciones patrimoniales relevantes.",
        items: ["Contratos", "Declaraciones", "Informes tributarios", "Anexos"],
      },
      {
        title: "Vinculación probatoria",
        description: "Cada documento debe conectarse con origen de fondos, activo o movimiento específico.",
        items: ["Origen", "Activo", "Exchange", "Wallet"],
      },
    ],
  },
];

function getStep(key: WealthStepKey) {
  return WEALTH_STEPS.find((step) => step.key === key) ?? WEALTH_STEPS[0];
}

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
    <main style={{ display: "grid", gap: 20 }}>
      <section style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 22, padding: "28px 30px" }}>
        <p style={{ color: "#0F766E", fontSize: 12, fontWeight: 850, letterSpacing: "0.08em", margin: "0 0 10px", textTransform: "uppercase", fontFamily: fonts.body }}>
          Mi Patrimonio
        </p>
        <h1 style={{ color: "#0F2A3D", fontSize: "clamp(2rem, 5vw, 3rem)", fontWeight: 900, margin: "0 0 12px", letterSpacing: "-0.04em", fontFamily: fonts.display }}>
          {step.title}
        </h1>
        <p style={{ color: "#64748B", fontSize: 16, lineHeight: 1.7, maxWidth: 820, margin: 0, fontFamily: fonts.body }}>
          {step.description}
        </p>
      </section>

      <section style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
        {WEALTH_STEPS.map((item) => {
          const active = item.key === activeStep;
          return (
            <Link
              key={item.key}
              href={item.href}
              style={{
                textDecoration: "none",
                background: active ? "#071B28" : "#FFFFFF",
                border: active ? "1px solid rgba(74,222,128,0.35)" : "1px solid #E2E8F0",
                borderRadius: 18,
                padding: 18,
                display: "grid",
                gap: 8,
              }}
            >
              <span style={{ color: active ? "#4ADE80" : "#0F766E", fontSize: 12, fontWeight: 900, fontFamily: fonts.body }}>{item.number}</span>
              <strong style={{ color: active ? "#F8FAFC" : "#0F2A3D", fontSize: 16, fontFamily: fonts.body }}>{item.label}</strong>
              <span style={{ color: active ? "#94A3B8" : "#64748B", fontSize: 13, lineHeight: 1.45, fontFamily: fonts.body }}>
                {item.key === "origen-fondos" && "Bancos, exchanges, wallets y respaldo."}
                {item.key === "activos" && "Criptoactivos, stablecoins y NFTs."}
                {item.key === "documentacion" && "Evidencia vinculada al origen."}
              </span>
            </Link>
          );
        })}
      </section>

      <section style={{ background: "#071B28", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 22, padding: "26px 28px" }}>
        <p style={{ color: "#4ADE80", fontSize: 12, fontWeight: 850, letterSpacing: "0.08em", margin: "0 0 12px", textTransform: "uppercase", fontFamily: fonts.body }}>
          Consultar a LEDGERA
        </p>
        <h2 style={{ color: "#F8FAFC", fontSize: "1.35rem", fontWeight: 850, margin: "0 0 18px", fontFamily: fonts.body }}>
          {step.question}
        </h2>
        <form onSubmit={submit} style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={step.examples[0] ?? "Describe tu situación"}
            style={{ flex: "1 1 320px", minHeight: 48, borderRadius: 14, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.05)", color: "#F8FAFC", padding: "0 16px", fontSize: 15, outline: "none", fontFamily: fonts.body }}
          />
          <button type="submit" style={{ minHeight: 48, borderRadius: 14, border: "none", background: "#16A34A", color: "#FFFFFF", padding: "0 18px", fontWeight: 850, cursor: "pointer", fontFamily: fonts.body }}>
            Analizar →
          </button>
        </form>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 16 }}>
          {step.examples.map((example) => (
            <button key={example} type="button" onClick={() => setQuery(example)} style={{ border: "1px solid rgba(255,255,255,0.09)", background: "rgba(255,255,255,0.04)", color: "#CBD5E1", borderRadius: 999, padding: "7px 12px", fontSize: 13, cursor: "pointer", fontFamily: fonts.body }}>
              {example}
            </button>
          ))}
        </div>
      </section>

      <section style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))" }}>
        {step.cards.map((card, index) => (
          <article key={card.title} style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 18, padding: 22 }}>
            <span style={{ color: "#0F766E", fontSize: 12, fontWeight: 850 }}>{String(index + 1).padStart(2, "0")}</span>
            <h3 style={{ color: "#0F2A3D", fontSize: 18, fontWeight: 850, margin: "10px 0 8px", fontFamily: fonts.body }}>{card.title}</h3>
            <p style={{ color: "#64748B", fontSize: 14, lineHeight: 1.6, margin: "0 0 12px", fontFamily: fonts.body }}>
              {card.description}
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
              {card.items.map((item) => (
                <span key={item} style={{ border: "1px solid #E2E8F0", borderRadius: 999, color: "#475569", fontSize: 12, fontWeight: 700, padding: "5px 9px", fontFamily: fonts.body }}>
                  {item}
                </span>
              ))}
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
