"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { fonts } from "@/styles/tokens";
import { hasWelcomeBeenPlayed, markWelcomeAsPlayed } from "@/modules/voice/voiceSession";

const CHIPS = [
  "Vendí Bitcoin",
  "Recibí USDT",
  "Necesito justificar fondos",
  "Preparar declaración crypto",
];

const WELCOME_TEXT = "Hola. Soy Lédyera, tu Sistema Operativo Financiero y Tributario. Cuéntame cuál es tu situación, o qué quieres evaluar.";

export function InvestorDashboard() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const hasSpokenRef = useRef(false);
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);

  // Voz de bienvenida — código original que funcionaba
  useEffect(() => {
    if (hasSpokenRef.current) return;
    hasSpokenRef.current = true;

    if (hasWelcomeBeenPlayed()) return;

    const speak = () => {
      if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(WELCOME_TEXT);
        utterance.lang = "es-CL";
        utterance.rate = 0.94;
        utterance.pitch = 0.95;
        window.speechSynthesis.speak(utterance);
        markWelcomeAsPlayed();
      } catch (e) {
        console.error("[voice/direct]", e);
      }
    };

    const timeout = window.setTimeout(speak, 800);
    return () => window.clearTimeout(timeout);
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    router.push(`/conversaciones?q=${encodeURIComponent(q)}&scope=crypto-first`);
  }

  function sendChip(chip: string) {
    router.push(`/conversaciones?q=${encodeURIComponent(chip)}&scope=crypto-first`);
  }

  return (
    <div
      style={{
        minHeight: "calc(100vh - 60px)",
        background: "#071B28",
        color: "#E2E8F0",
        fontFamily: fonts.body,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "clamp(36px, 7vh, 72px) 24px",
      }}
    >
      <section style={{ width: "100%", maxWidth: 720, textAlign: "center" }}>
        <p
          style={{
            color: "#4ADE80",
            fontSize: 12,
            fontWeight: 850,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            margin: "0 0 38px",
            fontFamily: fonts.body,
          }}
        >
          SO Financiero y Tributario
        </p>

        <h1
          style={{
            color: "#F8FAFC",
            fontSize: "clamp(1.8rem, 4vw, 2.55rem)",
            fontWeight: 850,
            margin: "0 0 16px",
            lineHeight: 1.2,
            letterSpacing: "-0.035em",
            fontFamily: fonts.body,
          }}
        >
          ¿Cuál es tu situación o qué quieres evaluar?
        </h1>

        <p
          style={{
            color: "#64748B",
            fontSize: 16,
            fontWeight: 450,
            margin: "0 0 28px",
            lineHeight: 1.55,
          }}
        >
          Describe una operación, un movimiento, una duda tributaria o una decisión pendiente con cryptoactivos.
        </p>

        <form onSubmit={handleSubmit} style={{ marginBottom: 16 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              background: "rgba(255,255,255,0.04)",
              border: `1.5px solid ${focused ? "rgba(74,222,128,0.35)" : "rgba(255,255,255,0.10)"}`,
              borderRadius: 18,
              padding: "6px 6px 6px 22px",
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
                padding: "12px 0",
                caretColor: "#4ADE80",
              }}
            />
            <button
              type="submit"
              aria-label="Analizar situación"
              style={{
                background: "#16A34A",
                border: "none",
                borderRadius: 12,
                color: "#FFFFFF",
                cursor: "pointer",
                padding: "12px 22px",
                fontSize: 17,
                fontWeight: 850,
                flexShrink: 0,
                lineHeight: 1,
              }}
            >
              →
            </button>
          </div>
        </form>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
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
