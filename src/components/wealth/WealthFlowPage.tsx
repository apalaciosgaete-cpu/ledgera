"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { fonts } from "@/styles/tokens";
import { speakResponse, stopSpeaking } from "@/modules/voice/textToSpeech";
import { startListening } from "@/modules/voice/speechToText";

type WealthStepKey = "origen-fondos" | "activos";
type OptionKey = "bancos" | "exchanges" | "wallets" | "documentacion" | "criptoactivos" | "nfts" | "wallets-frias";
type FlowOption = { key: OptionKey; icon: string; label: string; hint: string };

type WealthStep = {
  key: WealthStepKey;
  title: string;
  question: string;
  guide: string;
  options: FlowOption[];
};

const STEPS: Record<WealthStepKey, WealthStep> = {
  "origen-fondos": {
    key: "origen-fondos",
    title: "Origen de Fondos",
    question: "Indica bancos, exchanges, wallets o documentación",
    guide: "Estás en Origen de Fondos. Puedes decir o escribir bancos, exchanges, wallets o documentación. LEDGERA abrirá la opción que corresponda.",
    options: [
      { key: "bancos", icon: "🏦", label: "Bancos", hint: "Conectar cuentas y movimientos bancarios." },
      { key: "exchanges", icon: "⇄", label: "Exchanges", hint: "Conectar plataformas de compra, venta o transferencia." },
      { key: "wallets", icon: "◈", label: "Wallets", hint: "Conectar direcciones y movimientos on-chain." },
      { key: "documentacion", icon: "📄", label: "Documentación", hint: "Cargar PDF o Excel." },
    ],
  },
  activos: {
    key: "activos",
    title: "Activos",
    question: "Indica criptoactivos, NFTs, wallets frías o exchanges",
    guide: "Estás en Activos. Puedes decir o escribir criptoactivos, NFTs, wallets frías o exchanges. LEDGERA abrirá la opción que corresponda.",
    options: [
      { key: "criptoactivos", icon: "₿", label: "Criptoactivos", hint: "Registrar activos digitales." },
      { key: "nfts", icon: "◇", label: "NFTs", hint: "Registrar colecciones u operaciones NFT." },
      { key: "wallets-frias", icon: "▣", label: "Wallets Frías", hint: "Registrar Ledger, Trezor u otra autocustodia." },
      { key: "exchanges", icon: "⇄", label: "Exchanges", hint: "Registrar saldos o custodia en plataformas." },
    ],
  },
};

function resolveIntent(text: string, activeStep: WealthStepKey): OptionKey | null {
  const clean = text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  if (activeStep === "origen-fondos") {
    if (/banco|bancos|cuenta|cartola|transferencia/.test(clean)) return "bancos";
    if (/exchange|exchanges|binance|coinbase|buda|plataforma/.test(clean)) return "exchanges";
    if (/wallet|wallets|direccion|on.?chain|transaccion|autocustodia/.test(clean)) return "wallets";
    if (/document|pdf|excel|archivo|xls|xlsx/.test(clean)) return "documentacion";
  }
  if (/cripto|crypto|bitcoin|btc|ethereum|eth|token|tokens/.test(clean)) return "criptoactivos";
  if (/nft|nfts|coleccion/.test(clean)) return "nfts";
  if (/wallet fria|wallets frias|ledger|trezor|coldcard|tangem/.test(clean)) return "wallets-frias";
  if (/exchange|exchanges|binance|coinbase|buda/.test(clean)) return "exchanges";
  return null;
}

