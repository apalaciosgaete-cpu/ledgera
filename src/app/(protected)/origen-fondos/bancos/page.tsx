"use client";

import { useEffect, useRef, useState } from "react";
import { fonts } from "@/styles/tokens";
import { speakResponse, stopSpeaking } from "@/modules/voice/textToSpeech";
import { startListening } from "@/modules/voice/speechToText";
import { VoiceOrb } from "@/components/voice/VoiceOrb";
import type { VoiceEngineState } from "@/modules/voice/voiceEngine";

type AssistantStatus = "idle" | "listening" | "speaking";

type ChileBank = {
  id: string;
  name: string;
  logoUrl: string;
  url: string;
};

const CHILE_BANKS: ChileBank[] = [
  { id: "banco-chile", name: "Banco de Chile", logoUrl: "https://www.bancochile.cl/favicon.ico", url: "https://www.bancochile.cl" },
  { id: "bancoestado", name: "BancoEstado", logoUrl: "https://www.bancoestado.cl/favicon.ico", url: "https://www.bancoestado.cl" },
  { id: "santander", name: "Santander", logoUrl: "https://www.santander.cl/favicon.ico", url: "https://www.santander.cl" },
  { id: "bci", name: "BCI", logoUrl: "https://www.bci.cl/favicon.ico", url: "https://www.bci.cl" },
  { id: "itau", name: "Itaú", logoUrl: "https://www.itau.cl/favicon.ico", url: "https://www.itau.cl" },
  { id: "scotiabank", name: "Scotiabank", logoUrl: "https://www.scotiabankchile.cl/favicon.ico", url: "https://www.scotiabankchile.cl" },
  { id: "falabella", name: "Banco Falabella", logoUrl: "https://www.bancofalabella.cl/favicon.ico", url: "https://www.bancofalabella.cl" },
  { id: "security", name: "Banco Security", logoUrl: "https://www.bancosecurity.cl/favicon.ico", url: "https://www.bancosecurity.cl" },
  { id: "bice", name: "Banco BICE", logoUrl: "https://www.bice.cl/favicon.ico", url: "https://www.bice.cl" },
  { id: "consorcio", name: "Banco Consorcio", logoUrl: "https://www.bancoconsorcio.cl/favicon.ico", url: "https://www.bancoconsorcio.cl" },
  { id: "internacional", name: "Banco Internacional", logoUrl: "https://www.bancointernacional.cl/favicon.ico", url: "https://www.bancointernacional.cl" },
  { id: "ripley", name: "Banco Ripley", logoUrl: "https://www.bancoripley.cl/favicon.ico", url: "https://www.bancoripley.cl" },
  { id: "hsbc", name: "HSBC Chile", logoUrl: "https://www.hsbc.cl/favicon.ico", url: "https://www.hsbc.cl" },
  { id: "btg-pactual", name: "Banco BTG Pactual Chile", logoUrl: "https://www.btgpactual.cl/favicon.ico", url: "https://www.btgpactual.cl" },
  { id: "jp-morgan", name: "JP Morgan", logoUrl: "https://www.jpmorgan.com/favicon.ico", url: "https://www.jpmorgan.com/CL/en/about-us" },
  { id: "do-brasil", name: "Banco do Brasil", logoUrl: "https://www.bb.com.br/favicon.ico", url: "https://www.bb.com.br" },
  { id: "nacion-argentina", name: "Banco de la Nación Argentina", logoUrl: "https://www.bna.com.ar/favicon.ico", url: "https://www.bna.com.ar" },
];

function statusCopy(status: AssistantStatus) {
  if (status === "listening") return "Escuchando...";
  if (status === "speaking") return "Hablando...";
  return "LEDGERA te escucha";
}

