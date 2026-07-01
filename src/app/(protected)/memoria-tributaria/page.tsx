"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { clp } from "@/shared/formatting";
import type { TaxMemory, TaxMemoryYearSummary } from "@/modules/tax-memory/domain/taxMemory";

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  HEALTHY: { label: "Saludable", color: "var(--accent)", bg: "var(--accent-soft)", icon: "✅" },
  ATTENTION_REQUIRED: { label: "Atención requerida", color: "var(--warn)", bg: "rgba(232,184,75,0.14)", icon: "⚠️" },
  HIGH_RISK: { label: "Riesgo alto", color: "var(--loss)", bg: "rgba(196,99,74,0.14)", icon: "🔴" },
  CRITICAL: { label: "Crítico", color: "var(--loss)", bg: "rgba(196,99,74,0.14)", icon: "🚨" },
};

const INSIGHT_STYLES: Record<string, { border: string; bg: string; icon: string; titleColor: string }> = {
  POSITIVE: { border: "var(--accent)", bg: "var(--accent-soft)", icon: "✅", titleColor: "var(--accent)" },
  INFO: { border: "var(--accent)", bg: "var(--accent-soft)", icon: "ℹ️", titleColor: "var(--text)" },
  WARNING: { border: "var(--warn)", bg: "rgba(232,184,75,0.14)", icon: "⚠️", titleColor: "var(--warn)" },
  CRITICAL: { border: "var(--loss)", bg: "rgba(196,99,74,0.14)", icon: "🚨", titleColor: "var(--loss)" },
};

function formatDate(value: string) {
  const d = new Date(value);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("es-CL", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function YearSummaryCard({ summary }: { summary: TaxMemoryYearSummary }) {
  const periodLabel = summary.status === "CLOSED" ? "Cerrado" : summary.status === "REOPENED" ? "Reabierto" : "Abierto";
  const periodColor = summary.status === "CLOSED" ? "var(--text-soft)" : summary.status === "REOPENED" ? "#E8B84B" : "#3FA687";

  return (
    <div style={{ background: "var(--bg-elev)", border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderBottom: "1px solid var(--border)", background: "var(--bg-sunken)" }}>
        <span style={{ fontSize: 16, fontWeight: 850, color: "var(--text)" }}>Año {summary.taxYear}</span>
        <span style={{ fontSize: 12, fontWeight: 700, color: periodColor, background: `${periodColor}18`, padding: "2px 10px", borderRadius: 999 }}>
          {periodLabel}
        </span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0 }}>
        <div style={{ padding: "12px 16px", borderRight: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}>
          <p style={{ margin: 0, fontSize: 11, color: "var(--text-soft)", fontWeight: 700, textTransform: "uppercase" }}>Base imponible</p>
          <p style={{ margin: "4px 0 0", fontSize: 15, fontWeight: 850, color: summary.preliminaryTaxBaseClp > 0 ? "var(--text)" : "var(--text-soft)" }}>
            {summary.preliminaryTaxBaseClp > 0 ? clp(summary.preliminaryTaxBaseClp) : "—"}
          </p>
        </div>
        <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)" }}>
          <p style={{ margin: 0, fontSize: 11, color: "var(--text-soft)", fontWeight: 700, textTransform: "uppercase" }}>Ganancia neta</p>
          <p style={{ margin: "4px 0 0", fontSize: 15, fontWeight: 850, color: summary.netTaxableGainClp >= 0 ? "var(--accent)" : "var(--warn)" }}>
            {summary.netTaxableGainClp !== 0 ? clp(summary.netTaxableGainClp) : "—"}
          </p>
        </div>
        <div style={{ padding: "12px 16px", borderRight: "1px solid var(--border)" }}>
          <p style={{ margin: 0, fontSize: 11, color: "var(--text-soft)", fontWeight: 700, textTransform: "uppercase" }}>Movimientos</p>
          <p style={{ margin: "4px 0 0", fontSize: 15, fontWeight: 850, color: "var(--text)" }}>{summary.movementCount}</p>
        </div>
        <div style={{ padding: "12px 16px" }}>
          <p style={{ margin: 0, fontSize: 11, color: "var(--text-soft)", fontWeight: 700, textTransform: "uppercase" }}>Declaraciones</p>
          <p style={{ margin: "4px 0 0", fontSize: 15, fontWeight: 850, color: "var(--text)" }}>
            {summary.confirmedDeclarationCount}/{summary.declarationCount}
          </p>
        </div>
      </div>
    </div>
  );
}

