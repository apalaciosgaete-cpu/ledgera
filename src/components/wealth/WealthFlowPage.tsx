"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { fonts } from "@/styles/tokens";
import { speakResponse, stopSpeaking } from "@/modules/voice/textToSpeech";
import { startListening } from "@/modules/voice/speechToText";

type WealthStepKey = "origen-fondos" | "activos";
type OptionKey = "bancos" | "exchanges" | "wallets" | "documentacion" | "criptoactivos" | "nfts" | "wallets-frias";
type AssistantStatus = "idle" | "listening" | "thinking" | "speaking";

type FlowOption = { key: OptionKey; icon: string; label: string; description: string; hint: string; tone: { border: string; bg: string; accent: string; shadow: string } };
type WealthStep = { key: WealthStepKey; title: string; subtitle: string; question: string; guide: string; examples: string[]; options: FlowOption[] };

const tones = {
  blue: { border: "#DCEBFF", bg: "linear-gradient(180deg,#F3FAFF 0%,#FFFFFF 100%)", accent: "#2483FF", shadow: "0 12px 28px rgba(36,131,255,0.10)" },
  green: { border: "#D9F5E8", bg: "linear-gradient(180deg,#F2FFF8 0%,#FFFFFF 100%)", accent: "#20C878", shadow: "0 12px 28px rgba(32,200,120,0.10)" },
  purple: { border: "#E6E0FF", bg: "linear-gradient(180deg,#F8F5FF 0%,#FFFFFF 100%)", accent: "#6D4AFF", shadow: "0 12px 28px rgba(109,74,255,0.10)" },
  orange: { border: "#FFE8D6", bg: "linear-gradient(180deg,#FFF8EF 0%,#FFFFFF 100%)", accent: "#FF7A1A", shadow: "0 12px 28px rgba(255,122,26,0.10)" },
};

const STEPS: Record<WealthStepKey, WealthStep> = {
  "origen-fondos": {
    key: "origen-fondos",
    title: "Origen de Fondos",
    subtitle: "Selecciona o indica cómo ingresaron tus fondos. Puedes hablar o escribir.",
    question: "Habla o escribe aquí...",
    guide: "Estás en Origen de Fondos. Puedes decir conectar banco, agregar exchange, mis wallets o subir documentos. LEDGERA abrirá la opción correcta.",
    examples: ["conectar banco", "agregar exchange Binance", "mis wallets", "subir documentos"],
    options: [
      { key: "bancos", icon: "🏦", label: "Bancos", description: "Cuentas bancarias, transferencias y depósitos.", hint: "Abrí Bancos. Ingresa la cuenta, banco o movimiento que quieres respaldar.", tone: tones.blue },
      { key: "exchanges", icon: "🔁", label: "Exchanges", description: "Plataformas de intercambio de criptomonedas.", hint: "Abrí Exchanges. Indica la plataforma o movimiento que quieres conectar.", tone: tones.green },
      { key: "wallets", icon: "👛", label: "Wallets", description: "Billeteras de criptomonedas y autocustodia.", hint: "Abrí Wallets. Indica dirección, wallet o movimiento on-chain.", tone: tones.purple },
      { key: "documentacion", icon: "📄", label: "Documentación", description: "Sube tus archivos en PDF o Excel como respaldo.", hint: "Abrí Documentación. Puedes cargar PDF o Excel como respaldo.", tone: tones.orange },
    ],
  },
  activos: {
    key: "activos",
    title: "Activos",
    subtitle: "Selecciona o indica qué activo o custodia necesitas ordenar.",
    question: "Habla o escribe aquí...",
    guide: "Estás en Activos. Puedes decir criptoactivos, NFTs, wallets frías o exchanges. LEDGERA abrirá la opción correcta.",
    examples: ["tengo BTC", "tengo NFTs", "uso wallet fría", "activos en exchange"],
    options: [
      { key: "criptoactivos", icon: "₿", label: "Criptoactivos", description: "BTC, ETH, SOL y otros tokens digitales.", hint: "Abrí Criptoactivos. Indica el activo, cantidad o plataforma asociada.", tone: tones.blue },
      { key: "nfts", icon: "◇", label: "NFTs", description: "Colecciones, compras, ventas y wallets asociadas.", hint: "Abrí NFTs. Indica colección, wallet u operación relacionada.", tone: tones.purple },
      { key: "wallets-frias", icon: "▣", label: "Wallets Frías", description: "Ledger, Trezor, Coldcard, Tangem u otra autocustodia.", hint: "Abrí Wallets Frías. Indica dispositivo o activos custodiados.", tone: tones.green },
      { key: "exchanges", icon: "🔁", label: "Exchanges", description: "Saldos o posiciones activas en plataformas.", hint: "Abrí Exchanges. Indica plataforma, saldo o movimiento activo.", tone: tones.orange },
    ],
  },
};

