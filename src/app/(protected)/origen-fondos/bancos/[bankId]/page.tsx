"use client";

import { useEffect, useRef, useState } from "react";
import { notFound, useParams } from "next/navigation";
import { fonts } from "@/styles/tokens";
import { speakResponse, stopSpeaking } from "@/modules/voice/textToSpeech";
import { startListening } from "@/modules/voice/speechToText";
import { VoiceOrb } from "@/components/voice/VoiceOrb";
import type { VoiceEngineState } from "@/modules/voice/voiceEngine";
import { findChileBank, getBankLogoUrl } from "@/modules/banking/catalogs/chileBanks";

type AssistantStatus = "idle" | "listening" | "speaking";

function statusCopy(status: AssistantStatus) {
  if (status === "listening") return "Escuchando...";
  if (status === "speaking") return "Hablando...";
  return "LEDGERA te escucha";
}

export default function BankConnectionPage() {
  const params = useParams<{ bankId: string }>();
  const bank = findChileBank(params.bankId);
  const stopListeningRef = useRef<(() => void) | null>(null);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<AssistantStatus>("idle");

  if (!bank) notFound();

  const guide = `Estás en la conexión con ${bank.name}. Selecciona conexión bancaria o carga de cartola para continuar.`;

  useEffect(() => {
    setStatus("speaking");
    void speakResponse(guide).finally(() => setStatus("idle"));
    return () => { stopSpeaking(); stopListeningRef.current?.(); };
  }, [guide]);

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
    const clean = query.trim();
    if (!clean) return;
    setStatus("speaking");
    void speakResponse(`Continuamos con ${bank.name}.`).finally(() => setStatus("idle"));
  }

  return (
    <main style={{ height: "calc(100vh - 160px)", overflow: "hidden", display: "grid", gap: 14, gridTemplateRows: "auto 1fr auto" }}>
      <section style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <img src={getBankLogoUrl(bank.domain)} alt={bank.name} style={{ width: 58, height: 48, objectFit: "contain", display: "block" }} />
        <div>
          <h1 style={{ color: "#0F2A3D", fontSize: "clamp(1.35rem,2.4vw,1.72rem)", fontWeight: 900, margin: 0, letterSpacing: "-0.04em", fontFamily: fonts.display }}>Conexión {bank.name}</h1>
          <p style={{ margin: "4px 0 0", color: "#475569", fontSize: 13.5, fontFamily: fonts.body }}>Banco en Chile</p>
        </div>
      </section>

      <section style={{ minHeight: 0, display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 14, alignContent: "start" }}>
        <button type="button" style={{ minHeight: 150, borderRadius: 20, border: "1px solid #DDD6FE", background: "#FFFFFF", color: "#0F2A3D", cursor: "pointer", padding: 18, textAlign: "left", boxShadow: "0 10px 22px rgba(15,42,61,0.05)", fontFamily: fonts.body }}>
          <strong style={{ display: "block", fontSize: 17, fontWeight: 900, marginBottom: 8 }}>Conexión bancaria</strong>
          <span style={{ display: "block", color: "#475569", fontSize: 13.5, lineHeight: 1.35 }}>Iniciar conexión segura con {bank.name}.</span>
        </button>
        <button type="button" onClick={() => window.open(bank.website, "_blank", "noopener,noreferrer")} style={{ minHeight: 150, borderRadius: 20, border: "1px solid #E2E8F0", background: "#FFFFFF", color: "#0F2A3D", cursor: "pointer", padding: 18, textAlign: "left", boxShadow: "0 10px 22px rgba(15,42,61,0.05)", fontFamily: fonts.body }}>
          <strong style={{ display: "block", fontSize: 17, fontWeight: 900, marginBottom: 8 }}>Web del banco</strong>
          <span style={{ display: "block", color: "#475569", fontSize: 13.5, lineHeight: 1.35 }}>Abrir sitio oficial de {bank.name}.</span>
        </button>
        <button type="button" style={{ minHeight: 150, borderRadius: 20, border: "1px solid #E2E8F0", background: "#FFFFFF", color: "#0F2A3D", cursor: "pointer", padding: 18, textAlign: "left", boxShadow: "0 10px 22px rgba(15,42,61,0.05)", fontFamily: fonts.body }}>
          <strong style={{ display: "block", fontSize: 17, fontWeight: 900, marginBottom: 8 }}>Cargar cartola</strong>
          <span style={{ display: "block", color: "#475569", fontSize: 13.5, lineHeight: 1.35 }}>Subir documento bancario de {bank.name}.</span>
        </button>
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
