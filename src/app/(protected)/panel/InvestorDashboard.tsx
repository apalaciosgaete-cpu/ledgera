"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { fonts } from "@/styles/tokens";

const CHIPS = [
  "Vendí Bitcoin",
  "Recibí USDT",
  "Necesito justificar fondos",
  "Preparar declaración crypto",
];

const MAP_ITEMS = [
  { label: "Comenzar diagnóstico", href: "/conversaciones" },
  { label: "Registrar cryptoactivos", href: "/cryptoactivos" },
  { label: "Trazar origen de fondos", href: "/origen-fondos" },
  { label: "Evaluar obligaciones tributarias", href: "/obligaciones-tributarias" },
  { label: "Agregar documentación", href: "/documentacion" },
];

type OSState = {
  completitud: number;
  riesgo: string;
  pendientes: string[];
};

type OSEvent = {
  id: string;
  label: string;
};

const INITIAL_STATE: OSState = {
  completitud: 0,
  riesgo: "Sin evaluar",
  pendientes: [
    "Cuéntame tu primera situación crypto",
    "Cargar o describir un activo o movimiento",
    "Agregar respaldos cuando existan",
  ],
};

const WELCOME_TEXT = "Bienvenido a LEDGERA. Soy tu Sistema Operativo Financiero y Tributario. Para comenzar, cuéntame qué situación relacionada con cryptoactivos necesitas evaluar.";

const LABEL_STYLE = {
  color: "#334155",
  fontSize: 11,
  fontWeight: 850,
  letterSpacing: "0.09em",
  textTransform: "uppercase" as const,
  margin: "0 0 16px",
  fontFamily: fonts.body,
};

function normalizeSnapshot(json: any): OSState {
  const data = json?.data ?? json;
  const summary = data?.summary ?? data;

  if (!summary) return INITIAL_STATE;

  const readiness = typeof summary.readiness === "number" ? summary.readiness : INITIAL_STATE.completitud;
  const missing = Array.isArray(summary.missing) && summary.missing.length > 0
    ? summary.missing.map((item: string) => `Falta ${item}`)
    : INITIAL_STATE.pendientes;

  return {
    completitud: readiness,
    riesgo: readiness === 0 ? "Sin evaluar" : readiness < 50 ? "Alto" : readiness < 100 ? "Medio" : "Bajo",
    pendientes: missing,
  };
}

function normalizeEvents(json: any): OSEvent[] {
  const data = json?.data ?? json?.events ?? json;
  if (!Array.isArray(data)) return [];
  return data.slice(0, 4).map((event: any, index: number) => ({
    id: String(event.id ?? index),
    label: String(event.description ?? event.event_type ?? event.eventType ?? "Evento registrado"),
  }));
}

