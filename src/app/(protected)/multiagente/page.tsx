"use client";

import { useEffect, useState, useCallback } from "react";
import {
  type AgentAssessment,
  type AgentAssessmentSeverity,
  type SpecializedAgentType,
  AGENT_LABELS,
  AGENT_EMOJIS,
  SEVERITY_LABELS,
  severityColor,
} from "@/modules/multi-agent/domain/agent";

interface SubjectOption {
  type: string;
  id: string;
  label: string;
}

export default function MultiAgentePage() {
  const [assessments, setAssessments] = useState<AgentAssessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewing, setReviewing] = useState(false);
  const [report, setReport] = useState<{
    finalSeverity: string;
    finalSummary: string;
    finalRecommendation: string;
  } | null>(null);
  const [subjectType, setSubjectType] = useState<string>("TaxCase");
  const [activeCases, setActiveCases] = useState<SubjectOption[]>([]);

  const fetchAssessments = useCallback(async () => {
    try {
      const res = await fetch("/api/multi-agent/assessments");
      if (!res.ok) return;
      const json = await res.json();
      setAssessments(json.data ?? []);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCases = useCallback(async () => {
    try {
      const res = await fetch("/api/tax-cases");
      if (!res.ok) return;
      const json = await res.json();
      const items = json.data?.items ?? [];
      setActiveCases(
        items
          .filter((c: { status: string }) => c.status !== "RESOLVED" && c.status !== "CLOSED")
          .slice(0, 10)
          .map((c: { id: string; title: string }) => ({
            type: "TaxCase",
            id: c.id,
            label: c.title.slice(0, 60),
          })),
      );
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    fetchAssessments();
    fetchCases();
  }, [fetchAssessments, fetchCases]);

  async function handleReview() {
    if (!activeCases[0]) return;
    setReviewing(true);
    setReport(null);
    try {
      const res = await fetch("/api/multi-agent/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subjectType,
          subjectId: activeCases[0].id,
        }),
      });
      if (!res.ok) return;
      const json = await res.json();
      const data = json.data;
      setReport({
        finalSeverity: data.finalSeverity,
        finalSummary: data.finalSummary,
        finalRecommendation: data.finalRecommendation,
      });
      await fetchAssessments();
    } catch {
      // silent
    } finally {
      setReviewing(false);
    }
  }

  // Group assessments by subject for display
  const groupedBySubject = assessments.reduce<Record<string, AgentAssessment[]>>((acc, a) => {
    const key = `${a.subjectType}:${a.subjectId}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(a);
    return acc;
  }, {});

  const sortedSubjects = Object.entries(groupedBySubject).slice(0, 10);

  const criticalCount = assessments.filter((a) => a.severity === "CRITICAL").length;
  const highCount = assessments.filter((a) => a.severity === "HIGH").length;

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "40vh" }}>
        <p style={{ color: "var(--text-soft)", fontSize: 16 }}>Cargando análisis multiagente...</p>
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gap: 24, maxWidth: 1100, margin: "0 auto" }}>
      {/* Header */}
      <section style={{ background: "var(--bg-elev)", border: "1px solid var(--border)", borderRadius: 18, padding: 24 }}>
        <p style={{ color: "var(--accent)", fontSize: 12, fontWeight: 850, letterSpacing: "0.06em", margin: "0 0 8px", textTransform: "uppercase" }}>
          Multiagente Tributario
        </p>
        <h1 style={{ color: "var(--text)", fontSize: "2rem", fontWeight: 900, margin: "0 0 8px" }}>
          Análisis Multiagente Especializado
        </h1>
        <p style={{ color: "var(--text-soft)", fontSize: 15, lineHeight: 1.6, margin: 0, maxWidth: 600 }}>
          5 agentes especializados analizan riesgo, cumplimiento, documentos, impacto financiero y ejecución.
        </p>
      </section>

      {/* Quick review */}
      <section style={{ background: "var(--bg-elev)", border: "1px solid var(--border)", borderRadius: 18, padding: 22, display: "grid", gap: 14 }}>
        <h2 style={{ color: "var(--text)", fontSize: 17, fontWeight: 900, margin: 0 }}>Nueva revisión</h2>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
          <select
            value={subjectType}
            onChange={(e) => setSubjectType(e.target.value)}
            style={{
              padding: "10px 16px",
              borderRadius: 10,
              border: "1px solid var(--border)",
              fontSize: 14,
              fontWeight: 600,
              color: "var(--text)",
              background: "var(--bg-elev)",
            }}
          >
            <option value="TaxCase">Caso Tributario</option>
            <option value="Workflow">Workflow</option>
            <option value="Decision">Decisión</option>
            <option value="MonitorSignal">Señal de Monitor</option>
          </select>
          <button
            onClick={handleReview}
            disabled={reviewing || activeCases.length === 0}
            style={{
              padding: "10px 24px",
              borderRadius: 999,
              border: "none",
              background: reviewing ? "var(--bg-elev)" : "var(--accent)",
              color: "var(--text)",
              fontSize: 14,
              fontWeight: 800,
              cursor: reviewing ? "not-allowed" : "pointer",
            }}
          >
            {reviewing ? "Analizando..." : "Analizar con agentes"}
          </button>
        </div>
      </section>

      {/* Report */}
      {report && (
        <section style={{
          background: "var(--bg-elev)",
          border: `1px solid ${severityColor(report.finalSeverity as AgentAssessmentSeverity)}33`,
          borderLeft: `4px solid ${severityColor(report.finalSeverity as AgentAssessmentSeverity)}`,
          borderRadius: 18,
          padding: 22,
          display: "grid",
          gap: 14,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h2 style={{ color: "var(--text)", fontSize: 17, fontWeight: 900, margin: 0 }}>
              Reporte multiagente
            </h2>
            <span style={{
              padding: "4px 14px",
              borderRadius: 999,
              fontSize: 13,
              fontWeight: 800,
              color: severityColor(report.finalSeverity as AgentAssessmentSeverity),
              background: `${severityColor(report.finalSeverity as AgentAssessmentSeverity)}14`,
            }}>
              {SEVERITY_LABELS[report.finalSeverity as AgentAssessmentSeverity]}
            </span>
          </div>
          <p style={{ color: "var(--text)", fontSize: 14, margin: 0 }}>{report.finalSummary}</p>
          <div>
            <p style={{ color: "var(--text-soft)", fontSize: 11, fontWeight: 700, textTransform: "uppercase", margin: "0 0 6px" }}>
              Recomendación consolidada
            </p>
            <p style={{ color: "var(--text)", fontSize: 14, lineHeight: 1.55, margin: 0, whiteSpace: "pre-line" }}>
              {report.finalRecommendation}
            </p>
          </div>
        </section>
      )}

      {/* KPIs */}
      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 14 }}>
        <Kpi label="Evaluaciones" value={assessments.length} color="var(--text)" />
        <Kpi label="Críticas" value={criticalCount} color="#C4634A" />
        <Kpi label="Altas" value={highCount} color="#E8B84B" />
        <Kpi label="Sujetos" value={sortedSubjects.length} color="#3FA687" />
      </section>

      {/* Assessments by subject */}
      {sortedSubjects.length === 0 ? (
        <section style={{ background: "var(--accent-soft)", border: "1px solid var(--accent-soft)", borderRadius: 18, padding: 24, textAlign: "center" }}>
          <p style={{ color: "var(--accent)", fontSize: 16, fontWeight: 800, margin: 0 }}>
            Sin evaluaciones multiagente aún. Ejecuta un análisis desde el panel superior.
          </p>
        </section>
      ) : (
        sortedSubjects.map(([key, items]) => (
          <section key={key} style={{ background: "var(--bg-elev)", border: "1px solid var(--border)", borderRadius: 18, padding: 22, display: "grid", gap: 12 }}>
            <p style={{ color: "var(--text-soft)", fontSize: 11, fontWeight: 700, textTransform: "uppercase", margin: 0 }}>
              {key}
            </p>
            {items.map((a) => (
              <div
                key={a.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  padding: "12px 16px",
                  borderRadius: 12,
                  background: a.severity === "CRITICAL" ? "rgba(196,99,74,0.14)" : a.severity === "HIGH" ? "rgba(232,184,75,0.14)" : "var(--bg-sunken)",
                  border: "1px solid",
                  borderColor: a.severity === "CRITICAL" ? "rgba(196,99,74,0.14)" : a.severity === "HIGH" ? "rgba(232,184,75,0.14)" : "var(--border)",
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4 }}>
                    <span style={{ fontSize: 16 }}>{AGENT_EMOJIS[a.agentType]}</span>
                    <span style={{ color: "var(--text)", fontSize: 13, fontWeight: 800 }}>
                      {AGENT_LABELS[a.agentType]}
                    </span>
                    <span style={{
                      fontSize: 11,
                      fontWeight: 800,
                      color: severityColor(a.severity),
                      background: `${severityColor(a.severity)}14`,
                      padding: "1px 8px",
                      borderRadius: 999,
                    }}>
                      {SEVERITY_LABELS[a.severity]}
                    </span>
                  </div>
                  <p style={{ color: "var(--text)", fontSize: 13, margin: 0 }}>{a.summary}</p>
                  <p style={{ color: "var(--accent)", fontSize: 12, margin: "4px 0 0" }}>
                    {a.recommendation}
                  </p>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <p style={{ color: "var(--text)", fontSize: 14, fontWeight: 900, margin: 0 }}>
                    {Math.round(a.confidence * 100)}%
                  </p>
                  <p style={{ color: "var(--text-soft)", fontSize: 10, margin: 0 }}>confianza</p>
                </div>
              </div>
            ))}
          </section>
        ))
      )}
    </div>
  );
}

function Kpi({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <article style={{ background: "var(--bg-elev)", border: "1px solid var(--border)", borderRadius: 16, padding: 18 }}>
      <p style={{ color: "var(--text-soft)", fontSize: 13, fontWeight: 800, margin: "0 0 8px" }}>{label}</p>
      <p style={{ color, fontSize: 24, fontWeight: 900, margin: 0 }}>{value}</p>
    </article>
  );
}
