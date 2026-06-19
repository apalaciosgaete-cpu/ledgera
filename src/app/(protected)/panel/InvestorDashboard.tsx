"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { cryptoFirstModules } from "@/modules/digital-operating-system";
import { fonts } from "@/styles/tokens";

const EXAMPLES = [
  "Vendí Bitcoin y retiré fondos al banco",
  "Recibí USDT desde Binance",
  "Necesito justificar origen de fondos",
  "Quiero preparar mi declaración crypto",
];

type Conversation = { id: string; title: string; lastMessageAt: string };
type EventRow = { id?: string; description?: string; event_type?: string; eventType?: string; created_at?: string; createdAt?: string };
type Snapshot = {
  cryptoAssets: unknown[];
  exchangeAccounts: unknown[];
  wallets: unknown[];
  sourcesOfFunds: unknown[];
  taxObligations: unknown[];
  documents: unknown[];
  events?: EventRow[];
  summary?: { readiness?: number; status?: string; missing?: string[] };
};

function timeAgo(iso?: string): string {
  if (!iso) return "Ahora";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Ahora";
  if (mins < 60) return `Hace ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `Hace ${hrs} h`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return "Ayer";
  return `Hace ${days} días`;
}

function readiness(snapshot: Snapshot | null) {
  if (snapshot?.summary?.readiness !== undefined) return snapshot.summary.readiness;
  if (!snapshot) return 0;
  const done = [snapshot.cryptoAssets.length, snapshot.sourcesOfFunds.length, snapshot.documents.length].filter((n) => n > 0).length;
  return Math.round((done / 3) * 100);
}

function riskLabel(snapshot: Snapshot | null) {
  const missing = snapshot?.summary?.missing?.length ?? 0;
  if (!snapshot) return "Sin evaluar";
  if (missing >= 3) return "Alto";
  if (missing >= 1) return "Medio";
  return "Bajo";
}

function pendingItems(snapshot: Snapshot | null) {
  const missing = snapshot?.summary?.missing;
  if (missing?.length) return missing.map((item) => `Falta ${item}`);
  if (!snapshot) return ["Cargar información patrimonial inicial"];
  return ["Revisar consistencia documental", "Completar trazabilidad si corresponde"];
}

function recentEvents(snapshot: Snapshot | null, conversations: Conversation[]) {
  const events = snapshot?.events?.slice(0, 4).map((event) => ({
    title: event.description ?? event.event_type ?? event.eventType ?? "Evento registrado",
    time: timeAgo(event.created_at ?? event.createdAt),
  })) ?? [];

  if (events.length) return events;
  return conversations.slice(0, 3).map((conv) => ({ title: conv.title, time: timeAgo(conv.lastMessageAt) }));
}

function recommendedAction(snapshot: Snapshot | null) {
  const missing = snapshot?.summary?.missing ?? [];
  if (missing.some((item) => item.includes("origen"))) return "Completar trazabilidad de origen de fondos.";
  if (missing.some((item) => item.includes("document"))) return "Agregar documentación de respaldo.";
  if ((snapshot?.cryptoAssets.length ?? 0) === 0) return "Registrar cryptoactivos principales.";
  return "Revisar obligaciones tributarias asociadas al patrimonio digital.";
}

export function InvestorDashboard() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [exIdx, setExIdx] = useState(0);
  const [focused, setFocused] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);

  useEffect(() => {
    const t = setInterval(() => setExIdx((i) => (i + 1) % EXAMPLES.length), 3500);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    fetch("/api/digital-operating-system", { cache: "no-store" })
      .then((r) => r.json())
      .then((json) => { if (json.ok) setSnapshot(json.data); })
      .catch(() => null);

    fetch("/api/copilot/conversations?limit=5", { cache: "no-store" })
      .then((r) => r.json())
      .then((json) => { if (json.ok && Array.isArray(json.data)) setConversations(json.data); })
      .catch(() => null);
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    router.push(`/conversaciones?q=${encodeURIComponent(q)}&scope=crypto-first`);
  }

  function useExample(ex: string) {
    setQuery(ex);
    inputRef.current?.focus();
  }

  const flow = cryptoFirstModules;
  const events = recentEvents(snapshot, conversations);
  const pending = pendingItems(snapshot);

  return (
    <div style={{ minHeight: "calc(100vh - 60px)", background: "#071B28", color: "#E2E8F0", fontFamily: fonts.body, display: "flex", flexDirection: "column", alignItems: "center", padding: "clamp(42px, 7vh, 78px) 24px 52px" }}>
      <section style={{ width: "100%", maxWidth: 760, textAlign: "center" }}>
        <h1 style={{ color: "#F8FAFC", fontSize: "clamp(2.35rem, 6vw, 4.2rem)", fontWeight: 900, margin: "0 0 8px", lineHeight: 0.96, fontFamily: fonts.display, letterSpacing: "0.14em" }}>LEDGERA</h1>
        <p style={{ color: "#4ADE80", fontSize: "clamp(0.78rem, 2vw, 0.95rem)", fontWeight: 850, letterSpacing: "0.18em", textTransform: "uppercase", margin: "0 0 34px", fontFamily: fonts.body }}>SO Financiero y Tributario</p>
        <p style={{ color: "#CBD5E1", fontSize: "clamp(1.1rem, 2.5vw, 1.45rem)", fontWeight: 500, margin: "0 0 22px", lineHeight: 1.45 }}>¿Qué decisión relacionada con cryptoactivos necesitas evaluar?</p>

        <form onSubmit={handleSubmit} style={{ marginBottom: 18 }}>
          <div style={{ display: "flex", alignItems: "center", background: "rgba(255,255,255,0.045)", border: `1.5px solid ${focused ? "rgba(74,222,128,0.38)" : "rgba(255,255,255,0.10)"}`, borderRadius: 18, padding: "6px 6px 6px 22px", boxShadow: focused ? "0 0 0 3px rgba(22,163,74,0.08)" : "none" }}>
            <input ref={inputRef} value={query} onChange={(event) => setQuery(event.target.value)} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} placeholder={EXAMPLES[exIdx]} autoComplete="off" style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: "#F8FAFC", fontSize: 16, fontFamily: fonts.body, fontWeight: 500, padding: "12px 0", caretColor: "#4ADE80" }} />
            <button type="submit" style={{ background: "#16A34A", border: "none", borderRadius: 12, color: "#FFFFFF", cursor: "pointer", padding: "12px 22px", fontSize: 17, fontWeight: 850, flexShrink: 0, lineHeight: 1 }}>→</button>
          </div>
        </form>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
          {EXAMPLES.map((ex) => <button key={ex} onClick={() => useExample(ex)} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 999, color: "#94A3B8", cursor: "pointer", fontSize: 13, fontWeight: 600, padding: "7px 14px", fontFamily: fonts.body }}>{ex}</button>)}
        </div>
      </section>

      <section style={{ width: "100%", maxWidth: 680, marginTop: 54, textAlign: "center" }}>
        <p style={{ color: "#334155", fontSize: 11, fontWeight: 850, letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 18px" }}>Mapa patrimonial</p>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
          {flow.map((item, index) => (
            <div key={item.href} style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%" }}>
              <Link href={item.href} style={{ width: "min(100%, 420px)", border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.025)", borderRadius: 16, padding: "14px 18px", color: "#E2E8F0", textDecoration: "none", fontWeight: 800 }}>
                {item.label}
              </Link>
              {index < flow.length - 1 ? <span style={{ color: "#16A34A", margin: "8px 0 0", fontWeight: 900 }}>↓</span> : null}
            </div>
          ))}
        </div>
      </section>

      <section style={{ width: "100%", maxWidth: 860, marginTop: 46, display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))" }}>
        <article style={{ border: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.025)", borderRadius: 18, padding: 22 }}>
          <p style={{ color: "#334155", fontSize: 11, fontWeight: 850, letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 16px" }}>Estado actual</p>
          <div style={{ display: "grid", gap: 12 }}>
            <div><span style={{ color: "#64748B", fontSize: 13 }}>Completitud</span><strong style={{ display: "block", color: "#4ADE80", fontSize: 28 }}>{readiness(snapshot)}%</strong></div>
            <div><span style={{ color: "#64748B", fontSize: 13 }}>Riesgo</span><strong style={{ display: "block", color: "#CBD5E1", fontSize: 20 }}>{riskLabel(snapshot)}</strong></div>
            <div><span style={{ color: "#64748B", fontSize: 13 }}>Pendientes</span><ul style={{ margin: "8px 0 0", paddingLeft: 18 }}>{pending.slice(0, 3).map((item) => <li key={item} style={{ color: "#94A3B8", fontSize: 13, lineHeight: 1.6 }}>{item}</li>)}</ul></div>
          </div>
        </article>

        <article style={{ border: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.025)", borderRadius: 18, padding: 22 }}>
          <p style={{ color: "#334155", fontSize: 11, fontWeight: 850, letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 16px" }}>Actividad reciente</p>
          <div style={{ display: "grid", gap: 10 }}>
            {events.length ? events.map((event) => <div key={`${event.title}-${event.time}`} style={{ display: "flex", justifyContent: "space-between", gap: 12 }}><span style={{ color: "#CBD5E1", fontSize: 13 }}>{event.title}</span><span style={{ color: "#475569", fontSize: 12 }}>{event.time}</span></div>) : <p style={{ color: "#64748B", fontSize: 13, margin: 0 }}>Sin actividad reciente.</p>}
          </div>
        </article>

        <article style={{ border: "1px solid rgba(74,222,128,0.16)", background: "rgba(22,163,74,0.05)", borderRadius: 18, padding: 22, gridColumn: "1 / -1" }}>
          <p style={{ color: "#4ADE80", fontSize: 11, fontWeight: 850, letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 10px" }}>Próximo paso recomendado</p>
          <p style={{ color: "#E2E8F0", fontSize: 18, fontWeight: 750, margin: "0 0 16px" }}>{recommendedAction(snapshot)}</p>
          <Link href="/origen-fondos" style={{ display: "inline-flex", border: "1px solid rgba(74,222,128,0.28)", borderRadius: 999, color: "#4ADE80", textDecoration: "none", padding: "8px 14px", fontSize: 13, fontWeight: 800 }}>Revisar</Link>
        </article>
      </section>
    </div>
  );
}
