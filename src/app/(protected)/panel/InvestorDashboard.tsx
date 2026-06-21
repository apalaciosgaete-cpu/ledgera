"use client";

import { useEffect, useRef, useState } from "react";
import { fonts } from "@/styles/tokens";
import { VoiceEngine, type VoiceEngineState } from "@/modules/voice/voiceEngine";
import { startListening } from "@/modules/voice/speechToText";
import { speakResponse, stopSpeaking } from "@/modules/voice/textToSpeech";
import { VoiceOrb } from "@/components/voice/VoiceOrb";

const CHIPS = [
  "Vendí Bitcoin",
  "Recibí USDT",
  "Necesito justificar fondos",
  "Preparar declaración crypto",
];

type Message = {
  role: "USER" | "ASSISTANT";
  content: string;
};

function estimateReplyPlaybackMs(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(2600, Math.min(words * 340, 12000));
}

export function InvestorDashboard() {
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const voiceEngineRef = useRef<VoiceEngine | null>(null);
  const stopListeningRef = useRef<(() => void) | null>(null);
  const relistenTimerRef = useRef<number | null>(null);
  const voiceModeRef = useRef(false);

  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const [listening, setListening] = useState(false);
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [voiceState, setVoiceState] = useState<VoiceEngineState>("idle");

  useEffect(() => {
    const engine = new VoiceEngine();
    voiceEngineRef.current = engine;

    void engine.playWelcome({ onStateChange: setVoiceState });

    return () => {
      engine.stop();
      stopSpeaking();
      stopListeningRef.current?.();
      if (relistenTimerRef.current) {
        window.clearTimeout(relistenTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, loading]);

  function stopMic() {
    stopListeningRef.current?.();
    stopListeningRef.current = null;
    setListening(false);
  }

  function clearRelistenTimer() {
    if (relistenTimerRef.current) {
      window.clearTimeout(relistenTimerRef.current);
      relistenTimerRef.current = null;
    }
  }

  function scheduleRelisten(answer: string) {
    if (!voiceModeRef.current) return;
    clearRelistenTimer();
    relistenTimerRef.current = window.setTimeout(() => {
      startMic();
    }, estimateReplyPlaybackMs(answer));
  }

  async function submitMessage(text: string, source: "text" | "voice") {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    if (source === "voice") {
      voiceModeRef.current = true;
    }

    stopSpeaking();
    stopMic();
    clearRelistenTimer();

    setMessages((current) => [...current, { role: "USER", content: trimmed }]);
    setQuery("");
    setLoading(true);

    try {
      const response = await fetch("/api/copilot/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: trimmed,
          conversationId,
          source,
          scope: "crypto-first",
        }),
      });

      const json = await response.json();
      if (!response.ok || !json.ok) {
        throw new Error(json.message || "No pude responder ahora.");
      }

      const answer = String(json.data.answer ?? "Necesito un poco más de contexto para ayudarte.");
      setConversationId(json.data.conversationId ?? conversationId);
      setMessages((current) => [...current, { role: "ASSISTANT", content: answer }]);

      setVoiceState("playing");
      const speakResult = await speakResponse(answer);
      setVoiceState(speakResult.success ? "played" : "unsupported");

      scheduleRelisten(answer);
    } catch (error) {
      const fallback = error instanceof Error ? error.message : "No pude responder ahora.";
      setMessages((current) => [...current, { role: "ASSISTANT", content: fallback }]);

      setVoiceState("playing");
      const speakResult = await speakResponse(fallback);
      setVoiceState(speakResult.success ? "played" : "unsupported");

      scheduleRelisten(fallback);
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    void submitMessage(query, "text");
  }

  function sendChip(chip: string) {
    setQuery(chip);
    void submitMessage(chip, "text");
  }

  function startMic() {
    if (loading) return;

    voiceEngineRef.current?.stop();
    stopSpeaking();
    stopMic();
    clearRelistenTimer();
    voiceModeRef.current = true;
    setListening(true);

    const stop = startListening({
      onResult: ({ transcript, final }) => {
        const next = transcript.trim();
        setQuery(next);
        if (final && next) {
          void submitMessage(next, "voice");
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

  const hasMessages = messages.length > 0;
  const isPlaying = voiceState === "playing";

  return (
    <div
      style={{
        height: "calc(100vh - 96px)",
        overflow: "hidden",
        background: "#071B28",
        color: "#E2E8F0",
        fontFamily: fonts.body,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: hasMessages ? "flex-start" : "space-between",
        padding: hasMessages ? "20px 24px 24px" : "clamp(12px, 2vh, 24px) 24px",
        boxSizing: "border-box",
      }}
    >
      {/* Orb — visible solo cuando no hay mensajes */}
      {!hasMessages && (
        <div
          style={{
            flex: 1,
            minHeight: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "clamp(8px, 1.5vh, 16px)",
          }}
        >
          <VoiceOrb state={voiceState} />
          <p
            style={{
              margin: 0,
              fontSize: 14,
              color: isPlaying ? "#86EFAC" : "#475569",
              fontWeight: 500,
              letterSpacing: "0.04em",
              transition: "color 0.5s ease",
              minHeight: "1.4em",
            }}
          >
            {isPlaying
              ? "Hablando..."
              : voiceState === "played"
              ? "¿En qué te puedo ayudar?"
              : ""}
          </p>
        </div>
      )}

      <section
        style={{
          width: "100%",
          maxWidth: 860,
          textAlign: "center",
          display: "grid",
          gap: 10,
          flexShrink: 0,
        }}
      >
        {hasMessages && (
          <div
            style={{
              minHeight: 200,
              maxHeight: "calc(100vh - 260px)",
              overflowY: "auto",
              display: "grid",
              alignContent: "start",
              gap: 12,
              padding: "4px 2px 10px",
            }}
          >
            {messages.map((item, index) => {
              const isUser = item.role === "USER";
              return (
                <div
                  key={`${item.role}-${index}`}
                  style={{
                    justifySelf: isUser ? "end" : "start",
                    maxWidth: "78%",
                    textAlign: "left",
                    background: isUser ? "#16A34A" : "rgba(255,255,255,0.055)",
                    border: isUser
                      ? "1px solid rgba(74,222,128,0.22)"
                      : "1px solid rgba(255,255,255,0.08)",
                    color: isUser ? "#FFFFFF" : "#E2E8F0",
                    borderRadius: 18,
                    padding: "12px 14px",
                    fontSize: 15,
                    lineHeight: 1.55,
                    boxShadow: isUser ? "0 8px 24px rgba(22,163,74,0.12)" : "none",
                  }}
                >
                  {item.content}
                </div>
              );
            })}
            {loading && (
              <p
                style={{
                  color: "#64748B",
                  fontSize: 13,
                  margin: "2px 0 0",
                  textAlign: "left",
                }}
              >
                LEDGERA está analizando tu contexto…
              </p>
            )}
            <div ref={scrollRef} />
          </div>
        )}

        <form onSubmit={handleSubmit}>
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
              disabled={loading}
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
                opacity: loading ? 0.65 : 1,
              }}
            />

            <button
              type="button"
              onClick={toggleMic}
              disabled={loading}
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
                cursor: loading ? "not-allowed" : "pointer",
                flexShrink: 0,
                fontSize: 17,
                lineHeight: 1,
              }}
            >
              {listening ? "■" : "🎙"}
            </button>

            <button
              type="submit"
              disabled={loading}
              aria-label="Analizar situación"
              style={{
                background: "#16A34A",
                border: "none",
                borderRadius: 12,
                color: "#FFFFFF",
                cursor: loading ? "not-allowed" : "pointer",
                width: 58,
                height: 46,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 22,
                fontWeight: 850,
                flexShrink: 0,
                lineHeight: 1,
                opacity: loading ? 0.7 : 1,
              }}
            >
              →
            </button>
          </div>
        </form>

        {!hasMessages && (
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 8,
              justifyContent: "center",
            }}
          >
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
        )}
      </section>
    </div>
  );
}