export function WealthFlowPage({ activeStep }: { activeStep: WealthStepKey }) {
  const router = useRouter();
  const stopListeningRef = useRef<(() => void) | null>(null);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<OptionKey | null>(null);
  const [listening, setListening] = useState(false);
  const step = STEPS[activeStep];
  const selectedOption = step.options.find((option) => option.key === selected) ?? null;

  useEffect(() => {
    void speakResponse(step.guide);
    return () => {
      stopSpeaking();
      stopListeningRef.current?.();
    };
  }, [step.guide]);

  function openOption(option: FlowOption, mode: "manual" | "auto") {
    stopSpeaking();
    stopListeningRef.current?.();
    setListening(false);
    setSelected(option.key);
    setQuery(option.label);
    if (mode === "auto") {
      void speakResponse(`Abrí ${option.label}. Puedes continuar con los datos o escribir más detalles.`);
    }
  }

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const clean = query.trim();
    if (!clean) return;
    const intent = resolveIntent(clean, activeStep);
    const option = step.options.find((item) => item.key === intent);
    if (option) {
      openOption(option, "auto");
      return;
    }
    router.push(`/panel?q=${encodeURIComponent(clean)}&scope=wealth-flow&step=${activeStep}`);
  }

  function toggleMic() {
    if (listening) {
      stopListeningRef.current?.();
      setListening(false);
      return;
    }
    stopSpeaking();
    const stop = startListening({
      onResult: ({ transcript, final }) => {
        setQuery(transcript);
        if (!final) return;
        const intent = resolveIntent(transcript, activeStep);
        const option = step.options.find((item) => item.key === intent);
        if (option) openOption(option, "auto");
      },
      onStateChange: (state) => {
        setListening(state === "listening");
      },
      onError: () => setListening(false),
    });
    if (stop) {
      stopListeningRef.current = stop;
      setListening(true);
    }
  }

  return (
    <main style={{ display: "grid", gap: 14, minHeight: "calc(100vh - 160px)", gridTemplateRows: "auto auto 1fr auto" }}>
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div>
          <p style={{ color: "#0F766E", fontSize: 11, fontWeight: 850, letterSpacing: "0.08em", margin: "0 0 4px", textTransform: "uppercase", fontFamily: fonts.body }}>Mi Patrimonio</p>
          <h1 style={{ color: "#0F2A3D", fontSize: "clamp(1.35rem, 2.4vw, 1.85rem)", fontWeight: 850, margin: 0, letterSpacing: "-0.025em", fontFamily: fonts.display }}>{step.title}</h1>
        </div>
      </header>

      <section style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "stretch" }}>
        {step.options.map((option) => {
          const active = selected === option.key;
          return (
            <button
              key={option.key}
              type="button"
              onClick={() => openOption(option, "manual")}
              style={{
                minWidth: 150,
                flex: "1 1 150px",
                minHeight: 92,
                borderRadius: 18,
                border: active ? "1px solid rgba(74,222,128,0.55)" : "1px solid #E2E8F0",
                background: active ? "#071B28" : "#FFFFFF",
                color: active ? "#F8FAFC" : "#0F2A3D",
                cursor: "pointer",
                display: "grid",
                placeItems: "center",
                gap: 7,
                fontFamily: fonts.body,
              }}
            >
              <span style={{ fontSize: 28, lineHeight: 1 }}>{option.icon}</span>
              <strong style={{ fontSize: 15, fontWeight: 850 }}>{option.label}</strong>
            </button>
          );
        })}
      </section>

      <section style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 16, padding: "14px 16px", minHeight: 72 }}>
        <p style={{ margin: 0, color: "#475569", fontSize: 13, lineHeight: 1.55, fontFamily: fonts.body }}>
          {selectedOption ? selectedOption.hint : "Elige una opción manualmente o dilo por voz. LEDGERA reconocerá la intención y abrirá la opción correspondiente."}
        </p>
      </section>

      <section style={{ background: "#071B28", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 18, padding: "14px 16px" }}>
        <form onSubmit={submit} style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={step.question} style={{ flex: 1, minHeight: 44, borderRadius: 12, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.05)", color: "#F8FAFC", padding: "0 14px", fontSize: 14, outline: "none", fontFamily: fonts.body }} />
          <button type="button" onClick={toggleMic} style={{ width: 44, height: 44, borderRadius: 12, border: "1px solid rgba(255,255,255,0.12)", background: listening ? "rgba(22,163,74,0.22)" : "rgba(255,255,255,0.05)", color: listening ? "#4ADE80" : "#CBD5E1", cursor: "pointer" }}>{listening ? "■" : "🎙"}</button>
          <button type="submit" style={{ minHeight: 44, borderRadius: 12, border: "none", background: "#16A34A", color: "#FFFFFF", padding: "0 16px", fontWeight: 850, cursor: "pointer", fontFamily: fonts.body }}>Abrir</button>
        </form>
      </section>
    </main>
  );
}
