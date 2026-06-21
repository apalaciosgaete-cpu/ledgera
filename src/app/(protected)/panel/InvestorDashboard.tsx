"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { fonts } from "@/styles/tokens";
import { VoiceEngine } from "@/modules/voice/voiceEngine";
import { startListening } from "@/modules/voice/speechToText";

const CHIPS = [
  "Vendí Bitcoin",
  "Recibí USDT",
  "Necesito justificar fondos",
  "Preparar declaración crypto",
];

export function InvestorDashboard() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const voiceEngineRef = useRef<VoiceEngine | null>(null);
  const stopListeningRef = useRef<(() => void) | null>(null);
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const [listening, setListening] = useState(false);

  useEffect(() => {
    const engine = new VoiceEngine();
    voiceEngineRef.current = engine;

    const timeout = window.setTimeout(() => {
      engine.playWelcome();
    }, 150);

    return () => {
      window.clearTimeout(timeout);
      engine.stop();
      stopListeningRef.current?.();
    };
  }, []);

  function goToConversation(text: string, source: "text" | "voice") {
    const q = text.trim();
    if (!q) return;
    router.push(`/conversaciones?q=${encodeURIComponent(q)}&scope=crypto-first&source=${source}`);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    goToConversation(query, "text");
  }

  function sendChip(chip: string) {
    setQuery(chip);
    goToConversation(chip, "text");
  }

  function stopMic() {
    stopListeningRef.current?.();
    stopListeningRef.current = null;
    setListening(false);
  }

  function startMic() {
    voiceEngineRef.current?.stop();
    stopMic();
    setListening(true);

    const stop = startListening({
      onResult: ({ transcript, final }) => {
        const next = transcript.trim();
        setQuery(next);
        if (final && next) {
          stopMic();
          goToConversation(next, "voice");
        }
      },
      onStateChange: (state) => {
        if (state === "idle" || state === "error" || state === "unsupported") {
          setListening(false);
        }
      },
      onError: () => {
        setListening(false);
      },
    });

    if (!stop) {
      setListening(false);
      return;
    }

    stopListeningRef.current = stop;
  }

  function toggleMic() {
    if (listening) {
      stopMic();
      return;
    }
    startMic();
  }

  return (
    <div
      style={{
        minHeight: "calc(100vh - 74px)",
        background: "#071B28",
        color: "#E2E8F0",
        fontFamily: fonts.body,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "clamp(24px, 5vh, 44px) 24px",
      }}
    >
      <section style={{ width: "100%", maxWidth: 760, textAlign: "center" }}>
        <form onSubmit={handleSubmit} style={{ marginBottom: 8 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: "rgba(255,255,255,0.04)",
              border: `1.5px solid ${focused ? "rgba(74,222,128,0.35)" : "rgba(255,255,255,0.10)"}`,
              borderRadius: 18,
              padding: "6px",
              transition: "border-color 0.2s",
              boxShadow: focused ? "0 0 0 3px rgba(22,163,74,0.08)" : "none",
            }}
          >
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              placeholder="Cuéntame tu situación o qué quieres evaluar"
              autoComplete="off"
              style={{
                flex: 1,
                background: "transparent",
                border: "none",
                outline: "none",
                color: "#F8FAFC",
                fontSize: 16,
                fontFamily: fonts.body,
                fontWeight: 500,
                padding: "12px 14px",
                caretColor: "#4ADE80",
              }}
            />

            <button
              type="button"
              onClick={toggleMic}
              aria-label={listening ? "Detener micrófono" : "Activar micrófono"}
              style={{
                width: 46,
                height: 46,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 12,
                border: `1px solid ${listening ? "rgba(74,222,128,0.35)" : "rgba(255,255,255,0.08)"}`,
                background: listening ? "rgba(22,163,74,0.16)" : "rgba(255,255,255,0.04)",
                color: listening ? "#4ADE80" : "#CBD5E1",
                cursor: "pointer",
                flexShrink: 0,
                fontSize: 17,
                lineHeight: 1,
              }}
            >
              {listening ? "■" : "🎙"}
            </button>

            <button
              type="submit"
              aria-label="Analizar situación"
              style={{
                background: "#16A34A",
                border: "none",
                borderRadius: 12,
                color: "#FFFFFF",
                cursor: "pointer",
                width: 58,
                height: 46,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 22,
                fontWeight: 850,
                flexShrink: 0,
                lineHeight: 1,
              }}
            >
              →
            </button>
          </div>
        </form>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", marginTop: 0 }}>
          {CHIPS.map((chip) => (
            <button
              key={chip}
              type="button"
              onClick={() => sendChip(chip)}
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 999,
                color: "#94A3B8",
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 600,
                padding: "6px 14px",
                fontFamily: fonts.body,
              }}
            >
              {chip}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
