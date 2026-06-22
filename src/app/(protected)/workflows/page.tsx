"use client";

import { useEffect, useState, useCallback } from "react";
import {
  type Workflow,
  type WorkflowStatus,
  type WorkflowSummary,
  STATUS_LABELS,
  statusColor,
  STEP_STATUS_LABELS,
  ACTION_TYPE_LABELS,
} from "@/modules/workflow-engine/domain/workflow";

export default function WorkflowsPage() {
  const [data, setData] = useState<WorkflowSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [running, setRunning] = useState<string | null>(null);
  const [rebuilding, setRebuilding] = useState(false);

  const fetchWorkflows = useCallback(async () => {
    try {
      const res = await fetch("/api/workflows");
      if (!res.ok) return;
      const json = await res.json();
      setData(json.data ?? null);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWorkflows();
  }, [fetchWorkflows]);

  async function handleRun(workflowId: string) {
    setRunning(workflowId);
    try {
      const res = await fetch(`/api/workflows/${workflowId}/run`, { method: "POST" });
      if (!res.ok) return;
      await fetchWorkflows();
    } catch {
      // silent
    } finally {
      setRunning(null);
    }
  }

  async function handleRebuild() {
    setRebuilding(true);
    try {
      const res = await fetch("/api/workflows/rebuild", { method: "POST" });
      if (!res.ok) return;
      await fetchWorkflows();
    } catch {
      // silent
    } finally {
      setRebuilding(false);
    }
  }

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "40vh" }}>
        <p style={{ color: "#94A3B8", fontSize: 16 }}>Cargando workflows...</p>
      </div>
    );
  }

  const items = data?.items ?? [];

  return (
    <div style={{ display: "grid", gap: 24, maxWidth: 1100, margin: "0 auto" }}>
      {/* Header */}
      <section style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 18, padding: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
          <div>
            <p style={{ color: "#0F766E", fontSize: 12, fontWeight: 850, letterSpacing: "0.06em", margin: "0 0 8px", textTransform: "uppercase" }}>
              Workflow Autónomo
            </p>
            <h1 style={{ color: "#0F2A3D", fontSize: "2rem", fontWeight: 900, margin: "0 0 8px" }}>
              Flujos de Trabajo Tributarios
            </h1>
            <p style={{ color: "#64748B", fontSize: 15, lineHeight: 1.6, margin: 0, maxWidth: 600 }}>
              LEDGERA ejecuta pasos autónomos desde cada caso tributario. Los pasos sensibles requieren tu aprobación.
            </p>
          </div>
          <button
            onClick={handleRebuild}
            disabled={rebuilding}
            style={{
              padding: "10px 22px",
              borderRadius: 999,
              border: "none",
              background: rebuilding ? "#94A3B8" : "#0F766E",
              color: "#FFFFFF",
              fontSize: 14,
              fontWeight: 800,
              cursor: rebuilding ? "not-allowed" : "pointer",
            }}
          >
            {rebuilding ? "Generando..." : "Generar desde casos"}
          </button>
        </div>
      </section>

      {/* KPIs */}
      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 14 }}>
        <Kpi label="Pendientes" value={data?.pendingCount ?? 0} color="#64748B" />
        <Kpi label="En ejecución" value={data?.runningCount ?? 0} color="#2563EB" />
        <Kpi label="Esperando" value={data?.waitingCount ?? 0} color="#B45309" />
        <Kpi label="Completados" value={data?.completedCount ?? 0} color="#047857" />
        <Kpi label="Fallidos" value={data?.failedCount ?? 0} color="#B91C1C" />
      </section>

      {items.length === 0 ? (
        <section style={{ background: "#ECFDF5", border: "1px solid #BBF7D0", borderRadius: 18, padding: 24, textAlign: "center" }}>
          <p style={{ color: "#166534", fontSize: 18, fontWeight: 800, margin: "0 0 6px" }}>✅ Sin workflows activos</p>
          <p style={{ color: "#166534", fontSize: 14, margin: 0 }}>Genera workflows desde tus casos tributarios activos.</p>
        </section>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {items.map((wf) => {
            const isExpanded = expandedId === wf.id;
            const isRunning = running === wf.id;
            return (
              <article
                key={wf.id}
                style={{
                  background: "#FFFFFF",
                  border: "1px solid #E2E8F0",
                  borderRadius: 16,
                  padding: "18px 22px",
                  display: "grid",
                  gap: 12,
                  cursor: "pointer",
                  transition: "box-shadow 0.15s ease",
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
                      <span style={{ fontSize: 12, color: "#94A3B8" }}>{wf.sourceType.replace(/_/g, " ")}</span>
                    </div>
                    <h3 style={{ color: "#0F2A3D", fontSize: 16, fontWeight: 800, margin: 0 }}>{wf.title}</h3>
                    {wf.caseId && (
                      <p style={{ color: "#94A3B8", fontSize: 12, margin: "4px 0 0" }}>
                        Caso: {wf.caseId.slice(0, 8)}...
                      </p>
                    )}
                  </div>
                  <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                    {(wf.status === "PENDING" || wf.status === "WAITING_USER") && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleRun(wf.id); }}
                        disabled={isRunning}
                        style={{
                          padding: "8px 18px",
                          borderRadius: 999,
                          border: "none",
                          background: isRunning ? "#E2E8F0" : wf.status === "WAITING_USER" ? "#B45309" : "#0F766E",
                          color: isRunning ? "#94A3B8" : "#FFFFFF",
                          fontSize: 13,
                          fontWeight: 800,
                          cursor: isRunning ? "not-allowed" : "pointer",
                        }}
                      >
                        {isRunning ? "..." : wf.status === "WAITING_USER" ? "Aprobar" : "Ejecutar"}
                      </button>
                    )}
                    <span style={{ color: "#94A3B8", fontSize: 14, marginLeft: 4 }}>
                      {wf.steps.length} paso(s)
                    </span>
                  </div>
                </div>

                {/* Expanded steps */}
                {isExpanded && (
                  <div style={{ borderTop: "1px solid #F1F5F9", paddingTop: 14, display: "grid", gap: 8 }}>
                    {wf.steps.map((step) => (
                      <div
                        key={step.id}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: "10px 14px",
                          borderRadius: 10,
                          background: step.status === "PENDING" ? "#F8FAFC" : step.status === "SUCCESS" ? "#F0FDF4" : step.status === "FAILED" ? "#FEF2F2" : "#F8FAFC",
                          border: "1px solid",
                          borderColor: step.status === "SUCCESS" ? "#BBF7D0" : step.status === "FAILED" ? "#FECACA" : "#E2E8F0",
                        }}
                      >
                        <div>
                          <p style={{ color: "#0F2A3D", fontSize: 13, fontWeight: 700, margin: 0 }}>
                            {step.stepOrder}. {ACTION_TYPE_LABELS[step.actionType] ?? step.actionType}
                          </p>
                          <p style={{ color: "#64748B", fontSize: 12, margin: "2px 0 0" }}>{step.title}</p>
                        </div>
                        <span style={{
                          fontSize: 11,
                          fontWeight: 800,
                          color: step.status === "SUCCESS" ? "#047857" : step.status === "FAILED" ? "#B91C1C" : "#64748B",
                        }}>
                          {STEP_STATUS_LABELS[step.status]}
                        </span>
                      </div>
                    ))}
                    <p style={{ color: "#94A3B8", fontSize: 11, margin: "4px 0 0" }}>
                      Creado: {new Date(wf.createdAt).toLocaleDateString("es-CL")}
                    </p>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Kpi({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <article style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 16, padding: 18 }}>
      <p style={{ color: "#64748B", fontSize: 13, fontWeight: 800, margin: "0 0 8px" }}>{label}</p>
      <p style={{ color, fontSize: 24, fontWeight: 900, margin: 0 }}>{value}</p>
    </article>
  );
}
