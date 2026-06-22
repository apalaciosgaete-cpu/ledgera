"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { fonts } from "@/styles/tokens";
import { colors } from "@/styles/tokens";
import { speakResponse, stopSpeaking } from "@/modules/voice/textToSpeech";
import { startListening } from "@/modules/voice/speechToText";
import { VoiceOrb } from "@/components/voice/VoiceOrb";
import type { VoiceEngineState } from "@/modules/voice/voiceEngine";
import { CHILE_BANKS, getBankLogoUrl } from "@/modules/banking/catalogs/chileBanks";

type AssistantStatus = "idle" | "listening" | "speaking";

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
    const bank = CHILE_BANKS.find((item) => item.name.toLowerCase().includes(clean));
    if (bank) window.location.href = `/origen-fondos/bancos/${bank.id}`;
  }

  return (
    <main style={{ height: "calc(100vh - 160px)", overflow: "hidden", display: "grid", gap: 12, gridTemplateRows: "auto 1fr auto" }}>
      <section>
        <button
          onClick={() => router.push("/origen-fondos")}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            background: "transparent", border: "none", cursor: "pointer",
            color: colors.textSecondary, fontSize: 13, fontFamily: fonts.body,
            padding: 0, marginBottom: 6,
          }}
        >
          ← Volver a Origen de Fondos
        </button>
        <h1 style={{ color: "#0F2A3D", fontSize: "clamp(1.35rem,2.4vw,1.72rem)", fontWeight: 900, margin: "0 0 2px", letterSpacing: "-0.04em", fontFamily: fonts.display }}>Banco en Chile</h1>
        <p style={{ color: "#334155", fontSize: 13, lineHeight: 1.3, margin: 0, fontFamily: fonts.body }}>
          {CHILE_BANKS.length} bancos disponibles. Selecciona para conectar tu cuenta.
        </p>
      </section>

      <section style={{ minHeight: 0, overflowY: "auto", display: "grid", gridTemplateColumns: "repeat(5,minmax(0,1fr))", gap: 12, alignContent: "start", paddingRight: 4 }}>
        {CHILE_BANKS.map((bank) => {
          const isAvailable = bank.status === "available";
          return (
            <button
              key={bank.id}
              type="button"
              disabled={!isAvailable}
              onClick={() => router.push(`/origen-fondos/bancos/${bank.id}`)}
              style={{
                height: 112,
                borderRadius: 18,
                border: `1px solid ${isAvailable ? "#E6E0FF" : colors.border}`,
                background: isAvailable ? "#FFFFFF" : colors.surfaceAlt,
                color: "#0F2A3D",
                cursor: isAvailable ? "pointer" : "not-allowed",
                display: "grid",
                gap: 9,
                padding: "13px 12px",
                justifyItems: "center",
                alignContent: "center",
                opacity: isAvailable ? 1 : 0.55,
                boxShadow: isAvailable ? "0 4px 12px rgba(15,42,61,0.04)" : "none",
                fontFamily: fonts.body,
                textAlign: "center",
                transition: "box-shadow 0.15s, transform 0.15s",
              }}
              onMouseEnter={(e) => {
                if (!isAvailable) return;
                e.currentTarget.style.boxShadow = "0 8px 18px rgba(109,74,255,0.12)";
                e.currentTarget.style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = "0 4px 12px rgba(15,42,61,0.04)";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              <img src={getBankLogoUrl(bank.domain)} alt={bank.name} style={{ width: 48, height: 36, objectFit: "contain", display: "block" }} />
              <strong style={{ fontSize: 12, lineHeight: 1.1, fontWeight: 900 }}>{bank.shortName}</strong>
              {!isAvailable && (
                <span style={{ fontSize: 9, fontWeight: 700, color: colors.textMuted }}>Próximamente</span>
              )}
            </button>
          );
        })}
      </section>

      <section style={{ border: "1px solid #DDD6FE", borderRadius: 20, background: "#FFFFFF", padding: 12, display: "grid", gridTemplateColumns: "minmax(260px,.85fr) minmax(320px,1.15fr)", gap: 14, alignItems: "center", boxShadow: "0 12px 28px rgba(109,74,255,0.05)" }}>
        <div style={{ display: "flex", gap: 12, alignItems: "center", minWidth: 0 }}>
          <div style={{ width: 52, height: 52, overflow: "hidden", borderRadius: 999, flexShrink: 0 }}><VoiceOrb state={orbState()} /></div>
          <div style={{ minWidth: 0 }}>
            <strong style={{ display: "block", color: status === "listening" || status === "speaking" ? "#5B35F5" : "#475569", fontSize: 15, fontWeight: 900, marginBottom: 4, fontFamily: fonts.body }}>{statusCopy(status)}</strong>
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
