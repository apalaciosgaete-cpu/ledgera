"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { fonts } from "@/styles/tokens";

// ─── Constants ────────────────────────────────────────────────────────────────

const EXAMPLES = [
  "Vendí Bitcoin el mes pasado",
  "Quiero crear una SpA",
  "Recibí USDT desde el extranjero",
  "Voy a comprar un inmueble",
  "Necesito preparar mi declaración",
  "Tengo ganancias en staking",
];

type Conversation = {
  id: string;
  title: string;
  lastMessageAt: string;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Ahora";
  if (mins < 60) return `Hace ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `Hace ${hrs} h`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return "Ayer";
  if (days < 7) return `Hace ${days} días`;
  return new Date(iso).toLocaleDateString("es-CL", { day: "numeric", month: "short" });
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function InvestorDashboard() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const [query, setQuery] = useState("");
  const [exIdx, setExIdx] = useState(0);
  const [focused, setFocused] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loadingConvs, setLoadingConvs] = useState(true);

  // Rotate placeholder
  useEffect(() => {
    const t = setInterval(() => setExIdx(i => (i + 1) % EXAMPLES.length), 3500);
    return () => clearInterval(t);
  }, []);

  // Fetch recent conversations
  useEffect(() => {
    fetch("/api/copilot/conversations?limit=5", { cache: "no-store" })
      .then(r => r.json())
      .then(json => {
        if (json.ok && Array.isArray(json.data)) {
          setConversations(json.data);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingConvs(false));
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    router.push(`/asistente?q=${encodeURIComponent(q)}`);
  }

  function useExample(ex: string) {
    setQuery(ex);
    inputRef.current?.focus();
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
        padding: "clamp(48px, 8vh, 90px) 24px 40px",
      }}
    >
      {/* ── HERO: Saludo + Input ── */}
      <div style={{ width: "100%", maxWidth: 640, textAlign: "center" }}>
        {/* Branding OS */}
        <p
          style={{
            color: "#334155",
            fontSize: 11,
            fontWeight: 850,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            margin: "0 0 16px",
            fontFamily: fonts.body,
          }}
        >
          Sistema Operativo Financiero y Tributario
        </p>

        <div style={{ marginBottom: 40 }}>
          <h1
            style={{
              color: "#F8FAFC",
              fontSize: "clamp(2rem, 5vw, 3.4rem)",
              fontWeight: 850,
              margin: "0 0 6px",
              lineHeight: 1.06,
              fontFamily: fonts.body,
              letterSpacing: "-0.01em",
            }}
          >
            Hola.
          </h1>
          <p
            style={{
              color: "#4ADE80",
              fontSize: "clamp(0.9rem, 2vw, 1.2rem)",
              fontWeight: 700,
              margin: "0 0 10px",
              lineHeight: 1.3,
            }}
          >
            Soy LEDGERA.
          </p>
          <p
            style={{
              color: "#64748B",
              fontSize: "clamp(1rem, 2.5vw, 1.35rem)",
              fontWeight: 450,
              margin: 0,
              lineHeight: 1.45,
            }}
          >
            ¿Qué necesitas resolver hoy?
          </p>
        </div>

        {/* Input conversacional */}
        <form onSubmit={handleSubmit} style={{ marginBottom: 18 }}>
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
              onChange={e => setQuery(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              placeholder={EXAMPLES[exIdx]}
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
                transition: "background 0.15s",
                lineHeight: 1,
              }}
            >
              →
            </button>
          </div>
        </form>

        {/* Ejemplos dinámicos */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 8,
            justifyContent: "center",
          }}
        >
          {EXAMPLES.slice(0, 4).map(ex => (
            <button
              key={ex}
              onClick={() => useExample(ex)}
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 999,
                color: "#475569",
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 500,
                padding: "5px 14px",
                fontFamily: fonts.body,
                transition: "color 0.15s, border-color 0.15s",
              }}
            >
              {ex}
            </button>
          ))}
        </div>
      </div>

      {/* ── CONVERSACIONES RECIENTES ── */}
      <div style={{ width: "100%", maxWidth: 640, marginTop: 56 }}>
        <p
          style={{
            color: "#334155",
            fontSize: 11,
            fontWeight: 850,
            letterSpacing: "0.09em",
            textTransform: "uppercase",
            margin: "0 0 16px",
            fontFamily: fonts.body,
          }}
        >
          Conversaciones recientes
        </p>

        {loadingConvs ? (
          <p style={{ color: "#475569", fontSize: 13, margin: 0 }}>
            Cargando...
          </p>
        ) : conversations.length === 0 ? (
          <div
            style={{
              background: "rgba(255,255,255,0.02)",
              border: "1px dashed rgba(255,255,255,0.08)",
              borderRadius: 14,
              padding: "28px 24px",
              textAlign: "center",
            }}
          >
            <p style={{ color: "#475569", fontSize: 14, margin: "0 0 4px" }}>
              Aún no tienes conversaciones.
            </p>
            <p style={{ color: "#334155", fontSize: 13, margin: 0 }}>
              Escribe tu primera consulta arriba o haz clic en{" "}
              <strong style={{ color: "#64748B" }}>+ Nueva conversación</strong>.
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {conversations.map(conv => (
              <Link
                key={conv.id}
                href={`/asistente?conversationId=${conv.id}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 16,
                  padding: "12px 18px",
                  borderRadius: 12,
                  background: "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(255,255,255,0.05)",
                  textDecoration: "none",
                  transition: "background 0.15s, border-color 0.15s",
                }}
              >
                <span
                  style={{
                    color: "#CBD5E1",
                    fontSize: 14,
                    fontWeight: 600,
                    fontFamily: fonts.body,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    flex: 1,
                    textAlign: "left",
                  }}
                >
                  {conv.title}
                </span>
                <span
                  style={{
                    color: "#475569",
                    fontSize: 12,
                    flexShrink: 0,
                    fontFamily: fonts.body,
                  }}
                >
                  {timeAgo(conv.lastMessageAt)}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
