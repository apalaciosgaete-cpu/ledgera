"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { clp } from "@/shared/formatting";
import type { TaxMemory, TaxMemoryYearSummary, TaxMemoryInsight } from "@/modules/tax-memory/domain/taxMemory";

const INSIGHT_STYLES: Record<string, { border: string; bg: string; icon: string; titleColor: string }> = {
  POSITIVE: { border: "rgba(22,163,74,0.3)", bg: "rgba(22,163,74,0.08)", icon: "✅", titleColor: "#4ADE80" },
  INFO: { border: "rgba(59,130,246,0.3)", bg: "rgba(59,130,246,0.08)", icon: "ℹ️", titleColor: "#60A5FA" },
  WARNING: { border: "rgba(245,158,11,0.3)", bg: "rgba(245,158,11,0.08)", icon: "⚠️", titleColor: "#FBBF24" },
  CRITICAL: { border: "rgba(239,68,68,0.3)", bg: "rgba(239,68,68,0.08)", icon: "🚨", titleColor: "#F87171" },
};

function formatDate(value: string) {
  const d = new Date(value);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("es-CL", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; color: string; bg: string }> = {
    HEALTHY: { label: "Saludable", color: "#4ADE80", bg: "rgba(22,163,74,0.12)" },
    ATTENTION_REQUIRED: { label: "Atención requerida", color: "#FBBF24", bg: "rgba(245,158,11,0.12)" },
    HIGH_RISK: { label: "Riesgo alto", color: "#F87171", bg: "rgba(239,68,68,0.12)" },
    CRITICAL: { label: "Crítico", color: "#DC2626", bg: "rgba(220,38,38,0.15)" },
  };
  const c = config[status] ?? config.HEALTHY;
  return <span style={{ padding: "4px 12px", borderRadius: 999, fontSize: 12, fontWeight: 800, background: c.bg, color: c.color }}>{c.label}</span>;
}

function YearCard({ summary }: { summary: TaxMemoryYearSummary }) {
  return (
    <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: 16 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <span style={{ fontSize: 15, fontWeight: 850, color: "#F8FAFC" }}>Año {summary.taxYear}</span>
        <span style={{ fontSize: 11, fontWeight: 700, color: summary.status === "CLOSED" ? "#94A3B8" : summary.status === "REOPENED" ? "#FBBF24" : "#4ADE80", padding: "2px 8px", borderRadius: 999, background: "rgba(255,255,255,0.06)" }}>
          {summary.status === "CLOSED" ? "Cerrado" : summary.status === "REOPENED" ? "Reabierto" : "Abierto"}
        </span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
        <div>
          <p style={{ margin: 0, fontSize: 10, color: "#64748B", fontWeight: 700, textTransform: "uppercase" }}>Base imponible</p>
          <p style={{ margin: "2px 0 0", fontSize: 14, fontWeight: 850, color: summary.preliminaryTaxBaseClp > 0 ? "#F8FAFC" : "#64748B" }}>
            {summary.preliminaryTaxBaseClp > 0 ? clp(summary.preliminaryTaxBaseClp) : "—"}
          </p>
        </div>
        <div>
          <p style={{ margin: 0, fontSize: 10, color: "#64748B", fontWeight: 700, textTransform: "uppercase" }}>Ganancia neta</p>
          <p style={{ margin: "2px 0 0", fontSize: 14, fontWeight: 850, color: summary.netTaxableGainClp >= 0 ? "#4ADE80" : "#F87171" }}>
            {summary.netTaxableGainClp !== 0 ? clp(summary.netTaxableGainClp) : "—"}
          </p>
        </div>
        <div>
          <p style={{ margin: 0, fontSize: 10, color: "#64748B", fontWeight: 700, textTransform: "uppercase" }}>Eventos</p>
          <p style={{ margin: "2px 0 0", fontSize: 14, fontWeight: 850, color: "#F8FAFC" }}>{summary.taxEventCount}</p>
        </div>
        <div>
          <p style={{ margin: 0, fontSize: 10, color: "#64748B", fontWeight: 700, textTransform: "uppercase" }}>DDJJ</p>
          <p style={{ margin: "2px 0 0", fontSize: 14, fontWeight: 850, color: "#F8FAFC" }}>{summary.confirmedDeclarationCount}/{summary.declarationCount}</p>
        </div>
      </div>
    </div>
  );
}