export function InvestorDashboard() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const [osState, setOsState] = useState<OSState>(INITIAL_STATE);
  const [events, setEvents] = useState<OSEvent[]>([]);
  const [voiceReady, setVoiceReady] = useState(false);

  useEffect(() => {
    fetch("/api/digital-operating-system", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        if (json) setOsState(normalizeSnapshot(json));
      })
      .catch(() => setOsState(INITIAL_STATE));

    fetch("/api/digital-operating-system/events", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => setEvents(normalizeEvents(json)))
      .catch(() => setEvents([]));
  }, []);

  useEffect(() => {
    setVoiceReady(typeof window !== "undefined" && "speechSynthesis" in window);
  }, []);

  function speakWelcome() {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(WELCOME_TEXT);
    utterance.lang = "es-CL";
    utterance.rate = 0.96;
    utterance.pitch = 0.95;
    window.speechSynthesis.speak(utterance);
  }

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
    <div style={{ minHeight: "calc(100vh - 60px)", background: "#071B28", color: "#E2E8F0", fontFamily: fonts.body, display: "flex", flexDirection: "column", alignItems: "center", padding: "clamp(48px, 8vh, 80px) 24px 72px" }}>
      <div style={{ width: "100%", maxWidth: 640, textAlign: "center", marginBottom: 56 }}>
        <p style={{ color: "#4ADE80", fontSize: 12, fontWeight: 850, letterSpacing: "0.12em", textTransform: "uppercase", margin: "0 0 18px", fontFamily: fonts.body }}>
          Bienvenida LEDGERA
        </p>
        <h1 style={{ color: "#F8FAFC", fontSize: "clamp(2.4rem, 6vw, 3.8rem)", fontWeight: 900, margin: "0 0 4px", lineHeight: 1.04, letterSpacing: "0.12em", fontFamily: fonts.body }}>
          LEDGERA
        </h1>
        <p style={{ color: "#4ADE80", fontSize: 12, fontWeight: 850, letterSpacing: "0.16em", textTransform: "uppercase", margin: "0 0 28px", fontFamily: fonts.body }}>
          SO Financiero y Tributario
        </p>
        <p style={{ color: "#CBD5E1", fontSize: "clamp(1rem, 2.5vw, 1.2rem)", fontWeight: 500, margin: "0 0 14px", lineHeight: 1.6 }}>
          Antes de hablar de patrimonio, necesito entender tu primera situación.
        </p>
        <p style={{ color: "#64748B", fontSize: 15, fontWeight: 450, margin: "0 0 24px", lineHeight: 1.55 }}>
          Cuéntame qué decisión relacionada con cryptoactivos necesitas evaluar.
        </p>

        {voiceReady ? (
          <button type="button" onClick={speakWelcome} style={{ background: "rgba(22,163,74,0.12)", border: "1px solid rgba(74,222,128,0.22)", borderRadius: 999, color: "#4ADE80", cursor: "pointer", fontSize: 13, fontWeight: 800, padding: "8px 14px", marginBottom: 18, fontFamily: fonts.body }}>
            ▶ Escuchar bienvenida
          </button>
        ) : null}

        <form onSubmit={handleSubmit} style={{ marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", background: "rgba(255,255,255,0.04)", border: `1.5px solid ${focused ? "rgba(74,222,128,0.35)" : "rgba(255,255,255,0.10)"}`, borderRadius: 18, padding: "6px 6px 6px 22px", transition: "border-color 0.2s", boxShadow: focused ? "0 0 0 3px rgba(22,163,74,0.08)" : "none" }}>
            <input ref={inputRef} value={query} onChange={(e) => setQuery(e.target.value)} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} placeholder="Ej: vendí Bitcoin, recibí USDT, usé Binance..." autoComplete="off" style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: "#F8FAFC", fontSize: 16, fontFamily: fonts.body, fontWeight: 500, padding: "12px 0", caretColor: "#4ADE80" }} />
            <button type="submit" style={{ background: "#16A34A", border: "none", borderRadius: 12, color: "#FFFFFF", cursor: "pointer", padding: "12px 22px", fontSize: 17, fontWeight: 850, flexShrink: 0, lineHeight: 1 }}>
              →
            </button>
          </div>
        </form>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
          {CHIPS.map((chip) => (
            <button key={chip} onClick={() => sendChip(chip)} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 999, color: "#94A3B8", cursor: "pointer", fontSize: 13, fontWeight: 600, padding: "6px 14px", fontFamily: fonts.body }}>
              {chip}
            </button>
          ))}
        </div>
      </div>

      <div style={{ width: "100%", maxWidth: 520, marginBottom: 44 }}>
        <p style={LABEL_STYLE}>Flujo inicial</p>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "stretch" }}>
          {MAP_ITEMS.map((item, i) => (
            <div key={item.href} style={{ display: "flex", flexDirection: "column" }}>
              <Link href={item.href} style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 16px", borderRadius: 10, textDecoration: "none", color: "#CBD5E1", fontSize: 15, fontWeight: 600, fontFamily: fonts.body, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
                <span style={{ color: "#16A34A", fontSize: 14, flexShrink: 0, lineHeight: 1 }}>●</span>
                {item.label}
              </Link>
              {i < MAP_ITEMS.length - 1 ? <span style={{ color: "rgba(22,163,74,0.35)", fontSize: 13, lineHeight: 1, padding: "7px 0 7px 22px" }}>↓</span> : null}
            </div>
          ))}
        </div>
      </div>

      <div style={{ width: "100%", maxWidth: 520, marginBottom: 40 }}>
        <p style={LABEL_STYLE}>Estado actual</p>
        <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: 24 }}>
          <div style={{ display: "flex", gap: 40, marginBottom: 20 }}>
            <div><p style={{ color: "#475569", fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", margin: "0 0 4px" }}>Completitud</p><p style={{ color: "#4ADE80", fontSize: 24, fontWeight: 850, margin: 0 }}>{osState.completitud}%</p></div>
            <div><p style={{ color: "#475569", fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", margin: "0 0 4px" }}>Riesgo</p><p style={{ color: osState.riesgo === "Sin evaluar" ? "#94A3B8" : "#FCD34D", fontSize: 24, fontWeight: 850, margin: 0 }}>{osState.riesgo}</p></div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {osState.pendientes.map((p, i) => <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}><span style={{ color: "#4ADE80", fontSize: 14 }}>•</span><span style={{ color: "#94A3B8", fontSize: 14, fontWeight: 500 }}>{p}</span></div>)}
          </div>
        </div>
      </div>

      <div style={{ width: "100%", maxWidth: 520, marginBottom: 40 }}>
        <p style={LABEL_STYLE}>Actividad reciente</p>
        {events.length === 0 ? <p style={{ color: "#64748B", fontSize: 14, margin: 0 }}>Aún no hay actividad. La bitácora comenzará cuando describas tu primera situación.</p> : events.map((event) => <div key={event.id} style={{ padding: "10px 16px", borderRadius: 10, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)", color: "#64748B", fontSize: 14 }}>{event.label}</div>)}
      </div>

      <div style={{ width: "100%", maxWidth: 520 }}>
        <p style={LABEL_STYLE}>Próximo paso recomendado</p>
        <div style={{ background: "rgba(22,163,74,0.04)", border: "1px solid rgba(22,163,74,0.14)", borderRadius: 14, padding: "20px 24px" }}>
          <p style={{ color: "#E2E8F0", fontSize: 15, fontWeight: 600, margin: "0 0 18px", lineHeight: 1.45 }}>Iniciar el diagnóstico conversacional antes de clasificar activos o patrimonio.</p>
          <button type="button" onClick={() => inputRef.current?.focus()} style={{ display: "inline-flex", alignItems: "center", padding: "8px 18px", borderRadius: 8, background: "rgba(22,163,74,0.14)", border: "1px solid rgba(22,163,74,0.24)", color: "#4ADE80", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: fonts.body }}>
            Comenzar
          </button>
        </div>
      </div>
    </div>
  );
}
