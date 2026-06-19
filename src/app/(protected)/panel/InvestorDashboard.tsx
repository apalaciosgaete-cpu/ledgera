"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/modules/identity/client/authContext";
import { fonts } from "@/styles/tokens";

const EXAMPLES = [
  "Vendí Bitcoin el mes pasado",
  "Quiero crear una SpA",
  "Recibí fondos desde el extranjero",
  "Necesito preparar mi declaración",
  "Compré un inmueble",
  "Tengo ganancias en staking",
];

const CASE_STATUS: Record<string, string> = {
  OPEN: "Análisis inicial",
  IN_PROGRESS: "Analizando estructura",
  PENDING_REVIEW: "Recolección de antecedentes",
  RESOLVED: "Simulación completada",
  CLOSED: "Completado",
  DRAFT: "Borrador",
};

type DashboardData = {
  risk: { score: number | null; level: string | null };
  alerts: { open: number; critical: number };
  tax: { pendingDocuments: number; rejectedDocuments: number };
  documents: { total: number };
  subscription: { status: string | null; plan: string | null };
};

type TaxCase = {
  id: string;
  title: string;
  status: string;
  updatedAt: string;
};

type Recommendation = {
  id: string;
  title: string;
  category?: string;
};

function buildGreeting(role: string, name: string) {
  if (role === "empresa") return { headline: "Bienvenido.", sub: "¿Qué decisión necesitas evaluar?" };
  if (role === "contador") return { headline: "", sub: "¿En qué caso estás trabajando hoy?" };
  return { headline: `Hola${name ? `, ${name}` : ""}.`, sub: "¿Qué necesitas resolver hoy?" };
}

function extractFirstName(email: string): string {
  const prefix = email.split("@")[0] ?? "";
  const first = prefix.split(/[._-]/)[0] ?? prefix;
  return first.charAt(0).toUpperCase() + first.slice(1).toLowerCase();
}

const cardStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(255,255,255,0.07)",
  borderRadius: 18,
  padding: "26px 28px",
};

const labelStyle: React.CSSProperties = {
  color: "#334155",
  fontSize: 11,
  fontWeight: 850,
  letterSpacing: "0.09em",
  margin: "0 0 18px",
  textTransform: "uppercase",
  fontFamily: fonts.body,
};

const linkStyle: React.CSSProperties = {
  display: "inline-block",
  marginTop: 20,
  color: "#4ADE80",
  fontSize: 13,
  fontWeight: 700,
  textDecoration: "none",
  fontFamily: fonts.body,
};

