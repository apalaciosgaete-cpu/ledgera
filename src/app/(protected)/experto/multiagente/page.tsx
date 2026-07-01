"use client";

import { useEffect, useState, useCallback } from "react";
import {
  type AgentAssessment,
  AGENT_LABELS,
  AGENT_EMOJIS,
  SEVERITY_LABELS,
  severityColor,
  AGENT_TYPES,
} from "@/modules/multi-agent/domain/agent";

interface ExpertData {
  total: number;
  uniqueUsers: number;
  severityDistribution: Record<string, number>;
  items: AgentAssessment[];
}

export default function ExpertMultiAgentePage() {
  const [data, setData] = useState<ExpertData | null>(null);
  const [loading, setLoading] = useState(true);
  const [agentFilter, setAgentFilter] = useState<string>("ALL");
  const [severityFilter, setSeverityFilter] = useState<string>("ALL");

  const fetchAssessments = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (agentFilter !== "ALL") params.set("agentType", agentFilter);
      if (severityFilter !== "ALL") params.set("severity", severityFilter);
      const res = await fetch(`/api/expert/multi-agent/assessments?${params.toString()}`);
      if (!res.ok) return;
      const json = await res.json();
      setData(json.data ?? null);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [agentFilter, severityFilter]);

  useEffect(() => {
    fetchAssessments();
  }, [fetchAssessments]);

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "40vh" }}>
        <p style={{ color: "var(--text-soft)", fontSize: 16 }}>Cargando panel multiagente...</p>
      </div>
    );
  }

  const items = data?.items ?? [];
  const dist = data?.severityDistribution ?? {};

  return (
    <div style={{ display: "grid", gap: 24 }}>
      {/* Header */}
      <section style={{ background: "var(--bg-elev)", border: "1px solid var(--border)", borderRadius: 18, padding: 24 }}>
        <p style={{ color: "var(--accent)", fontSize: 12, fontWeight: 850, letterSpacing: "0.06em", margin: "0 0 8px", textTransform: "uppercase" }}>
          Panel Experto • Multiagente
        </p>
        <h1 style={{ color: "var(--text)", fontSize: "1.8rem", fontWeight: 900, margin: "0 0 6px" }}>
          Evaluaciones Multiagente
        </h1>
        <p style={{ color: "var(--text-soft)", fontSize: 14, margin: 0 }}>
          Consolidado de evaluaciones de los 5 agentes especializados: Riesgo, Cumplimiento, Documental, Financiero y Ejecución.
        </p>
      </section>

      {/* KPIs */}
      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 14 }}>
        <Kpi label="Total evaluaciones" value={data?.total ?? 0} color="var(--text)" />
        <Kpi label="Usuarios" value={data?.uniqueUsers ?? 0} color="#3FA687" />
        <Kpi label="Críticas" value={dist.CRITICAL ?? 0} color="#C4634A" />
        <Kpi label="Altas" value={dist.HIGH ?? 0} color="#E8B84B" />
        <Kpi label="Medias" value={dist.MEDIUM ?? 0} color="#3FA687" />
        <Kpi label="Bajas" value={dist.LOW ?? 0} color="var(--text-soft)" />
      </section>

      {/* Filters */}
      <section style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
        <span style={{ color: "var(--text-soft)", fontSize: 13, fontWeight: 700 }}>Filtros:</span>
        <select
          value={agentFilter}
          onChange={(e) => { setAgentFilter(e.target.value); setLoading(true); }}
          style={{
            padding: "8px 14px",
            borderRadius: 8,
            border: "1px solid var(--border)",
            background: "var(--bg-elev)",
            fontSize: 13,
            fontWeight: 600,
            color: "var(--text)",
          }}
        >
          <option value="ALL">Todos los agentes</option>
          {AGENT_TYPES.map((a) => (
            <option key={a} value={a}>{AGENT_LABELS[a]}</option>
          ))}
        </select>
        <select
          value={severityFilter}
          onChange={(e) => { setSeverityFilter(e.target.value); setLoading(true); }}
          style={{
            padding: "8px 14px",
            borderRadius: 8,
            border: "1px solid var(--border)",
            background: "var(--bg-elev)",
            fontSize: 13,
            fontWeight: 600,
            color: "var(--text)",
          }}
        >
          <option value="ALL">Todas las severidades</option>
          {["CRITICAL", "HIGH", "MEDIUM", "LOW"].map((s) => (
            <option key={s} value={s}>{SEVERITY_LABELS[s as keyof typeof SEVERITY_LABELS]}</option>
          ))}
        </select>
      </section>

      {items.length === 0 ? (
        <section style={{ background: "var(--bg-elev)", border: "1px solid var(--border)", borderRadius: 18, padding: 32, textAlign: "center" }}>
          <p style={{ color: "var(--text-soft)", fontSize: 15, margin: 0 }}>No se encontraron evaluaciones con los filtros seleccionados.</p>
        </section>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {items.map((a) => (
            <div
              key={a.id}
              style={{
                background: "var(--bg-elev)",
                border: "1px solid",
                borderColor: a.severity === "CRITICAL" ? "rgba(196,99,74,0.14)" : a.severity === "HIGH" ? "rgba(232,184,75,0.14)" : "var(--border)",
                borderRadius: 14,
                padding: "16px 20px",
                display: "grid",
                gap: 10,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <span style={{ fontSize: 20 }}>{AGENT_EMOJIS[a.agentType]}</span>
                  <div>
                    <p style={{ color: "var(--text)", fontSize: 14, fontWeight: 800, margin: 0 }}>
                      {AGENT_LABELS[a.agentType]}
                    </p>
                    <p style={{ color: "var(--text-soft)", fontSize: 11, margin: 0 }}>
                      {a.subjectType} • Usuario: {a.userId.slice(0, 8)}...
                    </p>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <span style={{
                    padding: "2px 10px",
                    borderRadius: 999,
                    fontSize: 12,
                    fontWeight: 800,
                    color: severityColor(a.severity),
                    background: `${severityColor(a.severity)}14`,
                  }}>
                    {SEVERITY_LABELS[a.severity]}
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 800, color: "var(--text)" }}>
                    {Math.round(a.confidence * 100)}%
                  </span>
                </div>
              </div>
              <p style={{ color: "var(--text-soft)", fontSize: 13, margin: 0 }}>{a.summary}</p>
              <p style={{ color: "var(--accent)", fontSize: 13, margin: 0 }}>{a.recommendation}</p>
              <p style={{ color: "var(--text-soft)", fontSize: 11, margin: 0 }}>
                {new Date(a.createdAt).toLocaleDateString("es-CL")}
              </p>
            </div>
          ))}
          <p style={{ color: "var(--text-soft)", fontSize: 12, textAlign: "center", margin: 0 }}>
            {items.length} evaluación(es) • {data?.uniqueUsers ?? 0} usuario(s)
          </p>
        </div>
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
