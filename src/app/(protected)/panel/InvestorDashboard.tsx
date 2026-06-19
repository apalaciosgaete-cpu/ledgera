"use client";

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

// ─── Main Component ───────────────────────────────────────────────────────────

export function InvestorDashboard() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const [query, setQuery] = useState("");
  const [exIdx, setExIdx] = useState(0);
  const [focused, setFocused] = useState(false);

  // Rotate placeholder
  useEffect(() => {
    const t = setInterval(() => setExIdx(i => (i + 1) % EXAMPLES.length), 3500);
    return () => clearInterval(t);
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
        justifyContent: "center",
        textAlign: "center",
        padding: "clamp(64px, 12vh, 130px) 24px 56px",
      }}
    >
      {/* Saludo */}
      <div style={{ marginBottom: 40, maxWidth: 640 }}>
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
      <form onSubmit={handleSubmit} style={{ width: "100%", maxWidth: 640, marginBottom: 18 }}>
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
          maxWidth: 640,
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
  );
}
