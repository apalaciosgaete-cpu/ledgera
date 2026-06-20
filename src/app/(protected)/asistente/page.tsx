"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/modules/identity/client/authContext";
import { buildGreeting, resolveProfile } from "@/modules/copilot/domain/ledgeraVoice";
import { speakResponse, stopSpeaking } from "@/modules/voice/textToSpeech";
import { VoiceInputController } from "@/components/voice/VoiceInputController";

type Message = {
  role: "USER" | "ASSISTANT";
  content: string;
};

export default function AsistentePage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const role = ((user as { role?: string })?.role) ?? "personal";
  const profile = resolveProfile(role);
  const initialGreeting = buildGreeting(profile);
  const initialQuery = searchParams.get("q")?.trim() ?? "";

  const [messages, setMessages] = useState<Message[]>([
    {
      role: "ASSISTANT",
      content: initialGreeting,
    },
  ]);
  const [message, setMessage] = useState("");
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const autoSentRef = useRef(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return () => stopSpeaking();
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, loading]);

  async function submitMessage(trimmed: string) {
    if (!trimmed || loading) return;

    stopSpeaking();

    setMessages((current) => [...current, { role: "USER", content: trimmed }]);
    setMessage("");
    setLoading(true);

    try {
      const res = await fetch("/api/copilot/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed, conversationId }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.message || "Error del asistente.");

      const answer = json.data.answer;
      setConversationId(json.data.conversationId);
      setMessages((current) => [...current, { role: "ASSISTANT", content: answer }]);
      void speakResponse(answer);
    } catch (error) {
      const fallback = error instanceof Error ? error.message : "No pude responder ahora.";
      setMessages((current) => [...current, { role: "ASSISTANT", content: fallback }]);
      void speakResponse(fallback);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!initialQuery || autoSentRef.current) return;
    autoSentRef.current = true;
    setMessage(initialQuery);
    void submitMessage(initialQuery);
  }, [initialQuery]);

  async function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = message.trim();
    await submitMessage(trimmed);
  }

  function handleVoiceTranscript(transcript: string) {
    setMessage(transcript);
    void submitMessage(transcript.trim());
  }

  function handleBeforeListen() {
    stopSpeaking();
  }

  return (
    <main style={{ maxWidth: 1000, margin: "0 auto", display: "grid", gap: 20 }}>
      <section style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 18, padding: 24 }}>
        <p style={{ color: "#0F766E", fontSize: 12, fontWeight: 850, letterSpacing: "0.06em", margin: "0 0 8px", textTransform: "uppercase" }}>
          LEDGERA AI
        </p>
        <h1 style={{ color: "#0F2A3D", fontSize: "2rem", fontWeight: 900, margin: "0 0 8px" }}>Asistente de Voz</h1>
        <p style={{ color: "#64748B", fontSize: 15, lineHeight: 1.6, margin: 0 }}>
          Habla o escribe en lenguaje simple. LEDGERA escucha, analiza tu contexto y responde también por voz.
        </p>
      </section>

      <section style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 18, minHeight: 520, display: "flex", flexDirection: "column" }}>
        <div style={{ flex: 1, padding: 20, display: "grid", gap: 12, alignContent: "start" }}>
          {messages.map((item, index) => {
            const isUser = item.role === "USER";
            return (
              <div
                key={index}
                style={{
                  justifySelf: isUser ? "end" : "start",
                  maxWidth: "78%",
                  background: isUser ? "#0F766E" : "#F8FAFC",
                  color: isUser ? "#FFFFFF" : "#0F2A3D",
                  border: isUser ? "1px solid #0F766E" : "1px solid #E2E8F0",
                  borderRadius: 16,
                  padding: "12px 14px",
                  fontSize: 14,
                  lineHeight: 1.55,
                }}
              >
                {item.content}
              </div>
            );
          })}
          {loading && <p style={{ color: "#64748B", fontSize: 13, margin: 0 }}>LEDGERA está revisando tu contexto…</p>}
          <div ref={scrollRef} />
        </div>

        <div style={{ borderTop: "1px solid #E2E8F0", padding: 14, display: "grid", gap: 10 }}>
          <VoiceInputController onTranscript={handleVoiceTranscript} onBeforeListen={handleBeforeListen} disabled={loading} />

          <form onSubmit={send} style={{ display: "flex", gap: 10 }}>
            <input
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Ej: vendí BTC en Binance y retiré al banco"
              style={{ flex: 1, border: "1px solid #CBD5E1", borderRadius: 12, padding: "12px 14px", fontSize: 14 }}
            />
            <button
              type="submit"
              disabled={loading}
              style={{ background: "#0F766E", border: "none", borderRadius: 12, color: "#FFFFFF", fontWeight: 850, padding: "0 18px", cursor: loading ? "not-allowed" : "pointer" }}
            >
              Enviar
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
