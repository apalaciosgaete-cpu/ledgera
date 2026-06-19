"use client";

import { useState, useEffect, useRef, useCallback } from "react";

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
  // Estado post-envío offline
  const [showOfflineForm, setShowOfflineForm] = useState(false);
  const [offlineName, setOfflineName] = useState("");
  const [offlineEmail, setOfflineEmail] = useState("");
  const [offlineSubmitted, setOfflineSubmitted] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const lastMessageTime = useRef<string>(new Date(0).toISOString());
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const scrollToBottom = () => bottomRef.current?.scrollIntoView({ behavior: "smooth" });

  // Verificar si admin está online
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
        if (data.data.messages?.length) {
          lastMessageTime.current = data.data.messages.at(-1).createdAt;
        }
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

  // Polling mensajes nuevos
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
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [ready, open]);

  useEffect(() => {
    if (open) { setUnread(0); scrollToBottom(); }
  }, [open, messages]);

  const send = async () => {
    if (!input.trim() || sending || !conversationId) return;
    setSending(true);
    const optimistic: Message = { id: `tmp-${Date.now()}`, sender: "USER", content: input.trim(), createdAt: new Date().toISOString() };
    setMessages((prev) => [...prev, optimistic]);
    const text = input.trim();
    setInput("");

    const res = await fetch("/api/chat/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: text }),
    });
    const data = await res.json();
    if (data.ok) {
      setMessages((prev) => prev.map((m) => m.id === optimistic.id ? data.data.message : m));
      lastMessageTime.current = data.data.message.createdAt;
      // Si admin offline → mostrar formulario de contacto
      if (!adminOnline) setShowOfflineForm(true);
    }
    setSending(false);
    scrollToBottom();
  };

  const submitOfflineForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!conversationId) return;
    // Guardar nombre/email actualizando la conversación
    await fetch("/api/chat/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conversationId, name: offlineName, email: offlineEmail }),
    }).catch(() => {});
    setOfflineSubmitted(true);
  };

  return (
    <>
      {/* Botón flotante */}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Abrir chat de soporte"
        style={{
          position: "fixed", bottom: "28px", right: "28px",
          width: "56px", height: "56px", borderRadius: "50%",
          background: open ? "#1e293b" : "#3a76f0",
          border: open ? "1px solid rgba(255,255,255,0.15)" : "none",
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", zIndex: 1000,
          boxShadow: "0 4px 16px rgba(58,118,240,0.35)",
          transition: "background 0.2s",
        }}
      >
        {unread > 0 && !open && (
          <span style={{
            position: "absolute", top: "-4px", right: "-4px",
            background: "#ef4444", color: "#fff", fontSize: "11px", fontWeight: 700,
            width: "20px", height: "20px", borderRadius: "50%",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>{unread}</span>
        )}
        {open ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        ) : (
          <svg width="26" height="26" viewBox="0 0 24 24" fill="#fff">
            <path d="M20 2H4a2 2 0 00-2 2v18l4-4h14a2 2 0 002-2V4a2 2 0 00-2-2z"/>
          </svg>
        )}
      </button>

      {/* Ventana */}
      {open && (
        <div style={{
          position: "fixed", bottom: "96px", right: "28px",
          width: "340px", maxWidth: "calc(100vw - 40px)",
          height: "460px", maxHeight: "calc(100vh - 120px)",
          background: "#0f172a", border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: "16px", display: "flex", flexDirection: "column",
          boxShadow: "0 20px 60px rgba(0,0,0,0.5)", zIndex: 999, overflow: "hidden",
        }}>
          {/* Header */}
          <div style={{
            padding: "1rem 1.2rem", borderBottom: "1px solid rgba(255,255,255,0.08)",
            display: "flex", alignItems: "center", gap: "0.75rem",
          }}>
            <div style={{
              width: "36px", height: "36px", borderRadius: "50%",
              background: "#3a76f0", display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff">
                <path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.658 1.438 5.165L2.196 21.27a.75.75 0 00.933.933l4.102-1.241A9.956 9.956 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2z"/>
              </svg>
            </div>
            <div>
              <p style={{ margin: 0, fontWeight: 700, color: "#f1f5f9", fontSize: "0.9rem" }}>Soporte</p>
              <p style={{ margin: 0, fontSize: "0.72rem", color: adminOnline ? "#22c55e" : "#94a3b8" }}>
                {adminOnline ? "● En línea" : "● Responderemos pronto"}
              </p>
            </div>
          </div>

          {/* Contenido */}
          {initError ? (
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: "0.75rem", padding: "1rem" }}>
              <p style={{ color: "#f87171", fontSize: "0.85rem", textAlign: "center" }}>No se pudo conectar.</p>
              <button onClick={initChat} style={{ color: "#818cf8", background: "none", border: "1px solid rgba(129,140,248,0.3)", borderRadius: "8px", padding: "0.4rem 0.9rem", cursor: "pointer", fontSize: "0.82rem" }}>
                Reintentar
              </button>
            </div>
          ) : offlineSubmitted ? (
            /* Confirmación datos dejados */
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "1.5rem", textAlign: "center", gap: "0.75rem" }}>
              <div style={{ fontSize: "2rem" }}>✅</div>
              <p style={{ color: "#f1f5f9", fontWeight: 600, fontSize: "0.95rem", margin: 0 }}>¡Listo!</p>
              <p style={{ color: "#94a3b8", fontSize: "0.85rem", margin: 0, lineHeight: 1.6 }}>
                Nos contactaremos contigo a la brevedad en <strong style={{ color: "#818cf8" }}>{offlineEmail}</strong>.
              </p>
            </div>
          ) : showOfflineForm ? (
            /* Formulario contacto offline */
            <form onSubmit={submitOfflineForm} style={{ flex: 1, display: "flex", flexDirection: "column", padding: "1.2rem", gap: "0.85rem", overflowY: "auto" }}>
              <div style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: "10px", padding: "0.75rem 1rem" }}>
                <p style={{ color: "#fcd34d", fontSize: "0.82rem", margin: 0, lineHeight: 1.6 }}>
                  En este momento no hay nadie disponible. Deja tus datos y te contactaremos a la brevedad.
                </p>
              </div>
              <input
                value={offlineName}
                onChange={(e) => setOfflineName(e.target.value)}
                placeholder="Tu nombre"
                required
                style={{
                  background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "8px", padding: "0.6rem 0.8rem", color: "#f1f5f9",
                  fontSize: "0.88rem", outline: "none",
                }}
              />
              <input
                value={offlineEmail}
                onChange={(e) => setOfflineEmail(e.target.value)}
                placeholder="Tu correo electrónico"
                type="email"
                required
                style={{
                  background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "8px", padding: "0.6rem 0.8rem", color: "#f1f5f9",
                  fontSize: "0.88rem", outline: "none",
                }}
              />
              <button type="submit" style={{
                background: "#3a76f0", color: "#fff", border: "none",
                borderRadius: "8px", padding: "0.65rem", cursor: "pointer",
                fontWeight: 600, fontSize: "0.88rem",
              }}>
                Enviar y esperar respuesta →
              </button>
              <button type="button" onClick={() => setShowOfflineForm(false)} style={{
                background: "none", border: "none", color: "#64748b",
                fontSize: "0.78rem", cursor: "pointer",
              }}>
                Volver al chat
              </button>
            </form>
          ) : (
            <>
              {/* Mensajes */}
              <div style={{ flex: 1, overflowY: "auto", padding: "1rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {messages.length === 0 && (
                  <div style={{ textAlign: "center", color: "#475569", fontSize: "0.82rem", marginTop: "2rem" }}>
                    {adminOnline
                      ? "👋 Hola, ¿en qué te podemos ayudar? Escríbenos."
                      : "👋 Hola, escríbenos tu consulta y te responderemos pronto."}
                  </div>
                )}
                {messages.map((m) => (
                  <div key={m.id} style={{ display: "flex", justifyContent: m.sender === "USER" ? "flex-end" : "flex-start" }}>
                    <div style={{
                      maxWidth: "80%", padding: "0.5rem 0.8rem",
                      borderRadius: m.sender === "USER" ? "12px 12px 2px 12px" : "12px 12px 12px 2px",
                      background: m.sender === "USER" ? "#3a76f0" : "rgba(255,255,255,0.08)",
                      color: "#f1f5f9", fontSize: "0.85rem", lineHeight: 1.5,
                    }}>
                      {m.content}
                      <div style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.4)", marginTop: "2px", textAlign: "right" }}>
                        {new Date(m.createdAt).toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </div>
                  </div>
                ))}
                {/* Indicador esperando respuesta (offline, mensaje enviado) */}
                {messages.some(m => m.sender === "USER") && !messages.some(m => m.sender === "ADMIN") && !adminOnline && (
                  <div style={{ textAlign: "center", marginTop: "0.5rem" }}>
                    <span style={{ color: "#64748b", fontSize: "0.75rem" }}>
                      ✓ Mensaje recibido — te responderemos pronto
                    </span>
                    <br/>
                    <button
                      onClick={() => setShowOfflineForm(true)}
                      style={{ color: "#818cf8", background: "none", border: "none", fontSize: "0.75rem", cursor: "pointer", marginTop: "4px", textDecoration: "underline" }}
                    >
                      Dejar mis datos de contacto
                    </button>
                  </div>
                )}
                <div ref={bottomRef}/>
              </div>

              {/* Input */}
              <div style={{
                padding: "0.75rem", borderTop: "1px solid rgba(255,255,255,0.08)",
                display: "flex", gap: "0.5rem", alignItems: "flex-end",
              }}>
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
                  placeholder="Escribe tu mensaje..."
                  rows={1}
                  style={{
                    flex: 1, resize: "none", background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px",
                    padding: "0.6rem 0.8rem", color: "#f1f5f9", fontSize: "0.85rem",
                    outline: "none", fontFamily: "inherit",
                  }}
                />
                <button
                  onClick={send}
                  disabled={!input.trim() || sending || !conversationId}
                  style={{
                    background: input.trim() && conversationId ? "#3a76f0" : "rgba(255,255,255,0.06)",
                    border: "none", borderRadius: "8px", padding: "0.6rem 0.9rem",
                    cursor: input.trim() && conversationId ? "pointer" : "default", color: "#fff",
                    transition: "background 0.15s",
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z"/>
                  </svg>
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
