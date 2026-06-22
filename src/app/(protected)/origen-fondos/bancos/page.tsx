"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { fonts, colors } from "@/styles/tokens";
import { speakResponse, stopSpeaking } from "@/modules/voice/textToSpeech";
import { startListening } from "@/modules/voice/speechToText";
import { VoiceOrb } from "@/components/voice/VoiceOrb";
import type { VoiceEngineState } from "@/modules/voice/voiceEngine";
import { CHILE_BANKS, getBankLogoUrl } from "@/modules/banking/catalogs/chileBanks";

type AssistantStatus = "idle" | "listening" | "speaking";

const LOCAL_LOGOS: Record<string, string> = {
  santander: "/logos/santander.svg",
  chile: "/logos/bancochile.svg",
  bci: "/logos/bci.svg",
  estado: "/logos/bancoestado.svg",
  itau: "/logos/itau.svg",
  scotiabank: "/logos/scotiabank.svg",
  falabella: "/logos/falabella.svg",
  security: "/logos/security.svg",
  bice: "/logos/bice.svg",
  consorcio: "/logos/consorcio.svg",
  internacional: "/logos/internacional.svg",
  ripley: "/logos/ripley.svg",
  hsbc: "/logos/hsbc.svg",
  "btg-pactual": "/logos/btgpactual.svg",
  "jp-morgan": "/logos/jpmorgan.svg",
  "do-brasil": "/logos/bancodobrasil.svg",
  "nacion-argentina": "/logos/nacionargentina.svg",
};

function logoUrl(bank: (typeof CHILE_BANKS)[number]) {
  return LOCAL_LOGOS[bank.id] ?? getBankLogoUrl(bank.domain);
}

function statusCopy(status: AssistantStatus) {
  if (status === "listening") return "Escuchando...";
  if (status === "speaking") return "Hablando...";
  return "LEDGERA te escucha";
}

export default function BancosOrigenFondosPage() {
  const router = useRouter();
  const stopListeningRef = useRef<(() => void) | null>(null);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<AssistantStatus>("idle");

  const guide = "Estás en Banco en Chile. Selecciona el banco que quieres conectar para continuar.";

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
    const bank = CHILE_BANKS.find((item) => item.name.toLowerCase().includes(clean) || item.shortName.toLowerCase().includes(clean));
    if (bank) router.push(`/origen-fondos/bancos/${bank.id}`);
  }

  return (
    <main style={{ height: "calc(100vh - 100px)", overflow: "hidden", display: "grid", gap: 8, gridTemplateRows: "auto 1fr auto" }}>
      <section>
        <button onClick={() => router.push("/origen-fondos")} style={{ display: "flex", alignItems: "center", gap: 6, background: "transparent", border: "none", cursor: "pointer", color: colors.textSecondary, fontSize: 13, fontFamily: fonts.body, padding: 0, marginBottom: 4 }}>← Volver a Origen de Fondos</button>
        <h1 style={{ color: "#0F2A3D", fontSize: "clamp(1.25rem,2.1vw,1.55rem)", fontWeight: 900, margin: "0 0 2px", letterSpacing: "-0.04em", fontFamily: fonts.display }}>Banco en Chile</h1>
        <p style={{ color: "#334155", fontSize: 12.5, lineHeight: 1.2, margin: 0, fontFamily: fonts.body }}>{CHILE_BANKS.length} bancos disponibles. Selecciona para conectar tu cuenta.</p>
      </section>

      <section style={{ minHeight: 0, overflowY: "auto", display: "grid", gridTemplateColumns: "repeat(5,minmax(0,1fr))", gap: 10, alignContent: "start" }}>
        {CHILE_BANKS.map((bank) => {
          const isAvailable = bank.status === "available";
          return (
            <button key={bank.id} type="button" disabled={!isAvailable} onClick={() => router.push(`/origen-fondos/bancos/${bank.id}`)} style={{ height: 108, borderRadius: 16, border: `1px solid ${isAvailable ? "#E6E0FF" : colors.border}`, background: isAvailable ? "#FFFFFF" : colors.surfaceAlt, color: "#0F2A3D", cursor: isAvailable ? "pointer" : "not-allowed", display: "flex", flexDirection: "column", gap: 0, padding: "14px 12px 12px", alignItems: "center", justifyContent: "space-between", opacity: isAvailable ? 1 : 0.55, boxShadow: isAvailable ? "0 4px 12px rgba(15,42,61,0.04)" : "none", fontFamily: fonts.body, textAlign: "center", transition: "box-shadow 0.15s, transform 0.15s" }}>
              <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", width: "100%" }}>
                <img src={logoUrl(bank)} alt={bank.name} style={{ width: 80, height: 40, objectFit: "contain", display: "block" }} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                <strong style={{ fontSize: 11.5, lineHeight: 1.1, fontWeight: 900 }}>{bank.shortName}</strong>
                {!isAvailable && <span style={{ fontSize: 8.5, fontWeight: 700, color: colors.textMuted }}>Próximamente</span>}
              </div>
            </button>
          );
        })}
      </section>

      <section style={{ width: "100%", border: "1px solid #DDD6FE", borderRadius: 18, background: "#FFFFFF", padding: 10, display: "grid", gridTemplateColumns: "minmax(280px,.9fr) minmax(360px,.75fr)", gap: 12, alignItems: "center", boxShadow: "0 10px 22px rgba(109,74,255,0.05)", boxSizing: "border-box" }}>
        <div style={{ display: "flex", gap: 10, alignItems: "center", minWidth: 0 }}>
          <div style={{ width: 46, height: 46, overflow: "hidden", borderRadius: 999, flexShrink: 0 }}><VoiceOrb state={orbState()} /></div>
          <div style={{ minWidth: 0 }}>
            <strong style={{ display: "block", color: status === "listening" || status === "speaking" ? "#5B35F5" : "#475569", fontSize: 14, fontWeight: 900, marginBottom: 3, fontFamily: fonts.body }}>{statusCopy(status)}</strong>
            <p style={{ margin: 0, color: "#475569", fontSize: 12, lineHeight: 1.22, fontFamily: fonts.body, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{guide}</p>
          </div>
        </div>
        <form onSubmit={submit} style={{ width: "100%", justifySelf: "end", maxWidth: 620 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, width: "100%" }}>
            <div style={{ flex: 1, minHeight: 44, borderRadius: 15, border: "1px solid #CBD5E1", background: "#FFFFFF", display: "flex", alignItems: "center", padding: "0 6px 0 14px", gap: 6, minWidth: 0, boxShadow: "0 6px 14px rgba(15,42,61,0.035)" }}>
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Habla o escribe aquí..." style={{ flex: 1, border: "none", outline: "none", color: "#0F2A3D", fontSize: 14, fontFamily: fonts.body, minWidth: 0, background: "transparent" }} />
              <button type="button" onClick={toggleMic} style={{ width: 34, height: 34, borderRadius: 10, border: "none", background: status === "listening" ? "rgba(91,53,245,0.12)" : "transparent", color: status === "listening" ? "#5B35F5" : "#64748B", cursor: "pointer", fontSize: 18, display: "grid", placeItems: "center", flexShrink: 0 }}>{status === "listening" ? "■" : "🎙"}</button>
              <button type="submit" style={{ width: 38, height: 38, borderRadius: 10, border: "none", background: "#7C3AED", color: "#FFFFFF", fontSize: 18, fontWeight: 900, cursor: "pointer", flexShrink: 0, display: "grid", placeItems: "center" }}>→</button>
            </div>
          </div>
        </form>
      </section>
    </main>
  );
}
