"use client";

import { useEffect, useState, useCallback } from "react";
import {
  type Workflow,
  type WorkflowSummary,
  STATUS_LABELS,
  statusColor,
  STEP_STATUS_LABELS,
  ACTION_TYPE_LABELS,
  WORKFLOW_STATUSES,
} from "@/modules/workflow-engine/domain/workflow";

interface ExpertSummary extends WorkflowSummary {
  uniqueUsers: number;
}

export default function ExpertWorkflowsPage() {
  const [data, setData] = useState<ExpertSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchWorkflows = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      const res = await fetch(`/api/expert/workflows?${params.toString()}`);
      if (!res.ok) return;
      const json = await res.json();
      setData(json.data ?? null);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchWorkflows();
  }, [fetchWorkflows]);

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "40vh" }}>
        <p style={{ color: "var(--text-soft)", fontSize: 16 }}>Cargando panel de workflows...</p>
      </div>
    );
  }

  const items = data?.items ?? [];

  return (
    <div style={{ display: "grid", gap: 24 }}>
      {/* Header */}
      <section style={{ background: "var(--bg-elev)", border: "1px solid var(--border)", borderRadius: 18, padding: 24 }}>
        <p style={{ color: "var(--accent)", fontSize: 12, fontWeight: 850, letterSpacing: "0.06em", margin: "0 0 8px", textTransform: "uppercase" }}>
          Panel Experto • Workflows
        </p>
        <h1 style={{ color: "var(--text)", fontSize: "1.8rem", fontWeight: 900, margin: "0 0 6px" }}>
          Consolidado de Workflows
        </h1>
        <p style={{ color: "var(--text-soft)", fontSize: 14, margin: 0 }}>
          Vista global de todos los workflows tributarios autónomos. Monitorea ejecuciones, aprobaciones pendientes y fallos.
        </p>
      </section>

      {/* KPIs */}
      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 14 }}>
        <Kpi label="Usuarios" value={data?.uniqueUsers ?? 0} color="#3FA687" />
        <Kpi label="Pendientes" value={data?.pendingCount ?? 0} color="var(--text-soft)" />
        <Kpi label="Ejecutando" value={data?.runningCount ?? 0} color="#3FA687" />
        <Kpi label="Esperando" value={data?.waitingCount ?? 0} color="#E8B84B" />
        <Kpi label="Completados" value={data?.completedCount ?? 0} color="#3FA687" />
        <Kpi label="Fallidos" value={data?.failedCount ?? 0} color="#C4634A" />
      </section>

      {/* Filter */}
      <section style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
        <span style={{ color: "var(--text-soft)", fontSize: 13, fontWeight: 700 }}>Filtro:</span>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setLoading(true); }}
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
          <option value="ALL">Todos los estados</option>
          {WORKFLOW_STATUSES.map((s) => (
            <option key={s} value={s}>{STATUS_LABELS[s]}</option>
          ))}
        </select>
      </section>

      {items.length === 0 ? (
        <section style={{ background: "var(--bg-elev)", border: "1px solid var(--border)", borderRadius: 18, padding: 32, textAlign: "center" }}>
          <p style={{ color: "var(--text-soft)", fontSize: 15, margin: 0 }}>No se encontraron workflows con los filtros seleccionados.</p>
        </section>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {items.map((wf) => {
            const isExpanded = expandedId === wf.id;
            return (
              <article
                key={wf.id}
                style={{
                  background: "var(--bg-elev)",
                  border: "1px solid var(--border)",
                  borderRadius: 16,
                  padding: "18px 22px",
                  display: "grid",
                  gap: 12,
                  cursor: "pointer",
                }}
                onClick={() => setExpandedId(isExpanded ? null : wf.id)}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginBottom: 4 }}>
                      <span style={{
                        display: "inline-block",
                        padding: "2px 10px",
                        borderRadius: 999,
                        fontSize: 12,
                        fontWeight: 800,
                        color: statusColor(wf.status),
                        background: `${statusColor(wf.status)}14`,
                      }}>
                        {STATUS_LABELS[wf.status]}
                      </span>
                      <span style={{ fontSize: 11, color: "var(--text-soft)" }}>Usuario: {wf.userId.slice(0, 8)}...</span>
                    </div>
                    <h3 style={{ color: "var(--text)", fontSize: 15, fontWeight: 800, margin: 0 }}>{wf.title}</h3>
                  </div>
                  <span style={{ color: "var(--text-soft)", fontSize: 13 }}>
                    {wf.steps.length} paso(s)
                  </span>
                </div>

                {isExpanded && (
                  <div style={{ borderTop: "1px solid var(--border)", paddingTop: 14, display: "grid", gap: 8 }}>
                    {wf.steps.map((step) => (
                      <div
                        key={step.id}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: "10px 14px",
                          borderRadius: 10,
                          background: step.status === "PENDING" ? "var(--bg-sunken)" : step.status === "SUCCESS" ? "#1D2C27" : step.status === "FAILED" ? "rgba(196,99,74,0.14)" : "var(--bg-sunken)",
                          border: "1px solid",
                          borderColor: step.status === "SUCCESS" ? "#1D2C27" : step.status === "FAILED" ? "rgba(196,99,74,0.14)" : "var(--border)",
                        }}
                      >
                        <div>
                          <p style={{ color: "var(--text)", fontSize: 13, fontWeight: 700, margin: 0 }}>
                            {step.stepOrder}. {ACTION_TYPE_LABELS[step.actionType] ?? step.actionType}
                          </p>
                          <p style={{ color: "var(--text-soft)", fontSize: 12, margin: "2px 0 0" }}>{step.title}</p>
                        </div>
                        <span style={{
                          fontSize: 11,
                          fontWeight: 800,
                          color: step.status === "SUCCESS" ? "#3FA687" : step.status === "FAILED" ? "#C4634A" : "var(--text-soft)",
                        }}>
                          {STEP_STATUS_LABELS[step.status]}
                        </span>
                      </div>
                    ))}
                    <p style={{ color: "var(--text-soft)", fontSize: 11, margin: "4px 0 0" }}>
                      Creado: {new Date(wf.createdAt).toLocaleDateString("es-CL")}
                    </p>
                  </div>
                )}
              </article>
            );
          })}
          <p style={{ color: "var(--text-soft)", fontSize: 12, textAlign: "center", margin: 0 }}>
            {items.length} workflow(s) • {data?.uniqueUsers ?? 0} usuario(s) afectado(s)
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
