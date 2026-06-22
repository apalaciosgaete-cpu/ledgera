"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { fonts } from "@/styles/tokens";
import { speakResponse, stopSpeaking } from "@/modules/voice/textToSpeech";
import { startListening } from "@/modules/voice/speechToText";

type WealthStepKey = "origen-fondos" | "activos";
type OptionKey = "bancos" | "exchanges" | "wallets" | "documentacion" | "criptoactivos" | "nfts" | "wallets-frias";
type AssistantStatus = "idle" | "listening" | "thinking" | "speaking";
type FlowOption = { key: OptionKey; icon: string; label: string; hint: string; accent: string; bg: string; border: string };

const OPTIONS: Record<WealthStepKey, FlowOption[]> = {
  "origen-fondos": [
    { key: "bancos", icon: "🏦", label: "Bancos", hint: "Abrí Bancos. Ingresa cuenta, banco o movimiento.", accent: "#6D4AFF", bg: "#FBFAFF", border: "#E6E0FF" },
    { key: "exchanges", icon: "📊", label: "Exchanges", hint: "Abrí Exchanges. Indica plataforma o movimiento.", accent: "#20C878", bg: "#F8FFFB", border: "#D9F5E8" },
    { key: "wallets", icon: "💳", label: "Wallets", hint: "Abrí Wallets. Indica dirección o movimiento on-chain.", accent: "#2483FF", bg: "#F8FBFF", border: "#DCEBFF" },
    { key: "documentacion", icon: "📄", label: "Documentación", hint: "Abrí Documentación. Puedes cargar PDF o Excel.", accent: "#FF7A1A", bg: "#FFFBF6", border: "#FFE8D6" },
  ],
  activos: [
    { key: "criptoactivos", icon: "₿", label: "Criptoactivos", hint: "Abrí Criptoactivos. Indica activo o cantidad.", accent: "#2483FF", bg: "#F8FBFF", border: "#DCEBFF" },
    { key: "nfts", icon: "◇", label: "NFTs", hint: "Abrí NFTs. Indica colección u operación.", accent: "#6D4AFF", bg: "#FBFAFF", border: "#E6E0FF" },
    { key: "wallets-frias", icon: "💳", label: "Wallets Frías", hint: "Abrí Wallets Frías. Indica dispositivo o activos.", accent: "#20C878", bg: "#F8FFFB", border: "#D9F5E8" },
    { key: "exchanges", icon: "📊", label: "Exchanges", hint: "Abrí Exchanges. Indica plataforma o saldo.", accent: "#FF7A1A", bg: "#FFFBF6", border: "#FFE8D6" },
  ],
};

const STEP_COPY: Record<WealthStepKey, { title: string; subtitle: string; guide: string; examples: string[] }> = {
  "origen-fondos": {
    title: "Origen de Fondos",
    subtitle: "Selecciona o indica cómo ingresaron tus fondos. Puedes hablar o escribir.",
    guide: "Estás en Origen de Fondos. Puedes decir conectar banco, agregar exchange, mis wallets o subir documentos. LEDGERA abrirá la opción correcta.",
    examples: ["conectar banco", "agregar exchange Binance", "mis wallets", "subir documentos"],
  },
  activos: {
    title: "Activos",
    subtitle: "Selecciona o indica qué activo o custodia necesitas ordenar.",
    guide: "Estás en Activos. Puedes decir criptoactivos, NFTs, wallets frías o exchanges. LEDGERA abrirá la opción correcta.",
    examples: ["tengo BTC", "tengo NFTs", "uso wallet fría", "activos en exchange"],
  },
};