function ScoreChart({ history }: { history: { score: number; level: string; evaluatedAt: string }[] }) {
  if (history.length === 0) {
    return <p style={{ color: "#64748B", fontSize: 13, textAlign: "center", padding: 20 }}>Sin historial de score.</p>;
  }
  const maxScore = Math.max(...history.map((h) => h.score), 100);
  const minScore = Math.min(...history.map((h) => h.score), 0);
  const range = Math.max(maxScore - minScore, 30);

  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 80, padding: "8px 0" }}>
      {history.slice(0, 12).reverse().map((entry, i) => {
        const height = Math.max(((entry.score - minScore) / range) * 60 + 10, 6);
        const color = entry.score <= 40 ? "#DC2626" : entry.score <= 65 ? "#D97706" : entry.score <= 85 ? "#16A34A" : "#0F766E";
        return (
          <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
            <div title={`${entry.score}/100 - ${entry.level}`} style={{ width: "100%", maxWidth: 24, height, background: color, borderRadius: "3px 3px 0 0", minHeight: 4 }} />
            <span style={{ fontSize: 8, color: "#64748B" }}>
              {new Date(entry.evaluatedAt).toLocaleDateString("es-CL", { month: "short" })}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export default function ExpertMemoriaTributariaPage() {
  const [memory, setMemory] = useState<TaxMemory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedYear, setSelectedYear] = useState<number | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const res = await fetch("/api/tax/memory", { cache: "no-store" });
        const json = await res.json();
        if (!res.ok || !json.ok) throw new Error(json.message || "Error al cargar memoria tributaria.");
        setMemory(json.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error inesperado.");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  const filteredYears = selectedYear
    ? memory?.yearSummaries.filter((y) => y.taxYear === selectedYear) ?? []
    : memory?.yearSummaries ?? [];

  if (loading) {
    return (
      <div style={{ maxWidth: 1180, width: "100%" }}>
        <p style={{ color: "#64748B", fontSize: 14, fontWeight: 750 }}>Cargando memoria tributaria…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ maxWidth: 1180, width: "100%" }}>
        <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8, color: "#991B1B", fontWeight: 750, padding: 16 }}>{error}</div>
      </div>
    );
  }

  if (!memory) return null;

  return (
    <div style={{ maxWidth: 1180, width: "100%" }}>
      {/* Header */}
      <section style={{ display: "flex", flexWrap: "wrap", gap: 16, justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
        <div>
          <p style={{ color: "#0F766E", fontSize: 12, fontWeight: 850, letterSpacing: "0.06em", margin: "0 0 7px", textTransform: "uppercase" }}>Modo Experto · CAPA 6.1</p>
          <h1 style={{ color: "#F8FAFC", fontSize: "1.85rem", fontWeight: 850, lineHeight: 1.12, margin: "0 0 8px" }}>Memoria Tributaria Inteligente</h1>
          <p style={{ color: "#94A3B8", fontSize: "0.95rem", lineHeight: 1.55, margin: 0 }}>
            Visión completa del historial tributario de <strong style={{ color: "#F8FAFC" }}>{memory.userName}</strong>
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <StatusBadge status={memory.status} />
          <Link href="/experto" style={{ border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8, color: "#F8FAFC", display: "inline-flex", fontSize: 13, fontWeight: 850, padding: "10px 14px", textDecoration: "none" }}>
            Volver a Experto
          </Link>
        </div>
      </section>

      {/* Insights */}
      {memory.insights.length > 0 && (
        <section style={{ display: "grid", gap: 10, marginBottom: 20 }}>
          {memory.insights.map((insight, i) => {
            const style = INSIGHT_STYLES[insight.type] ?? INSIGHT_STYLES.INFO;
            return (
              <div key={i} style={{ display: "flex", gap: 12, background: style.bg, border: `1px solid ${style.border}`, borderRadius: 10, padding: "12px 16px", alignItems: "flex-start" }}>
                <span style={{ fontSize: 16, flexShrink: 0 }}>{style.icon}</span>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: "0 0 2px", fontSize: 14, fontWeight: 700, color: style.titleColor }}>{insight.title}</p>
                  <p style={{ margin: 0, fontSize: 13, color: "#CBD5E1", lineHeight: 1.5 }}>{insight.description}</p>
                  {insight.actionLabel && insight.actionHref && (
                    <Link href={insight.actionHref} style={{ display: "inline-block", marginTop: 8, fontSize: 13, fontWeight: 700, color: "#4ADE80", textDecoration: "underline" }}>
                      {insight.actionLabel} →
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </section>
      )}

      {/* Score */}
      <section style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, marginBottom: 20, padding: 20 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <div>
            <h2 style={{ margin: "0 0 2px", fontSize: 15, fontWeight: 850, color: "#F8FAFC" }}>Smart Tax Score</h2>
            <p style={{ margin: 0, fontSize: 12, color: "#64748B" }}>Evolución de la salud tributaria</p>
          </div>
          {memory.currentScore.score !== null && (
            <div style={{ textAlign: "center" }}>
              <div style={{
                width: 60, height: 60, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                background: `conic-gradient(${memory.currentScore.score <= 40 ? "#DC2626" : memory.currentScore.score <= 65 ? "#D97706" : memory.currentScore.score <= 85 ? "#16A34A" : "#0F766E"} ${memory.currentScore.score}%, rgba(255,255,255,0.1) ${memory.currentScore.score}%)`,
              }}>
                <span style={{ background: "#0B1D2C", width: 50, height: 50, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 850, color: "#F8FAFC" }}>
                  {memory.currentScore.score}
                </span>
              </div>
              <p style={{ margin: "2px 0 0", fontSize: 10, color: "#64748B", fontWeight: 700 }}>{memory.currentScore.level}</p>
            </div>
          )}
        </div>
        <ScoreChart history={memory.scoreHistory} />
      </section>

      {/* Perfil */}
      <section style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, marginBottom: 20, padding: 20 }}>
        <h2 style={{ margin: "0 0 12px", fontSize: 15, fontWeight: 850, color: "#F8FAFC" }}>Perfil Tributario</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 }}>
          <div>
            <p style={{ margin: "0 0 2px", fontSize: 10, color: "#64748B", fontWeight: 700, textTransform: "uppercase" }}>RUT</p>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: memory.taxProfile.rut ? "#F8FAFC" : "#64748B" }}>{memory.taxProfile.rut ?? "—"}</p>
          </div>
          <div>
            <p style={{ margin: "0 0 2px", fontSize: 10, color: "#64748B", fontWeight: 700, textTransform: "uppercase" }}>Razón social</p>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#F8FAFC" }}>{memory.taxProfile.legalName ?? "—"}</p>
          </div>
          <div>
            <p style={{ margin: "0 0 2px", fontSize: 10, color: "#64748B", fontWeight: 700, textTransform: "uppercase" }}>Documento</p>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#F8FAFC" }}>{memory.taxProfile.documentType ?? "—"}</p>
          </div>
          <div>
            <p style={{ margin: "0 0 2px", fontSize: 10, color: "#64748B", fontWeight: 700, textTransform: "uppercase" }}>SII</p>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: memory.siiStatus.configured ? "#4ADE80" : "#64748B" }}>
              {memory.siiStatus.configured ? "Configurado" : "No configurado"}
            </p>
          </div>
        </div>
      </section>

      {/* Years */}
      <section style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <h2 style={{ margin: 0, fontSize: 15, fontWeight: 850, color: "#F8FAFC" }}>Resumen por año</h2>
          {memory.yearSummaries.length > 1 && (
            <select value={selectedYear ?? ""} onChange={(e) => setSelectedYear(e.target.value ? Number(e.target.value) : null)}
              style={{ background: "#0B1D2C", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8, color: "#F8FAFC", fontSize: 13, padding: "6px 10px" }}>
              <option value="">Todos</option>
              {memory.yearSummaries.map((y) => <option key={y.taxYear} value={y.taxYear}>{y.taxYear}</option>)}
            </select>
          )}
        </div>
        {filteredYears.length === 0 ? (
          <div style={{ background: "rgba(255,255,255,0.04)", border: "1px dashed rgba(255,255,255,0.12)", borderRadius: 10, padding: 24, textAlign: "center" }}>
            <p style={{ color: "#64748B", fontSize: 13, margin: 0 }}>Sin datos para este período.</p>
          </div>
        ) : (
          <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))" }}>
            {filteredYears.map((summary) => <YearCard key={summary.taxYear} summary={summary} />)}
          </div>
        )}
      </section>

      {/* Timeline */}
      {memory.timeline.length > 0 && (
        <section style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, overflow: "hidden" }}>
          <div style={{ padding: "14px 18px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
            <h2 style={{ margin: "0 0 2px", fontSize: 15, fontWeight: 850, color: "#F8FAFC" }}>Línea de tiempo</h2>
            <p style={{ margin: 0, fontSize: 12, color: "#64748B" }}>Eventos recientes de actividad tributaria</p>
          </div>
          <div style={{ padding: "8px 18px" }}>
            {memory.timeline.slice(0, 20).map((event) => (
              <div key={event.id} style={{ display: "flex", gap: 12, padding: "7px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                <span style={{ fontSize: 14, flexShrink: 0 }}>
                  {event.type === "DECLARATION" ? "📄" : event.type === "SCORE" ? "📊" : event.type === "ALERT" ? "🔔" : "📌"}
                </span>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#F8FAFC" }}>{event.title}</p>
                  {event.description && <p style={{ margin: "2px 0 0", fontSize: 12, color: "#94A3B8" }}>{event.description}</p>}
                </div>
                <span style={{ fontSize: 11, color: "#64748B", flexShrink: 0 }}>{formatDate(event.date)}</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
