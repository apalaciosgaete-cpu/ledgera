"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { cryptoFirstModules } from "@/modules/digital-operating-system";
import { fonts } from "@/styles/tokens";

const EXAMPLES = [
  "Vendí Bitcoin el mes pasado",
  "Recibí USDT desde Binance",
  "Tengo fondos en una wallet Ledger",
  "Necesito regularizar movimientos crypto",
  "Tengo ganancias por staking",
  "Quiero preparar mi declaración por cryptoactivos",
];

type Conversation = { id: string; title: string; lastMessageAt: string };
type Snapshot = {
  cryptoAssets: unknown[];
  exchangeAccounts: unknown[];
  wallets: unknown[];
  sourcesOfFunds: unknown[];
  taxObligations: unknown[];
  documents: unknown[];
};

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

function moduleCount(snapshot: Snapshot | null, key: string) {
  if (!snapshot) return "—";
  if (key === "digitalWealth") return String(snapshot.cryptoAssets.length + snapshot.exchangeAccounts.length + snapshot.wallets.length);
  if (key === "cryptoAssets") return String(snapshot.cryptoAssets.length);
  if (key === "exchanges") return String(snapshot.exchangeAccounts.length);
  if (key === "wallets") return String(snapshot.wallets.length);
  if (key === "sourceOfFunds") return String(snapshot.sourcesOfFunds.length);
  if (key === "taxObligations") return String(snapshot.taxObligations.length);
  if (key === "documentation") return String(snapshot.documents.length);
  return "—";
}

export function InvestorDashboard() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [exIdx, setExIdx] = useState(0);
  const [focused, setFocused] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loadingConvs, setLoadingConvs] = useState(true);
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
      .catch(() => null)
      .finally(() => setLoadingConvs(false));
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

  return (
    <div style={{ minHeight: "calc(100vh - 60px)", background: "#071B28", color: "#E2E8F0", fontFamily: fonts.body, display: "flex", flexDirection: "column", alignItems: "center", padding: "clamp(40px, 7vh, 76px) 24px 40px" }}>
      <div style={{ width: "100%", maxWidth: 720, textAlign: "center" }}>
        <h1 style={{ color: "#F8FAFC", fontSize: "clamp(2.25rem, 6vw, 4rem)", fontWeight: 900, margin: "0 0 8px", lineHeight: 0.96, fontFamily: fonts.display, letterSpacing: "0.14em" }}>LEDGERA</h1>
        <p style={{ color: "#4ADE80", fontSize: "clamp(0.78rem, 2vw, 0.95rem)", fontWeight: 850, letterSpacing: "0.18em", textTransform: "uppercase", margin: "0 0 34px", fontFamily: fonts.body }}>SO Financiero y Tributario</p>
        <p style={{ color: "#64748B", fontSize: "clamp(1rem, 2.5vw, 1.28rem)", fontWeight: 450, margin: "0 0 22px", lineHeight: 1.45 }}>¿Qué decisión relacionada con cryptoactivos necesitas evaluar?</p>

        <form onSubmit={handleSubmit} style={{ marginBottom: 18 }}>
          <div style={{ display: "flex", alignItems: "center", background: "rgba(255,255,255,0.04)", border: `1.5px solid ${focused ? "rgba(74,222,128,0.35)" : "rgba(255,255,255,0.10)"}`, borderRadius: 18, padding: "6px 6px 6px 22px", boxShadow: focused ? "0 0 0 3px rgba(22,163,74,0.08)" : "none" }}>
            <input ref={inputRef} value={query} onChange={(event) => setQuery(event.target.value)} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} placeholder={EXAMPLES[exIdx]} autoComplete="off" style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: "#F8FAFC", fontSize: 16, fontFamily: fonts.body, fontWeight: 500, padding: "12px 0", caretColor: "#4ADE80" }} />
            <button type="submit" style={{ background: "#16A34A", border: "none", borderRadius: 12, color: "#FFFFFF", cursor: "pointer", padding: "12px 22px", fontSize: 17, fontWeight: 850, flexShrink: 0, lineHeight: 1 }}>→</button>
          </div>
        </form>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
          {EXAMPLES.slice(0, 4).map((ex) => <button key={ex} onClick={() => useExample(ex)} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 999, color: "#64748B", cursor: "pointer", fontSize: 13, fontWeight: 550, padding: "6px 14px", fontFamily: fonts.body }}>{ex}</button>)}
        </div>
      </div>

      <section style={{ width: "100%", maxWidth: 980, marginTop: 48 }}>
        <p style={{ color: "#334155", fontSize: 11, fontWeight: 850, letterSpacing: "0.09em", textTransform: "uppercase", margin: "0 0 16px", fontFamily: fonts.body }}>Patrimonio digital</p>
        <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
          {cryptoFirstModules.slice(0, 7).map((item) => (
            <Link key={item.href} href={item.href} style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, padding: 18, textDecoration: "none" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                <h2 style={{ color: "#E2E8F0", fontSize: 16, fontWeight: 850, margin: "0 0 8px", fontFamily: fonts.body }}>{item.label}</h2>
                <span style={{ color: "#4ADE80", fontSize: 13, fontWeight: 850 }}>{moduleCount(snapshot, item.key)}</span>
              </div>
              <p style={{ color: "#475569", fontSize: 13, lineHeight: 1.55, margin: 0, fontFamily: fonts.body }}>{item.description}</p>
            </Link>
          ))}
        </div>
      </section>

      <section style={{ width: "100%", maxWidth: 720, marginTop: 44 }}>
        <p style={{ color: "#334155", fontSize: 11, fontWeight: 850, letterSpacing: "0.09em", textTransform: "uppercase", margin: "0 0 16px", fontFamily: fonts.body }}>Conversaciones recientes</p>
        {loadingConvs ? <p style={{ color: "#475569", fontSize: 13, margin: 0 }}>Cargando...</p> : conversations.length === 0 ? (
          <div style={{ background: "rgba(255,255,255,0.02)", border: "1px dashed rgba(255,255,255,0.08)", borderRadius: 14, padding: "28px 24px", textAlign: "center" }}>
            <p style={{ color: "#475569", fontSize: 14, margin: "0 0 4px" }}>Aún no tienes conversaciones.</p>
            <p style={{ color: "#334155", fontSize: 13, margin: 0 }}>Describe tu primera situación con cryptoactivos arriba.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {conversations.map((conv) => <Link key={conv.id} href={`/conversaciones?conversationId=${conv.id}`} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, padding: "12px 18px", borderRadius: 12, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", textDecoration: "none" }}><span style={{ color: "#CBD5E1", fontSize: 14, fontWeight: 600, fontFamily: fonts.body, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1, textAlign: "left" }}>{conv.title}</span><span style={{ color: "#475569", fontSize: 12, flexShrink: 0, fontFamily: fonts.body }}>{timeAgo(conv.lastMessageAt)}</span></Link>)}
          </div>
        )}
      </section>
    </div>
  );
}
