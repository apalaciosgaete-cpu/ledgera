"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Message = {
  id: string;
  sender: "USER" | "ADMIN";
  content: string;
  createdAt: string;
};

const POLL_INTERVAL = 4000;

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [ready, setReady] = useState(false);
  const [initError, setInitError] = useState(false);
  const [adminOnline, setAdminOnline] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [unread, setUnread] = useState(0);
  const [showOfflineForm, setShowOfflineForm] = useState(false);
  const [offlineName, setOfflineName] = useState("");
  const [offlineEmail, setOfflineEmail] = useState("");
  const [offlineSubmitted, setOfflineSubmitted] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const lastMessageTime = useRef<string>(new Date(0).toISOString());
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const scrollToBottom = () => bottomRef.current?.scrollIntoView({ behavior: "smooth" });

  const checkAdminStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/chat/status");
      const data = await res.json();
      setAdminOnline(data.adminOnline ?? false);
    } catch {
      setAdminOnline(false);
    }
  }, []);

  const initChat = useCallback(async () => {
    try {
      setInitError(false);
      const res = await fetch("/api/chat/init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (data.ok) {
        setConversationId(data.data.conversationId);
        setMessages(data.data.messages ?? []);
        if (data.data.messages?.length) lastMessageTime.current = data.data.messages.at(-1).createdAt;
        setReady(true);
      } else {
        setInitError(true);
      }
    } catch {
      setInitError(true);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    checkAdminStatus();
    if (!ready) initChat();
  }, [open, ready, initChat, checkAdminStatus]);

  useEffect(() => {
    if (!ready || !open) return;
    pollRef.current = setInterval(async () => {
      const res = await fetch(`/api/chat/poll?since=${encodeURIComponent(lastMessageTime.current)}`);
      const data = await res.json();
      if (data.ok && data.data.messages.length > 0) {
        setMessages((prev) => {
          const ids = new Set(prev.map((m) => m.id));
          const newOnes = data.data.messages.filter((m: Message) => !ids.has(m.id));
          if (!newOnes.length) return prev;
          lastMessageTime.current = newOnes.at(-1).createdAt;
          if (!open) setUnread((u) => u + newOnes.filter((m: Message) => m.sender === "ADMIN").length);
          return [...prev, ...newOnes];
        });
      }
    }, POLL_INTERVAL);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [ready, open]);

  useEffect(() => {
    if (open) {
      setUnread(0);
      scrollToBottom();
    }
  }, [open, messages]);

  const send = async () => {
    if (!input.trim() || sending || !conversationId) return;
    setSending(true);
    const text = input.trim();
    const optimistic: Message = {
      id: `tmp-${Date.now()}`,
      sender: "USER",
      content: text,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);
    setInput("");

    const res = await fetch("/api/chat/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: text }),
    });
    const data = await res.json();
    if (data.ok) {
      setMessages((prev) => prev.map((m) => (m.id === optimistic.id ? data.data.message : m)));
      lastMessageTime.current = data.data.message.createdAt;
      if (!adminOnline) setShowOfflineForm(true);
    }
    setSending(false);
    scrollToBottom();
  };

  const submitOfflineForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!conversationId) return;
    await fetch("/api/chat/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conversationId, name: offlineName, email: offlineEmail }),
    }).catch(() => null);
    setOfflineSubmitted(true);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Abrir soporte humano"
        style={{
          position: "fixed",
          bottom: 28,
          right: 28,
          width: 56,
          height: 56,
          borderRadius: "50%",
          background: open ? "#1E293B" : "#0F766E",
          border: open ? "1px solid rgba(255,255,255,0.15)" : "none",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          zIndex: 1000,
          boxShadow: "0 4px 16px rgba(15,118,110,0.35)",
        }}
      >
        {unread > 0 && !open ? (
          <span style={{ position: "absolute", top: -4, right: -4, background: "#EF4444", color: "#FFFFFF", fontSize: 11, fontWeight: 700, width: 20, height: 20, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>{unread}</span>
        ) : null}
        {open ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
        ) : (
          <svg width="26" height="26" viewBox="0 0 24 24" fill="#FFFFFF"><path d="M20 2H4a2 2 0 00-2 2v18l4-4h14a2 2 0 002-2V4a2 2 0 00-2-2z" /></svg>
        )}
      </button>

      {open ? (
        <div style={{ position: "fixed", bottom: 96, right: 28, width: 340, maxWidth: "calc(100vw - 40px)", height: 460, maxHeight: "calc(100vh - 120px)", background: "#0F172A", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16, display: "flex", flexDirection: "column", boxShadow: "0 20px 60px rgba(0,0,0,0.5)", zIndex: 999, overflow: "hidden" }}>
          <div style={{ padding: "1rem 1.2rem", borderBottom: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#0F766E", display: "flex", alignItems: "center", justifyContent: "center", color: "#FFFFFF", fontWeight: 800 }}>H</div>
            <div>
              <p style={{ margin: 0, fontWeight: 700, color: "#F1F5F9", fontSize: "0.9rem" }}>Soporte humano</p>
              <p style={{ margin: 0, fontSize: "0.72rem", color: adminOnline ? "#22C55E" : "#94A3B8" }}>
                {adminOnline ? "● En línea" : "● Responderemos pronto"}
              </p>
            </div>
          </div>

          {initError ? (
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: "0.75rem", padding: "1rem" }}>
              <p style={{ color: "#F87171", fontSize: "0.85rem", textAlign: "center" }}>No se pudo conectar.</p>
              <button type="button" onClick={initChat} style={{ color: "#4ADE80", background: "none", border: "1px solid rgba(74,222,128,0.3)", borderRadius: 8, padding: "0.4rem 0.9rem", cursor: "pointer", fontSize: "0.82rem" }}>Reintentar</button>
            </div>
          ) : offlineSubmitted ? (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "1.5rem", textAlign: "center", gap: "0.75rem" }}>
              <p style={{ color: "#F1F5F9", fontWeight: 600, fontSize: "0.95rem", margin: 0 }}>Listo.</p>
              <p style={{ color: "#94A3B8", fontSize: "0.85rem", margin: 0, lineHeight: 1.6 }}>Nos contactaremos contigo en <strong style={{ color: "#4ADE80" }}>{offlineEmail}</strong>.</p>
            </div>
          ) : showOfflineForm ? (
            <form onSubmit={submitOfflineForm} style={{ flex: 1, display: "flex", flexDirection: "column", padding: "1.2rem", gap: "0.85rem", overflowY: "auto" }}>
              <div style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 10, padding: "0.75rem 1rem" }}>
                <p style={{ color: "#FCD34D", fontSize: "0.82rem", margin: 0, lineHeight: 1.6 }}>Este canal es atendido por una persona. Deja tus datos y responderemos pronto.</p>
              </div>
              <input value={offlineName} onChange={(e) => setOfflineName(e.target.value)} placeholder="Tu nombre" required style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "0.6rem 0.8rem", color: "#F1F5F9", fontSize: "0.88rem", outline: "none" }} />
              <input value={offlineEmail} onChange={(e) => setOfflineEmail(e.target.value)} placeholder="Tu correo electrónico" type="email" required style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "0.6rem 0.8rem", color: "#F1F5F9", fontSize: "0.88rem", outline: "none" }} />
              <button type="submit" style={{ background: "#0F766E", color: "#FFFFFF", border: "none", borderRadius: 8, padding: "0.65rem", cursor: "pointer", fontWeight: 600, fontSize: "0.88rem" }}>Enviar y esperar respuesta →</button>
              <button type="button" onClick={() => setShowOfflineForm(false)} style={{ background: "none", border: "none", color: "#64748B", fontSize: "0.78rem", cursor: "pointer" }}>Volver al chat</button>
            </form>
          ) : (
            <>
              <div style={{ flex: 1, overflowY: "auto", padding: "1rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {messages.length === 0 ? (
                  <div style={{ textAlign: "center", color: "#64748B", fontSize: "0.82rem", marginTop: "2rem", lineHeight: 1.6 }}>
                    Hola. Este es el canal de soporte humano. Para conversar con LEDGERA IA, usa la sección Conversaciones.
                  </div>
                ) : null}
                {messages.map((m) => {
                  const isUser = m.sender === "USER";
                  return (
                    <div key={m.id} style={{ display: "flex", justifyContent: isUser ? "flex-end" : "flex-start" }}>
                      <div style={{ maxWidth: "80%", padding: "0.5rem 0.8rem", borderRadius: isUser ? "12px 12px 2px 12px" : "12px 12px 12px 2px", background: isUser ? "#0F766E" : "rgba(255,255,255,0.08)", color: "#F1F5F9", fontSize: "0.85rem", lineHeight: 1.5 }}>
                        {m.content}
                        <div style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.4)", marginTop: 2, textAlign: "right" }}>{new Date(m.createdAt).toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" })}</div>
                      </div>
                    </div>
                  );
                })}
                {messages.some((m) => m.sender === "USER") && !messages.some((m) => m.sender === "ADMIN") && !adminOnline ? (
                  <div style={{ textAlign: "center", marginTop: "0.5rem" }}>
                    <span style={{ color: "#64748B", fontSize: "0.75rem" }}>✓ Mensaje recibido — te responderemos pronto</span><br />
                    <button type="button" onClick={() => setShowOfflineForm(true)} style={{ color: "#4ADE80", background: "none", border: "none", fontSize: "0.75rem", cursor: "pointer", marginTop: 4, textDecoration: "underline" }}>Dejar mis datos de contacto</button>
                  </div>
                ) : null}
                <div ref={bottomRef} />
              </div>

              <div style={{ padding: "0.75rem", borderTop: "1px solid rgba(255,255,255,0.08)", display: "flex", gap: "0.5rem", alignItems: "flex-end" }}>
                <textarea value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }} placeholder="Escribe tu mensaje..." rows={1} style={{ flex: 1, resize: "none", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "0.6rem 0.8rem", color: "#F1F5F9", fontSize: "0.85rem", outline: "none", fontFamily: "inherit" }} />
                <button type="button" onClick={send} disabled={!input.trim() || sending || !conversationId} style={{ background: input.trim() && conversationId ? "#0F766E" : "rgba(255,255,255,0.06)", border: "none", borderRadius: 8, padding: "0.6rem 0.9rem", cursor: input.trim() && conversationId ? "pointer" : "default", color: "#FFFFFF" }}>Enviar</button>
              </div>
            </>
          )}
        </div>
      ) : null}
    </>
  );
}
