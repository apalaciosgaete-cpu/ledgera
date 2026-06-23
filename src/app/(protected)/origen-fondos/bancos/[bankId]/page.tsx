"use client";

import { useEffect, useRef, useState } from "react";
import { notFound, useParams } from "next/navigation";
import { fonts } from "@/styles/tokens";
import { speakResponse, stopSpeaking } from "@/modules/voice/textToSpeech";
import { startListening } from "@/modules/voice/speechToText";
import { VoiceOrb } from "@/components/voice/VoiceOrb";
import type { VoiceEngineState } from "@/modules/voice/voiceEngine";
import { findBankById, getBankLogoUrl } from "@/modules/banking/catalogs/chileBanks";
import type { ConnectionMethod } from "@/modules/banking/catalogs/chileBanks";

import { colors } from "@/styles/tokens";

type AssistantStatus = "idle" | "listening" | "speaking";

const METHOD_META: Record<ConnectionMethod, { icon: string; label: string; accent: string; bg: string; border: string }> = {
  api: {
    icon: "🔐",
    label: "Conexión segura por API",
    accent: "#7C3AED",
    bg: "#FBFAFF",
    border: "#E6E0FF",
  },
  aggregator: {
    icon: "🔄",
    label: "Conexión vía agregador",
    accent: "#2483FF",
    bg: "#F8FBFF",
    border: "#DCEBFF",
  },
  manual_upload: {
    icon: "📄",
    label: "Subir cartola bancaria",
    accent: "#20C878",
    bg: "#F8FFFB",
    border: "#D9F5E8",
  },
};

function statusCopy(status: AssistantStatus) {
  if (status === "listening") return "Escuchando...";
  if (status === "speaking") return "Hablando...";
  return "LEDGERA te escucha";
}

export default function BankConnectionPage() {
  const params = useParams<{ bankId: string }>();
  const bank = findBankById(params.bankId);
  const stopListeningRef = useRef<(() => void) | null>(null);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<AssistantStatus>("idle");

  if (!bank) notFound();

  const isAvailable = bank.status === "available";
  const guide = `Estás en la conexión con ${bank.name}. Selecciona el método de conexión para continuar.`;

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
    void speakResponse(`Continuamos con ${bank!.name}.`).finally(() => setStatus("idle"));
  }

  return (
    <main style={{ height: "calc(100vh - 92px)", overflow: "hidden", display: "grid", gap: 12, gridTemplateRows: "auto auto 1fr auto" }}>
      <section>
        <button
          onClick={() => window.location.href = "/origen-fondos/bancos"}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            background: "transparent", border: "none", cursor: "pointer",
            color: "#475569", fontSize: 13, fontFamily: fonts.body,
            padding: 0, marginBottom: 4,
          }}
        >
          ← Volver a Bancos
        </button>
      </section>

      <section style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <img src={getBankLogoUrl(bank.domain)} alt={bank.name} style={{ width: 58, height: 48, objectFit: "contain", display: "block" }} />
        <div>
          <h1 style={{ color: "#0F2A3D", fontSize: "clamp(1.35rem,2.4vw,1.72rem)", fontWeight: 900, margin: 0, letterSpacing: "-0.04em", fontFamily: fonts.display }}>
            Conectar {bank.shortName}
          </h1>
        </div>
      </section>

      <section style={{ minHeight: 0, overflow: "hidden", paddingRight: 4 }}>
        <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", alignContent: "start" }}>
          {bank.connectionMethods.map((method) => {
            const meta = METHOD_META[method];
            return (
              <button
                key={method}
                type="button"
                disabled={!isAvailable}
                style={{
                  minHeight: 116,
                  borderRadius: 18,
                  border: `1px solid ${meta.border}`,
                  background: meta.bg,
                  color: "#0F2A3D",
                  cursor: isAvailable ? "pointer" : "not-allowed",
                  display: "grid",
                  gap: 8,
                  padding: "18px 16px",
                  textAlign: "left",
                  fontFamily: fonts.body,
                  opacity: isAvailable ? 1 : 0.55,
                  transition: "box-shadow 0.15s, transform 0.15s",
                }}
                onMouseEnter={(e) => {
                  if (!isAvailable) return;
                  e.currentTarget.style.boxShadow = `0 8px 20px ${meta.accent}18`;
                  e.currentTarget.style.transform = "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = "none";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 28, lineHeight: 1 }}>{meta.icon}</span>
                  <strong style={{ fontSize: 15, fontWeight: 900 }}>{meta.label}</strong>
                </div>
                {isAvailable && (
                  <span style={{
                    fontSize: 12, fontWeight: 700, color: meta.accent,
                    display: "flex", alignItems: "center", gap: 4,
                  }}>
                    {method === "api" && "Configurar API →"}
                    {method === "aggregator" && "Conectar agregador →"}
                    {method === "manual_upload" && "Subir archivo →"}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </section>

      <section style={{ alignSelf: "end", border: "1px solid #DDD6FE", borderRadius: 20, background: "#FFFFFF", padding: 12, display: "grid", gridTemplateColumns: "minmax(260px,.85fr) minmax(320px,1.15fr)", gap: 14, alignItems: "center", boxShadow: "0 12px 28px rgba(109,74,255,0.05)" }}>
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
