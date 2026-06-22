"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { fonts } from "@/styles/tokens";
import { speakResponse, stopSpeaking } from "@/modules/voice/textToSpeech";
import { startListening } from "@/modules/voice/speechToText";
import { VoiceOrb } from "@/components/voice/VoiceOrb";
import type { VoiceEngineState } from "@/modules/voice/voiceEngine";

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

  // Mapea estado local al compatible con VoiceOrb
  function orbState(): VoiceEngineState | "listening" {
    if (status === "speaking") return "playing";
    if (status === "listening") return "listening";
    return "idle";
  }

  return (
    <main style={{ height: "calc(100vh - 160px)", overflow: "hidden", display: "grid", gap: 14, gridTemplateRows: "auto 110px 1fr" }}>
      <section>
        <h1 style={{ color: "#0F2A3D", fontSize: "clamp(1.65rem,3vw,2.05rem)", fontWeight: 900, margin: "0 0 4px", letterSpacing: "-0.04em", fontFamily: fonts.display }}>{copy.title}</h1>
        <p style={{ color: "#334155", fontSize: 14, lineHeight: 1.35, margin: 0, fontFamily: fonts.body }}>{copy.subtitle}</p>
      </section>

      {/* Cards: icono centrado arriba, nombre centrado, sin flecha */}
      <section style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(4,minmax(0,1fr))" }}>
        {options.map((option) => {
          const active = selected === option.key;
          return (
            <button key={option.key} type="button" onClick={() => openOption(option, "manual")} style={{ height: 110, borderRadius: 18, border: `1px solid ${active ? option.accent : option.border}`, background: option.bg, color: "#0F2A3D", cursor: "pointer", display: "grid", gap: 6, padding: "12px 10px", justifyItems: "center", alignItems: "center", alignContent: "center", boxShadow: active ? `0 8px 18px ${option.accent}20` : "0 8px 16px rgba(15,42,61,0.04)", fontFamily: fonts.body, textAlign: "center" }}>
              <span style={{ fontSize: 36, lineHeight: 1 }}>{option.icon}</span>
              <strong style={{ fontSize: 14, fontWeight: 900 }}>{option.label}</strong>
            </button>
          );
        })}
      </section>

      {/* Panel LEDGERA con VoiceOrb e input integrado */}
      <section style={{ alignSelf: "end", border: "1px solid #DDD6FE", borderRadius: 20, background: "#FFFFFF", padding: 12, display: "grid", gridTemplateColumns: "minmax(260px,.85fr) minmax(320px,1.15fr)", gap: 14, alignItems: "center", boxShadow: "0 12px 28px rgba(109,74,255,0.05)" }}>
        <div style={{ display: "flex", gap: 12, alignItems: "center", minWidth: 0 }}>
          <div style={{ flexShrink: 0 }}>
            <div style={{ width: 56, height: 56, display: "grid", placeItems: "center" }}>
              <div style={{ width: 52, height: 52, overflow: "hidden", borderRadius: 999 }}>
                <VoiceOrb state={orbState()} />
              </div>
            </div>
          </div>
          <div style={{ minWidth: 0 }}>
            <strong style={{ display: "block", color: activeVoice ? "#5B35F5" : "#475569", fontSize: 15, fontWeight: 900, marginBottom: 4, fontFamily: fonts.body, transition: "color 0.3s" }}>{statusCopy(status)}</strong>
            <p style={{ margin: 0, color: "#475569", fontSize: 12.5, lineHeight: 1.28, fontFamily: fonts.body, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{selectedOption ? selectedOption.hint : `Puedes decir: ${copy.examples.join(", ")}.`}</p>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 8 }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6, border: "1px solid #E2E8F0", borderRadius: 999, padding: "4px 9px", color: "#0F2A3D", fontSize: 12, background: "#FFFFFF" }}>
                <span style={{ width: 8, height: 8, borderRadius: 999, background: status === "listening" || status === "speaking" ? "#20C878" : "#94A3B8", transition: "background 0.3s" }} />
                {status === "listening" ? "Escuchando..." : status === "speaking" ? "Hablando..." : "Listo"}
              </span>
              {activeVoice && (
                <span style={{ color: status === "speaking" ? "#5B35F5" : "#A78BFA", fontWeight: 900, letterSpacing: 1, fontSize: 12, transition: "color 0.3s" }}>
                  ▁▃▆▃▁▂▅▂▁
                </span>
              )}
            </div>
          </div>
        </div>

        <form onSubmit={submit}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ flex: 1, minHeight: 46, borderRadius: 15, border: "1px solid #CBD5E1", background: "#FFFFFF", display: "flex", alignItems: "center", padding: "0 6px 0 14px", gap: 6, minWidth: 0, boxShadow: "0 6px 14px rgba(15,42,61,0.035)" }}>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Habla o escribe aquí..."
                style={{ flex: 1, border: "none", outline: "none", color: "#0F2A3D", fontSize: 14, fontFamily: fonts.body, minWidth: 0, background: "transparent" }}
              />
              <button
                type="button"
                onClick={toggleMic}
                style={{ width: 36, height: 36, borderRadius: 10, border: "none", background: status === "listening" ? "rgba(91,53,245,0.12)" : "transparent", color: status === "listening" ? "#5B35F5" : "#64748B", cursor: "pointer", fontSize: 20, display: "grid", placeItems: "center", flexShrink: 0 }}
              >
                {status === "listening" ? "■" : "🎙"}
              </button>
              <button
                type="submit"
                style={{ width: 40, height: 40, borderRadius: 10, border: "none", background: "#7C3AED", color: "#FFFFFF", fontSize: 18, fontWeight: 900, cursor: "pointer", flexShrink: 0, display: "grid", placeItems: "center" }}
              >
                →
              </button>
            </div>
          </div>
        </form>
      </section>
    </main>
  );
}