function resolveIntent(text: string, activeStep: WealthStepKey): OptionKey | null {
  const clean = text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  if (activeStep === "origen-fondos") {
    if (/banco|bancos|cuenta|cartola|deposito|transferencia/.test(clean)) return "bancos";
    if (/exchange|exchanges|binance|coinbase|buda|plataforma/.test(clean)) return "exchanges";
    if (/wallet|wallets|direccion|on.?chain|transaccion|autocustodia/.test(clean)) return "wallets";
    if (/document|pdf|excel|archivo|xls|xlsx|subir/.test(clean)) return "documentacion";
  }
  if (/cripto|crypto|bitcoin|btc|ethereum|eth|token|tokens/.test(clean)) return "criptoactivos";
  if (/nft|nfts|coleccion/.test(clean)) return "nfts";
  if (/wallet fria|wallets frias|ledger|trezor|coldcard|tangem/.test(clean)) return "wallets-frias";
  if (/exchange|exchanges|binance|coinbase|buda/.test(clean)) return "exchanges";
  return null;
}

function statusCopy(status: AssistantStatus) {
  if (status === "listening") return "Escuchando...";
  if (status === "thinking") return "Analizando...";
  if (status === "speaking") return "Hablando...";
  return "LEDGERA te escucha";
}

export function WealthFlowPage({ activeStep }: { activeStep: WealthStepKey }) {
  const router = useRouter();
  const stopListeningRef = useRef<(() => void) | null>(null);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<OptionKey | null>(null);
  const [status, setStatus] = useState<AssistantStatus>("idle");
  const step = STEPS[activeStep];
  const selectedOption = step.options.find((option) => option.key === selected) ?? null;

  useEffect(() => {
    setStatus("speaking");
    void speakResponse(step.guide).finally(() => setStatus("idle"));
    return () => { stopSpeaking(); stopListeningRef.current?.(); };
  }, [step.guide]);

  function openOption(option: FlowOption, mode: "manual" | "auto") {
    stopSpeaking();
    stopListeningRef.current?.();
    setSelected(option.key);
    setQuery(option.label);
    setStatus("idle");
    if (mode === "auto") {
      setStatus("speaking");
      void speakResponse(option.hint).finally(() => setStatus("idle"));
    }
  }

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const clean = query.trim();
    if (!clean) return;
    setStatus("thinking");
    const intent = resolveIntent(clean, activeStep);
    const option = step.options.find((item) => item.key === intent);
    if (option) { openOption(option, "auto"); return; }
    router.push(`/panel?q=${encodeURIComponent(clean)}&scope=wealth-flow&step=${activeStep}`);
  }

  function toggleMic() {
    if (status === "listening") { stopListeningRef.current?.(); setStatus("idle"); return; }
    stopSpeaking();
    const stop = startListening({
      onResult: ({ transcript, final }) => {
        setQuery(transcript);
        if (!final) return;
        setStatus("thinking");
        const intent = resolveIntent(transcript, activeStep);
        const option = step.options.find((item) => item.key === intent);
        if (option) openOption(option, "auto");
      },
      onStateChange: (state) => setStatus(state === "listening" ? "listening" : "idle"),
      onError: () => setStatus("idle"),
    });
    if (stop) { stopListeningRef.current = stop; setStatus("listening"); }
  }

  return (
    <main style={{ minHeight: "calc(100vh - 160px)", display: "grid", gap: 14, gridTemplateRows: "auto auto minmax(0,1fr) auto" }}>
      <section style={{ display: "flex", alignItems: "center", gap: 9, color: "#64748B", fontSize: 13, fontWeight: 700, fontFamily: fonts.body }}>
        <span>⌂</span><span>›</span><span>Mi Patrimonio</span><span>›</span><span style={{ color: "#4F46E5" }}>{step.title}</span>
      </section>

      <section style={{ display: "flex", justifyContent: "space-between", gap: 14, alignItems: "flex-start", flexWrap: "wrap" }}>
        <div>
          <h1 style={{ color: "#0F2A3D", fontSize: "clamp(1.55rem, 3vw, 2.05rem)", fontWeight: 900, margin: "0 0 4px", letterSpacing: "-0.04em", fontFamily: fonts.display }}>{step.title}</h1>
          <p style={{ color: "#334155", fontSize: 14, lineHeight: 1.4, margin: 0, fontFamily: fonts.body }}>{step.subtitle}</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button type="button" style={{ border: "1px solid #E2E8F0", borderRadius: 11, background: "#FFFFFF", color: "#0F2A3D", padding: "8px 13px", fontWeight: 750, fontSize: 13, fontFamily: fonts.body }}>ⓘ Ayuda</button>
          <button type="button" style={{ border: "1px solid #E2E8F0", borderRadius: 11, background: "#FFFFFF", color: "#0F2A3D", padding: "8px 13px", fontWeight: 750, fontSize: 13, fontFamily: fonts.body }}>↺ Historial</button>
        </div>
      </section>

      <section style={{ display: "grid", gap: 14, gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", alignContent: "start" }}>
        {step.options.map((option) => {
          const active = selected === option.key;
          return (
            <button key={option.key} type="button" onClick={() => openOption(option, "manual")} style={{ minHeight: 188, borderRadius: 22, border: `1px solid ${active ? option.tone.accent : option.tone.border}`, background: option.tone.bg, color: "#0F2A3D", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 9, padding: 16, boxShadow: active ? option.tone.shadow : "0 8px 20px rgba(15,42,61,0.045)", fontFamily: fonts.body }}>
              <span style={{ fontSize: 46, lineHeight: 1, filter: "drop-shadow(0 8px 10px rgba(15,42,61,0.10))" }}>{option.icon}</span>
              <strong style={{ fontSize: 19, fontWeight: 900 }}>{option.label}</strong>
              <span style={{ color: "#334155", fontSize: 12.5, lineHeight: 1.35, maxWidth: 190 }}>{option.description}</span>
              <span style={{ width: 38, height: 38, borderRadius: 999, background: "#FFFFFF", color: option.tone.accent, display: "grid", placeItems: "center", fontSize: 22, fontWeight: 900, boxShadow: "0 7px 16px rgba(15,42,61,0.10)" }}>→</span>
            </button>
          );
        })}
      </section>

      <section style={{ border: "1px solid #E2E8F0", borderRadius: 20, background: "#FFFFFF", padding: 16, display: "grid", gridTemplateColumns: "minmax(210px, 0.75fr) minmax(280px, 1.35fr)", gap: 16, alignItems: "center" }}>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <div style={{ width: 54, height: 54, borderRadius: 999, background: "linear-gradient(135deg,#4F46E5,#7C3AED)", color: "#FFFFFF", display: "grid", placeItems: "center", fontSize: 22, boxShadow: "0 12px 22px rgba(79,70,229,0.22)" }}>▮▮</div>
          <div>
            <strong style={{ display: "block", color: "#4F46E5", fontSize: 15, fontWeight: 900, marginBottom: 4, fontFamily: fonts.body }}>{statusCopy(status)}</strong>
            <p style={{ margin: 0, color: "#475569", fontSize: 12.5, lineHeight: 1.35, fontFamily: fonts.body }}>{selectedOption ? selectedOption.hint : `Puedes decir: ${step.examples.map((item) => `“${item}”`).join(", ")}.`}</p>
          </div>
        </div>

        <form onSubmit={submit} style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ flex: 1, minHeight: 50, borderRadius: 16, border: "1px solid #CBD5E1", display: "flex", alignItems: "center", padding: "0 10px 0 15px", gap: 8 }}>
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={step.question} style={{ flex: 1, border: "none", outline: "none", color: "#0F2A3D", fontSize: 15, fontFamily: fonts.body }} />
            <button type="button" onClick={toggleMic} style={{ border: "none", background: "transparent", color: status === "listening" ? "#4F46E5" : "#64748B", cursor: "pointer", fontSize: 22 }}>{status === "listening" ? "■" : "🎙"}</button>
          </div>
          <button type="submit" style={{ width: 50, height: 50, borderRadius: 999, border: "none", background: "linear-gradient(135deg,#7C3AED,#8B5CF6)", color: "#FFFFFF", fontSize: 24, fontWeight: 900, cursor: "pointer" }}>↑</button>
        </form>
      </section>
    </main>
  );
}