function SituacionSection({ data, activeCases }: { data: DashboardData | null; activeCases: number }) {
  const items: { label: string; value: string }[] = [
    {
      label: "Próxima obligación",
      value: data?.tax?.pendingDocuments
        ? `${data.tax.pendingDocuments} documento${data.tax.pendingDocuments !== 1 ? "s" : ""} pendiente${data.tax.pendingDocuments !== 1 ? "s" : ""}`
        : "Declaración mensual",
    },
    { label: "Alertas relevantes", value: data ? String(data.alerts.open) : "—" },
    { label: "Documentos totales", value: data ? String(data.documents.total) : "—" },
    { label: "Casos activos", value: activeCases > 0 ? String(activeCases) : "—" },
  ];

  return (
    <section style={cardStyle}>
      <p style={labelStyle}>Situación actual</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {items.map((item) => (
          <div key={item.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
            <span style={{ color: "#4B5563", fontSize: 14, lineHeight: 1.4 }}>{item.label}</span>
            <span style={{ color: "#E2E8F0", fontSize: 14, fontWeight: 700, textAlign: "right" }}>{item.value}</span>
          </div>
        ))}
      </div>
      <Link href="/mi-situacion" style={linkStyle}>Revisar mi situación →</Link>
    </section>
  );
}

function TimelineSection({ cases }: { cases: TaxCase[] }) {
  function formatDate(iso: string) {
    const d = new Date(iso);
    const now = new Date();
    const diff = Math.floor((now.getTime() - d.getTime()) / 86400000);
    if (diff === 0) return "Hoy";
    if (diff === 1) return "Ayer";
    return d.toLocaleDateString("es-CL", { day: "numeric", month: "long" });
  }

  const items = cases.length > 0
    ? cases.map((c) => ({ date: formatDate(c.updatedAt), text: c.title }))
    : [
        { date: "Hoy", text: "Consulta sobre Bitcoin" },
        { date: "Ayer", text: "Simulación tributaria" },
        { date: "15 junio", text: "Análisis patrimonial" },
      ];

  return (
    <section style={cardStyle}>
      <p style={labelStyle}>Actividad reciente</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {items.map((item, i) => (
          <div key={i} style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
            <span style={{ color: "#334155", fontSize: 12, fontWeight: 700, minWidth: 56, paddingTop: 1, lineHeight: 1.5 }}>{item.date}</span>
            <span style={{ color: "#CBD5E1", fontSize: 14, lineHeight: 1.5 }}>{item.text}</span>
          </div>
        ))}
      </div>
      <Link href="/conversaciones" style={linkStyle}>Conversar con LEDGERA →</Link>
    </section>
  );
}

function CasosSection({ cases }: { cases: TaxCase[] }) {
  const active = cases.filter((c) => c.status !== "CLOSED" && c.status !== "RESOLVED");

  return (
    <section style={cardStyle}>
      <p style={labelStyle}>Casos en seguimiento</p>
      {active.length === 0 ? (
        <p style={{ color: "#334155", fontSize: 14, margin: "0 0 16px" }}>No hay casos activos en este momento.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {active.map((c, i) => (
            <div key={c.id}>
              <Link href={`/casos/${c.id}`} style={{ textDecoration: "none" }}>
                <p style={{ color: "#E2E8F0", fontSize: 14, fontWeight: 700, margin: "0 0 3px", lineHeight: 1.4 }}>{c.title}</p>
                <p style={{ color: "#475569", fontSize: 12, margin: 0 }}>Estado: {CASE_STATUS[c.status] ?? c.status}</p>
              </Link>
              {i < active.length - 1 ? <div style={{ height: 1, background: "rgba(255,255,255,0.06)", marginTop: 14 }} /> : null}
            </div>
          ))}
        </div>
      )}
      <Link href="/casos" style={linkStyle}>Ver casos →</Link>
    </section>
  );
}

function DocumentosSection() {
  return (
    <section style={cardStyle}>
      <p style={labelStyle}>Documentos</p>
      <p style={{ color: "#4B5563", fontSize: 14, lineHeight: 1.5, margin: "0 0 16px" }}>
        Sube y organiza documentos relevantes para tu expediente financiero y tributario.
      </p>
      <Link href="/documentos" style={linkStyle}>Subir documentos →</Link>
    </section>
  );
}

function RecomendacionesSection({ items }: { items: Recommendation[] }) {
  const defaults = ["Declaración pendiente", "Actualización patrimonial", "Operaciones con cryptoactivos"];
  const list = items.length > 0 ? items.map((r) => r.title) : defaults;

  return (
    <section style={{ ...cardStyle, gridColumn: "1 / -1" }}>
      <p style={labelStyle}>Podrías revisar</p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
        {list.map((item, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(22,163,74,0.06)", border: "1px solid rgba(22,163,74,0.15)", borderRadius: 999, padding: "7px 16px" }}>
            <span style={{ color: "#4ADE80", fontSize: 11 }}>•</span>
            <span style={{ color: "#CBD5E1", fontSize: 13, fontWeight: 500, fontFamily: fonts.body }}>{item}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

export function InvestorDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const [query, setQuery] = useState("");
  const [exIdx, setExIdx] = useState(0);
  const [focused, setFocused] = useState(false);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [cases, setCases] = useState<TaxCase[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);

  const role = ((user as { role?: string })?.role) ?? "personal";
  const displayName = user?.email ? extractFirstName(user.email) : "";
  const greeting = buildGreeting(role, displayName);

  useEffect(() => {
    const t = setInterval(() => setExIdx((i) => (i + 1) % EXAMPLES.length), 3500);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    Promise.all([
      fetch("/api/dashboard/user", { cache: "no-store" }).then((r) => r.json()).catch(() => null),
      fetch("/api/tax-cases", { cache: "no-store" }).then((r) => r.json()).catch(() => null),
      fetch("/api/recommendations", { cache: "no-store" }).then((r) => r.json()).catch(() => null),
    ]).then(([ud, tc, rc]) => {
      if (ud?.ok) setDashboard(ud.data);
      if (tc?.ok && Array.isArray(tc.data)) setCases(tc.data.slice(0, 4));
      if (rc?.ok && Array.isArray(rc.data)) setRecommendations(rc.data.slice(0, 5));
    });
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    router.push(`/conversaciones?q=${encodeURIComponent(q)}`);
  }

  function useExample(ex: string) {
    setQuery(ex);
    inputRef.current?.focus();
  }

  const activeCases = cases.filter((c) => c.status !== "CLOSED" && c.status !== "RESOLVED").length;

  return (
    <div style={{ minHeight: "calc(100vh - 68px)", background: "#071B28", color: "#E2E8F0", fontFamily: fonts.body }}>
      <section style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "clamp(56px, 10vh, 112px) 24px 48px", minHeight: "56vh" }}>
        <div style={{ marginBottom: 40, maxWidth: 640 }}>
          {greeting.headline ? (
            <h1 style={{ color: "#F8FAFC", fontSize: "clamp(2rem, 5vw, 3.4rem)", fontWeight: 850, margin: "0 0 8px", lineHeight: 1.06, fontFamily: fonts.body, letterSpacing: "-0.01em" }}>
              {greeting.headline}
            </h1>
          ) : null}
          <p style={{ color: "#64748B", fontSize: "clamp(1rem, 2.5vw, 1.35rem)", fontWeight: 450, margin: 0, lineHeight: 1.45 }}>{greeting.sub}</p>
        </div>

        <form onSubmit={handleSubmit} style={{ width: "100%", maxWidth: 640, marginBottom: 18 }}>
          <div style={{ display: "flex", alignItems: "center", background: "rgba(255,255,255,0.04)", border: `1.5px solid ${focused ? "rgba(74,222,128,0.35)" : "rgba(255,255,255,0.10)"}`, borderRadius: 18, padding: "6px 6px 6px 22px", transition: "border-color 0.2s", boxShadow: focused ? "0 0 0 3px rgba(22,163,74,0.08)" : "none" }}>
            <input ref={inputRef} value={query} onChange={(e) => setQuery(e.target.value)} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} placeholder={EXAMPLES[exIdx]} autoComplete="off" style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: "#F8FAFC", fontSize: 16, fontFamily: fonts.body, fontWeight: 500, padding: "12px 0", caretColor: "#4ADE80" }} />
            <button type="submit" style={{ background: "#16A34A", border: "none", borderRadius: 12, color: "#FFFFFF", cursor: "pointer", padding: "12px 22px", fontSize: 17, fontWeight: 850, flexShrink: 0, lineHeight: 1 }}>→</button>
          </div>
        </form>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", maxWidth: 640 }}>
          {EXAMPLES.slice(0, 4).map((ex) => (
            <button key={ex} onClick={() => useExample(ex)} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 999, color: "#475569", cursor: "pointer", fontSize: 13, fontWeight: 500, padding: "5px 14px", fontFamily: fonts.body }}>
              {ex}
            </button>
          ))}
        </div>
      </section>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px 32px", display: "grid", gap: 18, gridTemplateColumns: "repeat(auto-fit, minmax(290px, 1fr))" }}>
        <SituacionSection data={dashboard} activeCases={activeCases} />
        <TimelineSection cases={cases} />
        <DocumentosSection />
        <CasosSection cases={cases} />
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px 72px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr" }}>
          <RecomendacionesSection items={recommendations} />
        </div>
      </div>
    </div>
  );
}
