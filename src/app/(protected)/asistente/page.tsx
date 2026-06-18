"use client";

import { FormEvent, useState } from "react";
import { useAuth } from "@/modules/identity/client/authContext";
import { buildGreeting, resolveProfile } from "@/modules/copilot/domain/ledgeraVoice";

type Message = {
  role: "USER" | "ASSISTANT";
  content: string;
};

export default function AsistentePage() {
  const { user } = useAuth();
  const role = ((user as { role?: string })?.role) ?? "personal";
  const profile = resolveProfile(role);
  const initialGreeting = buildGreeting(profile);

  const [messages, setMessages] = useState<Message[]>([
    {
      role: "ASSISTANT",
      content: initialGreeting,
    },
  ]);
  const [message, setMessage] = useState("");
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = message.trim();
    if (!trimmed || loading) return;

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

      setConversationId(json.data.conversationId);
      setMessages((current) => [...current, { role: "ASSISTANT", content: json.data.answer }]);
    } catch (error) {
      setMessages((current) => [
        ...current,
        { role: "ASSISTANT", content: error instanceof Error ? error.message : "No pude responder ahora." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ maxWidth: 1000, margin: "0 auto", display: "grid", gap: 20 }}>
      <section style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 18, padding: 24 }}>
        <p style={{ color: "#0F766E", fontSize: 12, fontWeight: 850, letterSpacing: "0.06em", margin: "0 0 8px", textTransform: "uppercase" }}>
          LEDGERA AI
        </p>
        <h1 style={{ color: "#0F2A3D", fontSize: "2rem", fontWeight: 900, margin: "0 0 8px" }}>Asistente Tributario</h1>
        <p style={{ color: "#64748B", fontSize: 15, lineHeight: 1.6, margin: 0 }}>
          Pregunta en lenguaje simple: qué es urgente, cómo mejorar tu score, si estás en riesgo o qué recuerda LEDGERA sobre tu historial.
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
        </div>

        <form onSubmit={send} style={{ borderTop: "1px solid #E2E8F0", padding: 14, display: "flex", gap: 10 }}>
          <input
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="Ej: ¿Qué es lo más urgente hoy?"
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
      </section>
    </main>
  );
}
