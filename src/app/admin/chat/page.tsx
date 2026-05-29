"use client";

import { useState, useEffect, useRef, useCallback } from "react";

type Message = { id: string; sender: string; content: string; createdAt: string };
type Conversation = {
  id: string; guestName: string; guestEmail: string | null;
  status: string; lastMessage: Message | null; updatedAt: string;
};

const POLL_INTERVAL = 4000;

export default function AdminChatPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [pushSupported, setPushSupported] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastTime = useRef<string>(new Date(0).toISOString());

  const loadConversations = useCallback(async () => {
    const res = await fetch("/api/admin/chat/conversations");
    const data = await res.json();
    if (data.ok) setConversations(data.data);
  }, []);

  const loadMessages = useCallback(async (id: string) => {
    const res = await fetch(`/api/admin/chat/reply?conversationId=${id}`);
    const data = await res.json();
    if (data.ok) {
      setMessages(data.data.messages);
      if (data.data.messages.length) lastTime.current = data.data.messages.at(-1).createdAt;
    }
  }, []);

  useEffect(() => { loadConversations(); }, [loadConversations]);

  useEffect(() => {
    if (!selected) return;
    loadMessages(selected);
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      const res = await fetch(`/api/admin/chat/reply?conversationId=${selected}`);
      const data = await res.json();
      if (data.ok && data.data.messages.length > 0) {
        setMessages(data.data.messages);
        if (data.data.messages.length) lastTime.current = data.data.messages.at(-1).createdAt;
        await loadConversations();
      }
    }, POLL_INTERVAL);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [selected, loadMessages, loadConversations]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if ("serviceWorker" in navigator && "PushManager" in window) {
      setPushSupported(true);
      Notification.requestPermission().then((p) => {
        if (p === "granted") setPushEnabled(true);
      });
    }
  }, []);

  const enablePush = async () => {
    const reg = await navigator.serviceWorker.ready;
    const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!vapidKey) return;
    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: vapidKey,
    });
    await fetch("/api/chat/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(sub.toJSON()),
    });
    setPushEnabled(true);
  };

  const sendReply = async () => {
    if (!reply.trim() || sending || !selected) return;
    setSending(true);
    const res = await fetch("/api/admin/chat/reply", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conversationId: selected, content: reply.trim() }),
    });
    const data = await res.json();
    if (data.ok) {
      setMessages((prev) => [...prev, data.data.message]);
      setReply("");
      await loadConversations();
    }
    setSending(false);
  };

  const selectedConv = conversations.find((c) => c.id === selected);

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0f", color: "#e2e8f0", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div style={{ padding: "1rem 1.5rem", borderBottom: "1px solid rgba(255,255,255,0.08)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700, color: "#f1f5f9" }}>
          💬 Chat — Panel Admin
        </h1>
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          {pushSupported && !pushEnabled && (
            <button
              onClick={enablePush}
              style={{ background: "#3a76f0", border: "none", borderRadius: "8px", padding: "0.45rem 0.9rem", color: "#fff", fontSize: "0.8rem", cursor: "pointer" }}
            >
              🔔 Activar notificaciones push
            </button>
          )}
          {pushEnabled && <span style={{ color: "#22c55e", fontSize: "0.8rem" }}>🔔 Push activo</span>}
          <button
            onClick={loadConversations}
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", padding: "0.45rem 0.8rem", color: "#94a3b8", fontSize: "0.8rem", cursor: "pointer" }}
          >
            ↻ Actualizar
          </button>
        </div>
      </div>

      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* Lista conversaciones */}
        <div style={{ width: "280px", borderRight: "1px solid rgba(255,255,255,0.08)", overflowY: "auto" }}>
          {conversations.length === 0 && (
            <p style={{ color: "#475569", fontSize: "0.85rem", padding: "1.5rem", textAlign: "center" }}>
              Sin conversaciones aún
            </p>
          )}
          {conversations.map((c) => (
            <div
              key={c.id}
              onClick={() => setSelected(c.id)}
              style={{
                padding: "0.85rem 1rem", cursor: "pointer",
                background: selected === c.id ? "rgba(58,118,240,0.15)" : "transparent",
                borderBottom: "1px solid rgba(255,255,255,0.05)",
                borderLeft: selected === c.id ? "3px solid #3a76f0" : "3px solid transparent",
              }}
            >
              <p style={{ margin: "0 0 2px", fontWeight: 600, fontSize: "0.88rem", color: "#f1f5f9" }}>
                {c.guestName}
              </p>
              {c.guestEmail && <p style={{ margin: "0 0 4px", fontSize: "0.75rem", color: "#64748b" }}>{c.guestEmail}</p>}
              {c.lastMessage && (
                <p style={{ margin: 0, fontSize: "0.78rem", color: "#64748b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {c.lastMessage.sender === "ADMIN" ? "Tú: " : ""}{c.lastMessage.content}
                </p>
              )}
              <p style={{ margin: "4px 0 0", fontSize: "0.7rem", color: "#334155" }}>
                {new Date(c.updatedAt).toLocaleString("es-CL", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
          ))}
        </div>

        {/* Panel mensajes */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {!selected ? (
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "#334155" }}>
              Selecciona una conversación
            </div>
          ) : (
            <>
              {/* Sub-header */}
              <div style={{ padding: "0.75rem 1rem", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                <p style={{ margin: 0, fontWeight: 600, fontSize: "0.9rem", color: "#f1f5f9" }}>{selectedConv?.guestName}</p>
                {selectedConv?.guestEmail && <p style={{ margin: 0, fontSize: "0.78rem", color: "#64748b" }}>{selectedConv.guestEmail}</p>}
              </div>

              {/* Mensajes */}
              <div style={{ flex: 1, overflowY: "auto", padding: "1rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {messages.map((m) => (
                  <div key={m.id} style={{ display: "flex", justifyContent: m.sender === "ADMIN" ? "flex-end" : "flex-start" }}>
                    <div style={{
                      maxWidth: "70%", padding: "0.5rem 0.8rem",
                      borderRadius: m.sender === "ADMIN" ? "12px 12px 2px 12px" : "12px 12px 12px 2px",
                      background: m.sender === "ADMIN" ? "#3a76f0" : "rgba(255,255,255,0.08)",
                      color: "#f1f5f9", fontSize: "0.88rem", lineHeight: 1.5,
                    }}>
                      {m.content}
                      <div style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.4)", marginTop: "2px", textAlign: "right" }}>
                        {new Date(m.createdAt).toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={bottomRef}/>
              </div>

              {/* Reply */}
              <div style={{ padding: "0.75rem 1rem", borderTop: "1px solid rgba(255,255,255,0.08)", display: "flex", gap: "0.5rem" }}>
                <textarea
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendReply(); } }}
                  placeholder="Escribe tu respuesta... (Enter para enviar)"
                  rows={2}
                  style={{
                    flex: 1, resize: "none", background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px",
                    padding: "0.6rem 0.8rem", color: "#f1f5f9", fontSize: "0.85rem",
                    outline: "none", fontFamily: "inherit",
                  }}
                />
                <button
                  onClick={sendReply}
                  disabled={!reply.trim() || sending}
                  style={{
                    background: reply.trim() ? "#3a76f0" : "rgba(255,255,255,0.06)",
                    border: "none", borderRadius: "8px", padding: "0.6rem 1rem",
                    cursor: reply.trim() ? "pointer" : "default", color: "#fff",
                  }}
                >
                  Enviar
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
