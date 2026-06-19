"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { fonts } from "@/styles/tokens";

// UX 3.1.0 — Workspace Conversacional Definitivo

const CHIPS = [
  "Vendí Bitcoin",
  "Recibí USDT",
  "Origen de Fondos",
  "Declaración Crypto",
];

const MAP_ITEMS = [
  { label: "Patrimonio Digital", href: "/patrimonio-digital" },
  { label: "Cryptoactivos", href: "/cryptoactivos" },
  { label: "Exchanges", href: "/exchanges" },
  { label: "Wallets", href: "/wallets" },
  { label: "Origen de Fondos", href: "/origen-fondos" },
  { label: "Obligaciones Tributarias", href: "/obligaciones-tributarias" },
  { label: "Documentación", href: "/documentacion" },
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

const DEFAULT_STATE: OSState = {
  completitud: 78,
  riesgo: "Medio",
  pendientes: [
    "Falta origen de fondos",
    "Falta CSV Binance",
    "Falta documentación wallet",
  ],
};

const DEFAULT_EVENTS: OSEvent[] = [
  { id: "1", label: "Wallet registrada" },
  { id: "2", label: "CSV Binance cargado" },
  { id: "3", label: "Documento agregado" },
  { id: "4", label: "Obligación detectada" },
];

const LABEL_STYLE = {
  color: "#334155",
  fontSize: 11,
  fontWeight: 850,
  letterSpacing: "0.09em",
  textTransform: "uppercase" as const,
  margin: "0 0 16px",
  fontFamily: fonts.body,
};

export function InvestorDashboard() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const [osState, setOsState] = useState<OSState>(DEFAULT_STATE);
  const [events, setEvents] = useState<OSEvent[]>(DEFAULT_EVENTS);

  useEffect(() => {
    fetch("/api/digital-operating-system")
      .then(r => r.ok ? r.json() : null)
      .then(json => {
        if (json?.completitud !== undefined) setOsState(json);
      })
      .catch(() => {});

    fetch("/api/digital-operating-system/events")
      .then(r => r.ok ? r.json() : null)
      .then(json => {
        if (Array.isArray(json?.events)) setEvents(json.events);
      })
      .catch(() => {});
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    router.push(`/asistente?q=${encodeURIComponent(q)}`);
  }

  function sendChip(chip: string) {
    router.push(`/asistente?q=${encodeURIComponent(chip)}`);
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
        padding: "clamp(48px, 8vh, 80px) 24px 72px",
      }}
    >

      {/* ── HERO CONVERSACIONAL ── */}
      <div
        style={{
          width: "100%",
          maxWidth: 600,
          textAlign: "center",
          marginBottom: 64,
        }}
      >
        <h1
          style={{
            color: "#F8FAFC",
            fontSize: "clamp(2.4rem, 6vw, 3.8rem)",
            fontWeight: 900,
            margin: "0 0 4px",
            lineHeight: 1.04,
            letterSpacing: "-0.02em",
            fontFamily: fonts.body,
          }}
        >
          LEDGERA
        </h1>
        <p
          style={{
            color: "#334155",
            fontSize: 11,
            fontWeight: 850,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            margin: "0 0 28px",
            fontFamily: fonts.body,
          }}
        >
          SO Financiero y Tributario
        </p>
        <p
          style={{
            color: "#64748B",
            fontSize: "clamp(0.95rem, 2.5vw, 1.15rem)",
            fontWeight: 450,
            margin: "0 0 28px",
            lineHeight: 1.55,
          }}
        >
          ¿Qué decisión relacionada con cryptoactivos<br />necesitas evaluar?
        </p>

        {/* Input conversacional */}
        <form onSubmit={handleSubmit} style={{ marginBottom: 14 }}>
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
              placeholder="¿Qué necesitas evaluar?"
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

        {/* Chips de acción rápida */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 8,
            justifyContent: "center",
          }}
        >
          {CHIPS.map(chip => (
            <button
              key={chip}
              onClick={() => sendChip(chip)}
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
              {chip}
            </button>
          ))}
        </div>
      </div>

      {/* ── MAPA PATRIMONIAL ── */}
      <div style={{ width: "100%", maxWidth: 520, marginBottom: 48 }}>
        <p style={LABEL_STYLE}>Mapa Patrimonial</p>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "stretch" }}>
          {MAP_ITEMS.map((item, i) => (
            <div key={item.href} style={{ display: "flex", flexDirection: "column" }}>
              <Link
                href={item.href}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "11px 16px",
                  borderRadius: 10,
                  textDecoration: "none",
                  color: "#CBD5E1",
                  fontSize: 15,
                  fontWeight: 600,
                  fontFamily: fonts.body,
                  background: "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(255,255,255,0.05)",
                  transition: "background 0.15s, border-color 0.15s",
                }}
              >
                <span style={{ color: "#16A34A", fontSize: 14, flexShrink: 0, lineHeight: 1 }}>●</span>
                {item.label}
              </Link>
              {i < MAP_ITEMS.length - 1 && (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-start",
                    paddingLeft: 22,
                  }}
                >
                  <div
                    style={{
                      width: 1,
                      height: 7,
                      background: "rgba(22,163,74,0.2)",
                      marginLeft: 6,
                    }}
                  />
                  <span
                    style={{
                      color: "rgba(22,163,74,0.35)",
                      fontSize: 11,
                      lineHeight: 1,
                      marginLeft: 1,
                    }}
                  >
                    ↓
                  </span>
                  <div
                    style={{
                      width: 1,
                      height: 7,
                      background: "rgba(22,163,74,0.2)",
                      marginLeft: 6,
                    }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── ESTADO ACTUAL ── */}
      <div style={{ width: "100%", maxWidth: 520, marginBottom: 40 }}>
        <p style={LABEL_STYLE}>Estado Actual</p>

        <div
          style={{
            background: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 14,
            padding: "24px",
          }}
        >
          <div style={{ display: "flex", gap: 40, marginBottom: 20 }}>
            <div>
              <p
                style={{
                  color: "#475569",
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  margin: "0 0 4px",
                  fontFamily: fonts.body,
                }}
              >
                Completitud
              </p>
              <p
                style={{
                  color: "#4ADE80",
                  fontSize: 24,
                  fontWeight: 850,
                  margin: 0,
                  fontFamily: fonts.body,
                }}
              >
                {osState.completitud}%
              </p>
            </div>
            <div>
              <p
                style={{
                  color: "#475569",
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  margin: "0 0 4px",
                  fontFamily: fonts.body,
                }}
              >
                Riesgo
              </p>
              <p
                style={{
                  color: "#FCD34D",
                  fontSize: 24,
                  fontWeight: 850,
                  margin: 0,
                  fontFamily: fonts.body,
                }}
              >
                {osState.riesgo}
              </p>
            </div>
          </div>

          <div>
            <p
              style={{
                color: "#475569",
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                margin: "0 0 10px",
                fontFamily: fonts.body,
              }}
            >
              Pendientes
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {osState.pendientes.map((p, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ color: "#EF4444", fontSize: 14, flexShrink: 0 }}>•</span>
                  <span
                    style={{
                      color: "#94A3B8",
                      fontSize: 14,
                      fontWeight: 500,
                      fontFamily: fonts.body,
                    }}
                  >
                    {p}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── ACTIVIDAD RECIENTE ── */}
      <div style={{ width: "100%", maxWidth: 520, marginBottom: 40 }}>
        <p style={LABEL_STYLE}>Actividad Reciente</p>

        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {events.map(event => (
            <div
              key={event.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 16px",
                borderRadius: 10,
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.04)",
              }}
            >
              <span style={{ color: "#334155", fontSize: 14, flexShrink: 0 }}>—</span>
              <span
                style={{
                  color: "#64748B",
                  fontSize: 14,
                  fontWeight: 500,
                  fontFamily: fonts.body,
                }}
              >
                {event.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── RECOMENDACIÓN LEDGERA ── */}
      <div style={{ width: "100%", maxWidth: 520 }}>
        <p style={LABEL_STYLE}>Recomendación LEDGERA</p>

        <div
          style={{
            background: "rgba(22,163,74,0.04)",
            border: "1px solid rgba(22,163,74,0.14)",
            borderRadius: 14,
            padding: "20px 24px",
          }}
        >
          <p
            style={{
              color: "#475569",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              margin: "0 0 6px",
              fontFamily: fonts.body,
            }}
          >
            Próximo paso recomendado
          </p>
          <p
            style={{
              color: "#E2E8F0",
              fontSize: 15,
              fontWeight: 600,
              margin: "0 0 18px",
              lineHeight: 1.45,
              fontFamily: fonts.body,
            }}
          >
            Completar trazabilidad de fondos<br />para Binance
          </p>
          <Link
            href="/bank"
            style={{
              display: "inline-flex",
              alignItems: "center",
              padding: "8px 18px",
              borderRadius: 8,
              background: "rgba(22,163,74,0.14)",
              border: "1px solid rgba(22,163,74,0.24)",
              color: "#4ADE80",
              fontSize: 13,
              fontWeight: 700,
              textDecoration: "none",
              fontFamily: fonts.body,
              transition: "background 0.15s",
            }}
          >
            Revisar
          </Link>
        </div>
      </div>
    </div>
  );
}