function resolveIntent(text: string, step: WealthStepKey): OptionKey | null {
  const clean = text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  if (step === "origen-fondos") {
    if (/banco|cuenta|cartola|deposito|transferencia/.test(clean)) return "bancos";
    if (/exchange|binance|coinbase|buda|plataforma/.test(clean)) return "exchanges";
    if (/wallet|direccion|on.?chain|transaccion|autocustodia/.test(clean)) return "wallets";
    if (/document|pdf|excel|archivo|xls|xlsx|subir/.test(clean)) return "documentacion";
  }
  if (/cripto|crypto|bitcoin|btc|ethereum|eth|token/.test(clean)) return "criptoactivos";
  if (/nft|coleccion/.test(clean)) return "nfts";
  if (/wallet fria|ledger|trezor|coldcard|tangem/.test(clean)) return "wallets-frias";
  if (/exchange|binance|coinbase|buda/.test(clean)) return "exchanges";
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
  const copy = STEP_COPY[activeStep];
  const options = OPTIONS[activeStep];
  const selectedOption = options.find((item) => item.key === selected);
  const activeVoice = status === "listening" || status === "speaking";

  useEffect(() => {
    setStatus("speaking");
    void speakResponse(copy.guide).finally(() => setStatus("idle"));
    return () => { stopSpeaking(); stopListeningRef.current?.(); };
  }, [copy.guide]);

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
    const option = options.find((item) => item.key === resolveIntent(clean, activeStep));
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
        const option = options.find((item) => item.key === resolveIntent(transcript, activeStep));
        if (option) openOption(option, "auto");
      },
      onStateChange: (state) => setStatus(state === "listening" ? "listening" : "idle"),
      onError: () => setStatus("idle"),
    });
    if (stop) { stopListeningRef.current = stop; setStatus("listening"); }
  }

  return (
    <main style={{ minHeight: "calc(100vh - 160px)", display: "grid", gap: 24 }}>
      <section style={{ display: "flex", gap: 11, alignItems: "center", color: "#64748B", fontSize: 15, fontWeight: 700, fontFamily: fonts.body }}>
        <span>⌂</span><span>›</span><span>Mi Patrimonio</span><span>›</span><span style={{ color: "#5B35F5" }}>{copy.title}</span>
      </section>

      <section>
        <h1 style={{ color: "#0F2A3D", fontSize: "clamp(2rem,3.5vw,2.45rem)", fontWeight: 900, margin: "0 0 8px", letterSpacing: "-0.04em", fontFamily: fonts.display }}>{copy.title}</h1>
        <p style={{ color: "#334155", fontSize: 16, lineHeight: 1.5, margin: 0, fontFamily: fonts.body }}>{copy.subtitle}</p>
      </section>

      <section style={{ display: "grid", gap: 18, gridTemplateColumns: "repeat(4,minmax(0,1fr))" }}>
        {options.map((option) => {
          const active = selected === option.key;
          return (
            <button key={option.key} type="button" onClick={() => openOption(option, "manual")} style={{ minHeight: 150, borderRadius: 20, border: `1px solid ${active ? option.accent : option.border}`, background: option.bg, color: "#0F2A3D", cursor: "pointer", display: "grid", gridTemplateColumns: "74px 1fr 44px", alignItems: "center", gap: 14, padding: "18px 22px", boxShadow: active ? `0 12px 24px ${option.accent}22` : "0 12px 26px rgba(15,42,61,0.045)", fontFamily: fonts.body, textAlign: "left" }}>
              <span style={{ fontSize: 54, lineHeight: 1 }}>{option.icon}</span>
              <strong style={{ fontSize: 17, fontWeight: 900 }}>{option.label}</strong>
              <span style={{ width: 42, height: 42, borderRadius: 999, background: "#FFFFFF", color: option.accent, display: "grid", placeItems: "center", fontSize: 24, fontWeight: 900, boxShadow: "0 8px 17px rgba(15,42,61,0.10)" }}>→</span>
            </button>
          );
        })}
      </section>

      <section style={{ border: "1px solid #DDD6FE", borderRadius: 24, background: "#FFFFFF", padding: 22, display: "grid", gridTemplateColumns: "minmax(300px,.9fr) minmax(380px,1.2fr)", gap: 24, alignItems: "center", boxShadow: "0 18px 40px rgba(109,74,255,0.06)" }}>
        <div style={{ display: "flex", gap: 18, alignItems: "center", minWidth: 0 }}>
          <div style={{ width: 82, height: 82, borderRadius: 999, padding: 8, border: activeVoice ? "2px solid #A78BFA" : "2px solid #DDD6FE", display: "grid", placeItems: "center", flexShrink: 0, boxShadow: activeVoice ? "0 0 0 8px rgba(124,58,237,0.08)" : "none" }}>
            <div style={{ width: 58, height: 58, borderRadius: 999, background: "#5B35F5", color: "#FFFFFF", display: "grid", placeItems: "center", fontSize: 25, boxShadow: "0 16px 30px rgba(79,70,229,0.28)" }}>≋</div>
          </div>
          <div style={{ minWidth: 0 }}>
            <strong style={{ display: "block", color: "#5B35F5", fontSize: 17, fontWeight: 900, marginBottom: 8, fontFamily: fonts.body }}>{statusCopy(status)}</strong>
            <p style={{ margin: 0, color: "#475569", fontSize: 14, lineHeight: 1.45, fontFamily: fonts.body }}>{selectedOption ? selectedOption.hint : `Puedes decir o escribir algo como: ${copy.examples.join(", ")}.`}</p>
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 14 }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 7, border: "1px solid #E2E8F0", borderRadius: 999, padding: "6px 12px", color: "#0F2A3D", fontSize: 13, background: "#FFFFFF" }}><span style={{ width: 9, height: 9, borderRadius: 999, background: "#20C878" }} />{status === "listening" ? "Escuchando..." : status === "speaking" ? "Hablando..." : "Listo"}</span>
              <span style={{ color: activeVoice ? "#5B35F5" : "#A78BFA", fontWeight: 900, letterSpacing: 2 }}>▁▃▆▃▁▂▅▂▁</span>
            </div>
          </div>
        </div>

        <form onSubmit={submit} style={{ display: "grid", gap: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ flex: 1, minHeight: 58, borderRadius: 18, border: "1px solid #CBD5E1", background: "#FFFFFF", display: "flex", alignItems: "center", padding: "0 12px 0 18px", gap: 10, minWidth: 0, boxShadow: "0 8px 18px rgba(15,42,61,0.04)" }}>
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Habla o escribe aquí..." style={{ flex: 1, border: "none", outline: "none", color: "#0F2A3D", fontSize: 16, fontFamily: fonts.body, minWidth: 0 }} />
              <button type="button" onClick={toggleMic} style={{ border: "none", background: "transparent", color: status === "listening" ? "#5B35F5" : "#64748B", cursor: "pointer", fontSize: 26 }}>{status === "listening" ? "■" : "🎙"}</button>
            </div>
            <button type="submit" style={{ width: 58, height: 58, borderRadius: 999, border: "none", background: "#7C3AED", color: "#FFFFFF", fontSize: 28, fontWeight: 900, cursor: "pointer", flexShrink: 0, boxShadow: "0 12px 24px rgba(124,58,237,0.25)" }}>↑</button>
          </div>
          <p style={{ margin: 0, color: "#64748B", fontSize: 13, fontFamily: fonts.body }}>Al interactuar manualmente, se pausará la escucha por voz.</p>
        </form>
      </section>
    </main>
  );
}
