"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { fonts } from "@/styles/tokens";
import { VoiceEngine, type VoiceEngineState } from "@/modules/voice/voiceEngine";
import { startListening } from "@/modules/voice/speechToText";
import { Logo } from "@/components/brand/Logo";

const CHIPS = [
  "Vendí Bitcoin",
  "Recibí USDT",
  "Necesito justificar fondos",
  "Preparar declaración crypto",
];

function VoiceOrb({ state }: { state: VoiceEngineState }) {
  const active = state === "playing";

  return (
    <>
      <style>{`
        @keyframes orb-idle {
          0%, 100% { transform: scale(1); opacity: 0.55; }
          50% { transform: scale(1.08); opacity: 0.80; }
        }
        @keyframes orb-ring {
          0% { transform: scale(0.85); opacity: 0.65; }
          100% { transform: scale(2.2); opacity: 0; }
        }
        @keyframes orb-ring-b {
          0% { transform: scale(0.85); opacity: 0.45; }
          100% { transform: scale(2.8); opacity: 0; }
        }
        @keyframes orb-ring-c {
          0% { transform: scale(0.85); opacity: 0.25; }
          100% { transform: scale(3.4); opacity: 0; }
        }
        @keyframes orb-core-pulse {
          0%, 100% { box-shadow: 0 0 28px 6px rgba(74,222,128,0.45), 0 0 60px 14px rgba(22,163,74,0.22); }
          50% { box-shadow: 0 0 52px 14px rgba(74,222,128,0.75), 0 0 100px 28px rgba(22,163,74,0.38); }
        }
        @keyframes orb-rotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>

      <div style={{ position: "relative", width: 120, height: 120, margin: "0 auto" }}>
        {active && (
          <>
            <div style={{
              position: "absolute", inset: 0, borderRadius: "50%",
              border: "1.5px solid rgba(74,222,128,0.55)",
              animation: "orb-ring 1.6s ease-out infinite",
            }} />
            <div style={{
              position: "absolute", inset: 0, borderRadius: "50%",
              border: "1.5px solid rgba(74,222,128,0.38)",
              animation: "orb-ring-b 1.6s ease-out 0.45s infinite",
            }} />
            <div style={{
              position: "absolute", inset: 0, borderRadius: "50%",
              border: "1px solid rgba(74,222,128,0.22)",
              animation: "orb-ring-c 1.6s ease-out 0.9s infinite",
            }} />
          </>
        )}

        <div style={{
          position: "absolute", inset: -8, borderRadius: "50%",
          border: "1px solid rgba(74,222,128,0.18)",
          animation: active ? "orb-rotate 6s linear infinite" : "none",
          background: "conic-gradient(from 0deg, rgba(74,222,128,0.12), transparent 60%, rgba(56,189,248,0.08), transparent)",
        }} />

        <div style={{
          position: "absolute", inset: 10, borderRadius: "50%",
          background: "radial-gradient(circle at 38% 35%, rgba(74,222,128,0.9), rgba(22,163,74,0.7) 48%, rgba(15,42,61,0.95) 80%)",
          animation: active ? "orb-core-pulse 0.8s ease-in-out infinite" : "orb-idle 3.2s ease-in-out infinite",
          boxShadow: active
            ? "0 0 40px 10px rgba(74,222,128,0.55), 0 0 80px 22px rgba(22,163,74,0.28)"
            : "0 0 22px 5px rgba(74,222,128,0.30), 0 0 48px 12px rgba(22,163,74,0.15)",
        }}>
          <div style={{
            position: "absolute", top: "28%", left: "32%",
            width: 16, height: 16, borderRadius: "50%",
            background: "rgba(255,255,255,0.55)",
            filter: "blur(4px)",
          }} />
        </div>
      </div>
    </>
  );
}

export function InvestorDashboard() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const voiceEngineRef = useRef<VoiceEngine | null>(null);
  const stopListeningRef = useRef<(() => void) | null>(null);
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const [listening, setListening] = useState(false);
  const [voiceState, setVoiceState] = useState<VoiceEngineState>("idle");

  useEffect(() => {
    const engine = new VoiceEngine();
    voiceEngineRef.current = engine;

    const timeout = window.setTimeout(() => {
      engine.playWelcome({ onStateChange: setVoiceState });
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
        padding: "clamp(24px, 5vh, 56px) 24px",
      }}
    >
      <section style={{ width: "100%", maxWidth: 720, textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center" }}>

        <div style={{ marginBottom: 36 }}>
          <Logo variant="light" size="md" showSubtitle />
        </div>

        <div style={{ marginBottom: 32 }}>
          <VoiceOrb state={voiceState} />
        </div>

        <h1
          style={{
            color: "#F8FAFC",
            fontSize: "clamp(1.7rem, 4vw, 2.8rem)",
            fontWeight: 850,
            margin: "0 0 20px",
            lineHeight: 1.12,
            letterSpacing: "-0.04em",
            fontFamily: fonts.body,
          }}
        >
          ¿Cuál es tu situación o qué quieres evaluar?
        </h1>

        <form onSubmit={handleSubmit} style={{ width: "100%", marginBottom: 10 }}>
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
              placeholder="Ej: vendí Bitcoin, recibí USDT, usé Binance..."
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

        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", marginTop: 6 }}>
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