function ScoreChart({ history }: { history: { score: number; level: string; evaluatedAt: string }[] }) {
  if (history.length === 0) {
    return <p style={{ color: "var(--text-soft)", fontSize: 13, textAlign: "center", padding: 20 }}>Sin historial de score disponible.</p>;
  }

  const maxScore = Math.max(...history.map((h) => h.score), 100);
  const minScore = Math.min(...history.map((h) => h.score), 0);
  const range = Math.max(maxScore - minScore, 30);

  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 100, padding: "8px 0" }}>
      {history.slice(0, 12).reverse().map((entry, i) => {
        const height = Math.max(((entry.score - minScore) / range) * 80 + 10, 10);
        const color = entry.score <= 40 ? "#C4634A" : entry.score <= 65 ? "#E8B84B" : entry.score <= 85 ? "#3FA687" : "#3FA687";
        return (
          <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
            <div
              title={`${entry.score}/100 - ${entry.level} - ${formatDate(entry.evaluatedAt)}`}
              style={{ width: "100%", maxWidth: 28, height, background: color, borderRadius: "4px 4px 0 0", minHeight: 4, transition: "height 0.3s" }}
            />
            <span style={{ fontSize: 9, color: "var(--text-soft)", whiteSpace: "nowrap" }}>
              {new Date(entry.evaluatedAt).toLocaleDateString("es-CL", { month: "short" })}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export default function MemoriaTributariaPage() {
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

  const statusCfg = memory ? STATUS_CONFIG[memory.status] ?? STATUS_CONFIG.HEALTHY : null;

  if (loading) {
    return (
      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "24px" }}>
        <p style={{ color: "var(--text-soft)", fontSize: 14, fontWeight: 750 }}>Cargando memoria tributaria…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "24px" }}>
        <div style={{ background: "rgba(196,99,74,0.14)", border: "1px solid rgba(196,99,74,0.14)", borderRadius: 8, color: "var(--loss)", fontWeight: 750, padding: 16 }}>{error}</div>
      </div>
    );
  }

  if (!memory) return null;

  const filteredYears = selectedYear
    ? memory.yearSummaries.filter((y) => y.taxYear === selectedYear)
    : memory.yearSummaries;

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: "24px" }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <p style={{ color: "var(--accent)", fontSize: 12, fontWeight: 850, letterSpacing: "0.06em", margin: "0 0 7px", textTransform: "uppercase" }}>
          CAPA 6.1 · AI CORE
        </p>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <div>
            <h1 style={{ fontFamily: "var(--font-display)", fontSize: "1.625rem", fontWeight: 850, color: "var(--text)", margin: "0 0 4px", lineHeight: 1.15 }}>
              Memoria Tributaria Inteligente
            </h1>
            <p style={{ color: "var(--text-soft)", fontSize: 14, margin: 0, lineHeight: 1.55 }}>
              Visión completa e inteligente de tu historial tributario · {memory.userName}
            </p>
          </div>
          {statusCfg && (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 999, background: statusCfg.bg, color: statusCfg.color, fontSize: 13, fontWeight: 800 }}>
              {statusCfg.icon} {statusCfg.label}
            </span>
          )}
        </div>
      </div>

      {/* Insights */}
      {memory.insights.length > 0 && (
        <section style={{ display: "grid", gap: 10, marginBottom: 24 }}>
          {memory.insights.map((insight, i) => {
            const style = INSIGHT_STYLES[insight.type] ?? INSIGHT_STYLES.INFO;
            return (
              <div key={i} style={{ display: "flex", gap: 12, background: style.bg, border: `1px solid ${style.border}`, borderRadius: 10, padding: "12px 16px", alignItems: "flex-start" }}>
                <span style={{ fontSize: 16, flexShrink: 0 }}>{style.icon}</span>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: "0 0 2px", fontSize: 14, fontWeight: 700, color: style.titleColor }}>{insight.title}</p>
                  <p style={{ margin: 0, fontSize: 13, color: "var(--text)", lineHeight: 1.5 }}>{insight.description}</p>
                  {insight.actionLabel && insight.actionHref && (
                    <Link href={insight.actionHref} style={{ display: "inline-block", marginTop: 8, fontSize: 13, fontWeight: 700, color: "var(--accent)", textDecoration: "underline" }}>
                      {insight.actionLabel} →
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </section>
      )}

      {/* Score actual + historial */}
      <section style={{ background: "var(--bg-elev)", border: "1px solid var(--border)", borderRadius: 12, marginBottom: 24, overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)" }}>
          <h2 style={{ margin: "0 0 4px", fontSize: 16, fontWeight: 850, color: "var(--text)" }}>Smart Tax Score</h2>
          <p style={{ margin: 0, fontSize: 13, color: "var(--text-soft)" }}>Evolución de tu salud tributaria</p>
        </div>
        <div style={{ padding: "16px 20px" }}>
          {memory.currentScore.score !== null ? (
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16 }}>
              <div style={{ textAlign: "center" }}>
                <div style={{
                  width: 72, height: 72, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                  background: `conic-gradient(${memory.currentScore.score <= 40 ? "#C4634A" : memory.currentScore.score <= 65 ? "#E8B84B" : memory.currentScore.score <= 85 ? "#3FA687" : "#3FA687"} ${memory.currentScore.score}%, var(--text) ${memory.currentScore.score}%)`,
                }}>
                  <span style={{ background: "#fff", width: 60, height: 60, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 850, color: "var(--text)" }}>
                    {memory.currentScore.score}
                  </span>
                </div>
                <p style={{ margin: "4px 0 0", fontSize: 11, color: "var(--text-soft)", fontWeight: 700 }}>{memory.currentScore.level}</p>
              </div>
              <div style={{ flex: 1 }}>
                <ScoreChart history={memory.scoreHistory} />
              </div>
            </div>
          ) : (
            <p style={{ color: "var(--text-soft)", fontSize: 13 }}>Aún no hay score calculado.</p>
          )}
        </div>
      </section>

      {/* Perfil */}
      <section style={{ background: "var(--bg-elev)", border: "1px solid var(--border)", borderRadius: 12, marginBottom: 24, overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)" }}>
          <h2 style={{ margin: "0 0 4px", fontSize: 16, fontWeight: 850, color: "var(--text)" }}>Perfil Tributario</h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 0 }}>
          <div style={{ padding: "14px 20px", borderRight: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}>
            <p style={{ margin: "0 0 4px", fontSize: 11, color: "var(--text-soft)", fontWeight: 700, textTransform: "uppercase" }}>RUT</p>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: memory.taxProfile.rut ? "var(--text)" : "var(--text-soft)" }}>{memory.taxProfile.rut ?? "—"}</p>
          </div>
          <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border)" }}>
            <p style={{ margin: "0 0 4px", fontSize: 11, color: "var(--text-soft)", fontWeight: 700, textTransform: "uppercase" }}>Razón social</p>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: memory.taxProfile.legalName ? "var(--text)" : "var(--text-soft)" }}>{memory.taxProfile.legalName ?? "—"}</p>
          </div>
          <div style={{ padding: "14px 20px", borderRight: "1px solid var(--border)" }}>
            <p style={{ margin: "0 0 4px", fontSize: 11, color: "var(--text-soft)", fontWeight: 700, textTransform: "uppercase" }}>Validado</p>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: memory.taxProfile.isValidated ? "var(--accent)" : "var(--loss)" }}>
              {memory.taxProfile.isValidated ? "Sí" : "No"}
            </p>
          </div>
          <div style={{ padding: "14px 20px" }}>
            <p style={{ margin: "0 0 4px", fontSize: 11, color: "var(--text-soft)", fontWeight: 700, textTransform: "uppercase" }}>SII</p>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: memory.siiStatus.configured ? "var(--accent)" : "var(--text-soft)" }}>
              {memory.siiStatus.configured ? "Configurado" : "No configurado"}
            </p>
          </div>
        </div>
      </section>

      {/* Years summary grid */}
      <section style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 850, color: "var(--text)" }}>Resumen por año tributario</h2>
          {memory.yearSummaries.length > 1 && (
            <select
              value={selectedYear ?? ""}
              onChange={(e) => setSelectedYear(e.target.value ? Number(e.target.value) : null)}
              style={{ border: "1px solid var(--border)", borderRadius: 8, padding: "6px 10px", fontSize: 13, color: "var(--text)" }}
            >
              <option value="">Todos los años</option>
              {memory.yearSummaries.map((y) => (
                <option key={y.taxYear} value={y.taxYear}>{y.taxYear}</option>
              ))}
            </select>
          )}
        </div>
        {filteredYears.length === 0 ? (
          <div style={{ background: "var(--bg-elev)", border: "1px dashed var(--border)", borderRadius: 12, padding: 24, textAlign: "center" }}>
            <p style={{ color: "var(--text-soft)", fontSize: 13, margin: 0 }}>Sin datos tributarios para este período.</p>
          </div>
        ) : (
          <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}>
            {filteredYears.map((summary) => (
              <YearSummaryCard key={summary.taxYear} summary={summary} />
            ))}
          </div>
        )}
      </section>

      {/* Estado actual */}
      <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", marginBottom: 24 }}>
        <article style={{ background: "var(--bg-elev)", border: "1px solid var(--border)", borderRadius: 10, padding: 16 }}>
          <p style={{ margin: "0 0 8px", fontSize: 11, color: "var(--text-soft)", fontWeight: 700, textTransform: "uppercase" }}>
            Alertas {memory.alerts.length > 0 && `(${memory.alerts.length})`}
          </p>
          {memory.alerts.length === 0 ? (
            <p style={{ margin: 0, fontSize: 13, color: "var(--accent)", fontWeight: 700 }}>Sin alertas abiertas ✅</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {memory.alerts.slice(0, 5).map((a) => (
                <div key={a.id} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                  <span style={{ fontSize: 12, flexShrink: 0, color: a.severity === "CRITICAL" ? "var(--loss)" : "var(--warn)" }}>•</span>
                  <p style={{ margin: 0, fontSize: 12, color: "var(--text)", lineHeight: 1.4 }}>{a.title}</p>
                </div>
              ))}
            </div>
          )}
          <Link href="/alertas" style={{ display: "inline-block", marginTop: 8, fontSize: 12, fontWeight: 700, color: "var(--accent)" }}>Ver todas →</Link>
        </article>

        <article style={{ background: "var(--bg-elev)", border: "1px solid var(--border)", borderRadius: 10, padding: 16 }}>
          <p style={{ margin: "0 0 8px", fontSize: 11, color: "var(--text-soft)", fontWeight: 700, textTransform: "uppercase" }}>
            Tareas {memory.tasks.length > 0 && `(${memory.tasks.length})`}
          </p>
          {memory.tasks.length === 0 ? (
            <p style={{ margin: 0, fontSize: 13, color: "var(--accent)", fontWeight: 700 }}>Sin tareas pendientes ✅</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {memory.tasks.slice(0, 5).map((t) => (
                <div key={t.id} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                  <span style={{ fontSize: 12, flexShrink: 0, color: t.priority === "CRITICAL" ? "var(--loss)" : "var(--text-soft)" }}>•</span>
                  <p style={{ margin: 0, fontSize: 12, color: "var(--text)", lineHeight: 1.4 }}>{t.title}</p>
                </div>
              ))}
            </div>
          )}
          <Link href="/tareas" style={{ display: "inline-block", marginTop: 8, fontSize: 12, fontWeight: 700, color: "var(--accent)" }}>Ver todas →</Link>
        </article>

        <article style={{ background: "var(--bg-elev)", border: "1px solid var(--border)", borderRadius: 10, padding: 16 }}>
          <p style={{ margin: "0 0 8px", fontSize: 11, color: "var(--text-soft)", fontWeight: 700, textTransform: "uppercase" }}>
            Recomendaciones {memory.recommendations.length > 0 && `(${memory.recommendations.length})`}
          </p>
          {memory.recommendations.length === 0 ? (
            <p style={{ margin: 0, fontSize: 13, color: "var(--accent)", fontWeight: 700 }}>Todo en orden ✅</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {memory.recommendations.slice(0, 5).map((r) => (
                <div key={r.id} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                  <span style={{ fontSize: 12, flexShrink: 0, color: r.priority === "CRITICAL" ? "var(--loss)" : "var(--text-soft)" }}>•</span>
                  <p style={{ margin: 0, fontSize: 12, color: "var(--text)", lineHeight: 1.4 }}>{r.title}</p>
                </div>
              ))}
            </div>
          )}
          <Link href="/recomendaciones" style={{ display: "inline-block", marginTop: 8, fontSize: 12, fontWeight: 700, color: "var(--accent)" }}>Ver todas →</Link>
        </article>
      </div>

      {/* Timeline */}
      {memory.timeline.length > 0 && (
        <section style={{ background: "var(--bg-elev)", border: "1px solid var(--border)", borderRadius: 12, marginBottom: 24, overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)" }}>
            <h2 style={{ margin: "0 0 4px", fontSize: 16, fontWeight: 850, color: "var(--text)" }}>Línea de tiempo</h2>
            <p style={{ margin: 0, fontSize: 13, color: "var(--text-soft)" }}>Eventos recientes de tu actividad tributaria</p>
          </div>
          <div style={{ padding: "12px 20px" }}>
            {memory.timeline.slice(0, 15).map((event) => (
              <div key={event.id} style={{ display: "flex", gap: 12, padding: "8px 0", borderBottom: "1px solid var(--border)" }}>
                <div style={{ flexShrink: 0, width: 32, textAlign: "center" }}>
                  <span style={{ fontSize: 14 }}>
                    {event.type === "DECLARATION" ? "📄" : event.type === "SCORE" ? "📊" : event.type === "ALERT" ? "🔔" : event.type === "TASK" ? "✅" : "📌"}
                  </span>
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "var(--text)" }}>{event.title}</p>
                  {event.description && <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--text-soft)" }}>{event.description}</p>}
                </div>
                <div style={{ flexShrink: 0 }}>
                  <span style={{ fontSize: 11, color: "var(--text-soft)" }}>{formatDate(event.date)}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