export default function BancosOrigenFondosPage() {
  const stopListeningRef = useRef<(() => void) | null>(null);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<AssistantStatus>("idle");

  const guide = "Estás en Bancos de Chile. Selecciona el banco que quieres conectar para continuar.";

  useEffect(() => {
    setStatus("speaking");
    void speakResponse(guide).finally(() => setStatus("idle"));
    return () => { stopSpeaking(); stopListeningRef.current?.(); };
  }, []);

  function orbState(): VoiceEngineState | "listening" {
    if (status === "speaking") return "playing";
    if (status === "listening") return "listening";
    return "idle";
  }

  function toggleMic() {
    if (status === "listening") { stopListeningRef.current?.(); setStatus("idle"); return; }
    stopSpeaking();
    const stop = startListening({
      onResult: ({ transcript }) => setQuery(transcript),
      onStateChange: (state) => setStatus(state === "listening" ? "listening" : "idle"),
      onError: () => setStatus("idle"),
    });
    if (stop) { stopListeningRef.current = stop; setStatus("listening"); }
  }

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const clean = query.trim().toLowerCase();
    const bank = CHILE_BANKS.find((item) => item.name.toLowerCase().includes(clean));
    if (bank) window.location.href = `/origen-fondos/bancos/${bank.id}`;
  }

  return (
    <main style={{ height: "calc(100vh - 160px)", overflow: "hidden", display: "grid", gap: 14, gridTemplateRows: "auto 1fr auto" }}>
      <section>
        <h1 style={{ color: "#0F2A3D", fontSize: "clamp(1.65rem,3vw,2.05rem)", fontWeight: 900, margin: "0 0 4px", letterSpacing: "-0.04em", fontFamily: fonts.display }}>Bancos de Chile</h1>
      </section>

      <section style={{ minHeight: 0, overflow: "hidden", display: "grid", gridTemplateColumns: "repeat(5,minmax(0,1fr))", gap: 12, alignContent: "start" }}>
        {CHILE_BANKS.map((bank) => (
          <button key={bank.id} type="button" onClick={() => { window.location.href = `/origen-fondos/bancos/${bank.id}`; }} style={{ height: 118, borderRadius: 18, border: "1px solid #E2E8F0", background: "#FFFFFF", color: "#0F2A3D", cursor: "pointer", display: "grid", gap: 10, padding: "14px 12px", justifyItems: "center", alignContent: "center", boxShadow: "0 8px 16px rgba(15,42,61,0.04)", fontFamily: fonts.body, textAlign: "center" }}>
            <img src={bank.logoUrl} alt={bank.name} style={{ width: 44, height: 44, objectFit: "contain" }} />
            <strong style={{ fontSize: 13.5, lineHeight: 1.15, fontWeight: 900 }}>{bank.name}</strong>
          </button>
        ))}
      </section>

      <section style={{ border: "1px solid #DDD6FE", borderRadius: 20, background: "#FFFFFF", padding: 12, display: "grid", gridTemplateColumns: "minmax(260px,.85fr) minmax(320px,1.15fr)", gap: 14, alignItems: "center", boxShadow: "0 12px 28px rgba(109,74,255,0.05)" }}>
        <div style={{ display: "flex", gap: 12, alignItems: "center", minWidth: 0 }}>
          <div style={{ width: 52, height: 52, overflow: "hidden", borderRadius: 999, flexShrink: 0 }}><VoiceOrb state={orbState()} /></div>
          <div style={{ minWidth: 0 }}>
            <strong style={{ display: "block", color: "#5B35F5", fontSize: 15, fontWeight: 900, marginBottom: 4, fontFamily: fonts.body }}>{statusCopy(status)}</strong>
            <p style={{ margin: 0, color: "#475569", fontSize: 12.5, lineHeight: 1.28, fontFamily: fonts.body, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{guide}</p>
          </div>
        </div>

        <form onSubmit={submit}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ flex: 1, minHeight: 46, borderRadius: 15, border: "1px solid #CBD5E1", background: "#FFFFFF", display: "flex", alignItems: "center", padding: "0 6px 0 14px", gap: 6, minWidth: 0, boxShadow: "0 6px 14px rgba(15,42,61,0.035)" }}>
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Habla o escribe aquí..." style={{ flex: 1, border: "none", outline: "none", color: "#0F2A3D", fontSize: 14, fontFamily: fonts.body, minWidth: 0, background: "transparent" }} />
              <button type="button" onClick={toggleMic} style={{ width: 36, height: 36, borderRadius: 10, border: "none", background: status === "listening" ? "rgba(91,53,245,0.12)" : "transparent", color: status === "listening" ? "#5B35F5" : "#64748B", cursor: "pointer", fontSize: 20, display: "grid", placeItems: "center", flexShrink: 0 }}>{status === "listening" ? "■" : "🎙"}</button>
              <button type="submit" style={{ width: 40, height: 40, borderRadius: 10, border: "none", background: "#7C3AED", color: "#FFFFFF", fontSize: 18, fontWeight: 900, cursor: "pointer", flexShrink: 0, display: "grid", placeItems: "center" }}>→</button>
            </div>
          </div>
        </form>
      </section>
    </main>
  );
}
