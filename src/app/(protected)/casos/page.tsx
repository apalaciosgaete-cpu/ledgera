"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  type TaxCase,
  type TaxCaseStatus,
  type TaxCasePriority,
  STATUS_LABELS,
  PRIORITY_LABELS,
  statusColor,
  priorityColor,
} from "@/modules/tax-cases/domain/taxCase";

interface CasesData {
  openCount: number;
  criticalCount: number;
  investigatingCount: number;
  resolvedCount: number;
  totalCount: number;
  items: TaxCase[];
}

export default function CasosPage() {
  const [data, setData] = useState<CasesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [rebuilding, setRebuilding] = useState(false);
  const [selectedCase, setSelectedCase] = useState<TaxCase | null>(null);

  const fetchCases = useCallback(async () => {
    try {
      const res = await fetch("/api/tax-cases");
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
    fetchCases();
  }, [fetchCases]);

  async function handleRebuild() {
    setRebuilding(true);
    try {
      const res = await fetch("/api/tax-cases/rebuild", { method: "POST" });
      if (!res.ok) return;
      const json = await res.json();
      setData(json.data ?? null);
    } catch {
      // silent
    } finally {
      setRebuilding(false);
    }
  }

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "40vh" }}>
        <p style={{ color: "var(--text-soft)", fontSize: 16 }}>Cargando casos tributarios...</p>
      </div>
    );
  }

  const items = data?.items ?? [];

  return (
    <div style={{ display: "grid", gap: 24, maxWidth: 1200, margin: "0 auto" }}>
      {/* Header */}
      <section style={{ background: "var(--bg-elev)", border: "1px solid var(--border)", borderRadius: 18, padding: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
          <div>
            <p style={{ color: "var(--accent)", fontSize: 12, fontWeight: 850, letterSpacing: "0.06em", margin: "0 0 8px", textTransform: "uppercase" }}>
              Casos Tributarios
            </p>
            <h1 style={{ color: "var(--text)", fontSize: "2rem", fontWeight: 900, margin: "0 0 8px" }}>
              Expedientes Inteligentes
            </h1>
            <p style={{ color: "var(--text-soft)", fontSize: 15, lineHeight: 1.6, margin: 0, maxWidth: 600 }}>
              LEDGERA agrupa alertas, decisiones, documentos y tareas en casos tributarios inteligentes.
            </p>
          </div>
          <button
            onClick={handleRebuild}
            disabled={rebuilding}
            style={{
              padding: "10px 22px",
              borderRadius: 999,
              border: "none",
              background: rebuilding ? "var(--bg-elev)" : "var(--accent)",
              color: "var(--text)",
              fontSize: 14,
              fontWeight: 800,
              cursor: rebuilding ? "not-allowed" : "pointer",
              transition: "all 0.15s ease",
            }}
          >
            {rebuilding ? "Escaneando..." : "Escanear casos"}
          </button>
        </div>
      </section>

      {/* KPIs */}
      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 14 }}>
        <KpiCard label="Casos abiertos" value={data?.openCount ?? 0} detail="Requieren acción" color="#3FA687" />
        <KpiCard label="Críticos" value={data?.criticalCount ?? 0} detail="Atención inmediata" color="#C4634A" />
        <KpiCard label="En investigación" value={data?.investigatingCount ?? 0} detail="Siendo analizados" color="#E8B84B" />
        <KpiCard label="Resueltos" value={data?.resolvedCount ?? 0} detail="Gestionados" color="#3FA687" />
        <KpiCard label="Total" value={data?.totalCount ?? 0} detail="Todos los casos" color="var(--text)" />
      </section>

      {items.length === 0 ? (
        <section style={{ background: "var(--accent-soft)", border: "1px solid var(--accent-soft)", borderRadius: 18, padding: 24, textAlign: "center" }}>
          <p style={{ color: "var(--accent)", fontSize: 18, fontWeight: 800, margin: "0 0 6px" }}>✅ Sin casos activos</p>
          <p style={{ color: "var(--accent)", fontSize: 14, margin: 0 }}>LEDGERA no detectó situaciones que requieran un caso tributario.</p>
        </section>
      ) : (
        <div style={{ display: "grid", gap: 16, gridTemplateColumns: selectedCase ? "1fr 380px" : "1fr" }}>
          {/* Table */}
          <section style={{ background: "var(--bg-elev)", border: "1px solid var(--border)", borderRadius: 18, overflow: "hidden" }}>
            <div style={{ padding: "18px 22px", borderBottom: "1px solid var(--border)" }}>
              <h2 style={{ color: "var(--text)", fontSize: 18, fontWeight: 900, margin: 0 }}>Casos activos</h2>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
                <thead>
                  <tr style={{ background: "var(--bg-sunken)", borderBottom: "1px solid var(--border)" }}>
                    <th style={{ padding: "12px 16px", textAlign: "left", color: "var(--text-soft)", fontWeight: 800, fontSize: 12, textTransform: "uppercase" }}>Prioridad</th>
                    <th style={{ padding: "12px 16px", textAlign: "left", color: "var(--text-soft)", fontWeight: 800, fontSize: 12, textTransform: "uppercase" }}>Caso</th>
                    <th style={{ padding: "12px 16px", textAlign: "left", color: "var(--text-soft)", fontWeight: 800, fontSize: 12, textTransform: "uppercase" }}>Estado</th>
                    <th style={{ padding: "12px 16px", textAlign: "left", color: "var(--text-soft)", fontWeight: 800, fontSize: 12, textTransform: "uppercase" }}>Origen</th>
                    <th style={{ padding: "12px 16px", textAlign: "left", color: "var(--text-soft)", fontWeight: 800, fontSize: 12, textTransform: "uppercase" }}>Actualización</th>
                    <th style={{ padding: "12px 16px", textAlign: "center", color: "var(--text-soft)", fontWeight: 800, fontSize: 12, textTransform: "uppercase" }}></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((tc) => (
                    <tr
                      key={tc.id}
                      style={{
                        borderBottom: "1px solid var(--border)",
                        cursor: "pointer",
                        background: selectedCase?.id === tc.id ? "#1D2C27" : "transparent",
                      }}
                      onClick={() => setSelectedCase(selectedCase?.id === tc.id ? null : tc)}
                    >
                      <td style={{ padding: "14px 16px" }}>
                        <span style={{
                          display: "inline-block",
                          padding: "2px 10px",
                          borderRadius: 999,
                          fontSize: 12,
                          fontWeight: 800,
                          color: priorityColor(tc.priority),
                          background: `${priorityColor(tc.priority)}14`,
                        }}>
                          {PRIORITY_LABELS[tc.priority]}
                        </span>
                      </td>
                      <td style={{ padding: "14px 16px", color: "var(--text)", fontWeight: 700 }}>{tc.title}</td>
                      <td style={{ padding: "14px 16px" }}>
                        <span style={{
                          display: "inline-block",
                          padding: "2px 10px",
                          borderRadius: 999,
                          fontSize: 12,
                          fontWeight: 800,
                          color: statusColor(tc.status),
                          background: `${statusColor(tc.status)}14`,
                        }}>
                          {STATUS_LABELS[tc.status]}
                        </span>
                      </td>
                      <td style={{ padding: "14px 16px", color: "var(--text-soft)", fontSize: 13 }}>{tc.sourceType.replace(/_/g, " ")}</td>
                      <td style={{ padding: "14px 16px", color: "var(--text-soft)", fontSize: 13 }}>
                        {new Date(tc.updatedAt).toLocaleDateString("es-CL")}
                      </td>
                      <td style={{ padding: "14px 16px", textAlign: "center" }}>
                        <span style={{ color: "var(--accent)", fontSize: 18 }}>→</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Side Panel */}
          {selectedCase && (
            <CaseDetailPanel taxCase={selectedCase} onClose={() => setSelectedCase(null)} onStatusChange={fetchCases} />
          )}
        </div>
      )}
    </div>
  );
}

function KpiCard({ label, value, detail, color }: { label: string; value: number; detail: string; color: string }) {
  return (
    <article style={{ background: "var(--bg-elev)", border: "1px solid var(--border)", borderRadius: 16, padding: 18 }}>
      <p style={{ color: "var(--text-soft)", fontSize: 13, fontWeight: 800, margin: "0 0 8px" }}>{label}</p>
      <p style={{ color, fontSize: 26, fontWeight: 900, margin: 0 }}>{value}</p>
      <p style={{ color: "var(--text-soft)", fontSize: 13, margin: "4px 0 0" }}>{detail}</p>
    </article>
  );
}

function CaseDetailPanel({ taxCase, onClose, onStatusChange }: { taxCase: TaxCase; onClose: () => void; onStatusChange?: () => void }) {
  const [updating, setUpdating] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isTerminal = taxCase.status === "RESOLVED" || taxCase.status === "CLOSED";

  // Available transitions based on current status
  const transitions: { status: TaxCaseStatus; label: string; color: string; bg: string }[] = [];

  if (!isTerminal) {
    transitions.push(
      { status: "INVESTIGATING", label: "En investigación", color: "var(--warn)", bg: "rgba(180,83,9,0.12)" },
      { status: "ACTION_REQUIRED", label: "Requiere acción", color: "var(--loss)", bg: "rgba(185,28,28,0.12)" },
      { status: "WAITING_USER", label: "Esperando usuario", color: "var(--accent)", bg: "rgba(109,40,217,0.12)" },
      { status: "WAITING_SII", label: "Esperando SII", color: "var(--accent)", bg: "rgba(3,105,161,0.12)" },
      { status: "RESOLVED", label: "✓ Resolver", color: "var(--accent)", bg: "rgba(4,120,87,0.12)" },
    );
  }

  if (isTerminal) {
    transitions.push(
      { status: "OPEN", label: "↺ Reabrir", color: "var(--accent)", bg: "rgba(37,99,235,0.12)" },
    );
  }

  if (taxCase.status !== "CLOSED") {
    transitions.push(
      { status: "CLOSED", label: "✕ Cerrar", color: "var(--text-soft)", bg: "rgba(100,116,139,0.12)" },
    );
  }

  async function handleStatusTransition(newStatus: TaxCaseStatus) {
    setUpdating(newStatus);
    setError(null);
    try {
      // Use reopen endpoint for reopening (preserves tax_case_reopened audit event)
      const isReopen = isTerminal && newStatus === "OPEN";
      const url = isReopen
        ? `/api/tax-cases/${taxCase.id}/reopen`
        : `/api/tax-cases/${taxCase.id}`;
      const res = await fetch(url, {
        method: isReopen ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: isReopen ? undefined : JSON.stringify({ status: newStatus }),
      });
      const json = await res.json();
      if (json.ok && onStatusChange) {
        onStatusChange();
      } else if (!json.ok) {
        setError(json.message ?? "Error al actualizar estado.");
      }
    } catch {
      setError("Error de conexión.");
    } finally {
      setUpdating(null);
    }
  }

  return (
    <aside style={{
      background: "var(--bg-elev)",
      border: "1px solid var(--border)",
      borderRadius: 18,
      padding: 22,
      position: "sticky",
      top: 100,
      alignSelf: "flex-start",
      display: "grid",
      gap: 18,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h3 style={{ color: "var(--text)", fontSize: 18, fontWeight: 900, margin: 0 }}>Detalle del caso</h3>
        <button
          onClick={onClose}
          style={{
            background: "none",
            border: "none",
            color: "var(--text-soft)",
            cursor: "pointer",
            fontSize: 20,
            padding: "4px 8px",
            borderRadius: 8,
          }}
        >
          ✕
        </button>
      </div>

      <div>
        <p style={{ color: "var(--text)", fontSize: 16, fontWeight: 800, margin: "0 0 4px" }}>{taxCase.title}</p>
        <p style={{ color: "var(--text-soft)", fontSize: 14, lineHeight: 1.55, margin: 0 }}>{taxCase.description}</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <div>
          <p style={{ color: "var(--text-soft)", fontSize: 11, fontWeight: 700, textTransform: "uppercase", margin: "0 0 3px" }}>Estado</p>
          <span style={{
            display: "inline-block",
            padding: "2px 10px",
            borderRadius: 999,
            fontSize: 12,
            fontWeight: 800,
            color: statusColor(taxCase.status),
            background: `${statusColor(taxCase.status)}14`,
          }}>
            {STATUS_LABELS[taxCase.status]}
          </span>
        </div>
        <div>
          <p style={{ color: "var(--text-soft)", fontSize: 11, fontWeight: 700, textTransform: "uppercase", margin: "0 0 3px" }}>Prioridad</p>
          <span style={{
            display: "inline-block",
            padding: "2px 10px",
            borderRadius: 999,
            fontSize: 12,
            fontWeight: 800,
            color: priorityColor(taxCase.priority),
            background: `${priorityColor(taxCase.priority)}14`,
          }}>
            {PRIORITY_LABELS[taxCase.priority]}
          </span>
        </div>
      </div>

      <div>
        <p style={{ color: "var(--text-soft)", fontSize: 11, fontWeight: 700, textTransform: "uppercase", margin: "0 0 3px" }}>Origen</p>
        <p style={{ color: "var(--text)", fontSize: 14, fontWeight: 600, margin: 0 }}>{taxCase.sourceType.replace(/_/g, " ")}</p>
      </div>

      <div>
        <p style={{ color: "var(--text-soft)", fontSize: 11, fontWeight: 700, textTransform: "uppercase", margin: "0 0 3px" }}>Resumen AI</p>
        <p style={{ color: "var(--text)", fontSize: 13, lineHeight: 1.55, margin: 0 }}>{taxCase.aiSummary}</p>
      </div>

      <div>
        <p style={{ color: "var(--text-soft)", fontSize: 11, fontWeight: 700, textTransform: "uppercase", margin: "0 0 6px" }}>Recomendaciones</p>
        <ul style={{ margin: 0, paddingLeft: 18, display: "grid", gap: 4 }}>
          {taxCase.aiRecommendation.split("\n").filter(Boolean).map((step, i) => (
            <li key={i} style={{ color: "var(--text)", fontSize: 13, lineHeight: 1.5 }}>{step}</li>
          ))}
        </ul>
      </div>

      {/* Status Transitions */}
      <div style={{ display: "grid", gap: 6 }}>
        <p style={{ color: "var(--text-soft)", fontSize: 11, fontWeight: 700, textTransform: "uppercase", margin: 0 }}>
          Cambiar estado
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
          {transitions.map((t) => {
            const isLoading = updating === t.status;
            const isCurrent = taxCase.status === t.status;
            return (
              <button
                key={t.status}
                onClick={() => handleStatusTransition(t.status)}
                disabled={isLoading || isCurrent}
                title={isCurrent ? "Estado actual" : t.label}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "8px 6px",
                  borderRadius: 8,
                  border: isCurrent ? `2px solid ${t.color}` : "1px solid transparent",
                  background: isLoading ? "var(--bg-elev)" : isCurrent ? t.bg: "var(--bg-sunken)",
                  color: isLoading ? "var(--text-soft)" : t.color,
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: isLoading || isCurrent ? "default" : "pointer",
                  opacity: isLoading || isCurrent ? 0.6 : 1,
                  transition: "all 0.15s ease",
                }}
              >
                {isLoading ? "..." : t.label}
              </button>
            );
          })}
        </div>
        {error && (
          <p style={{ color: "var(--loss)", fontSize: 12, margin: 0 }}>{error}</p>
        )}
      </div>

      <div style={{ display: "grid", gap: 8 }}>
        <p style={{ color: "var(--text-soft)", fontSize: 11, fontWeight: 700, textTransform: "uppercase", margin: 0 }}>Acciones rápidas</p>
        <Link
          href={`/tareas?caso=${taxCase.id}`}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "10px",
            borderRadius: 10,
            background: "var(--accent)",
            color: "var(--text)",
            fontSize: 14,
            fontWeight: 800,
            textDecoration: "none",
          }}
        >
          Ver tareas relacionadas
        </Link>
        <Link
          href={`/documentos?caso=${taxCase.id}`}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "10px",
            borderRadius: 10,
            background: "var(--bg-sunken)",
            color: "var(--text)",
            fontSize: 14,
            fontWeight: 800,
            textDecoration: "none",
          }}
        >
          Ver documentos relacionados
        </Link>
      </div>

      <p style={{ color: "var(--text-soft)", fontSize: 11, margin: 0 }}>
        Creado: {new Date(taxCase.createdAt).toLocaleDateString("es-CL")} • Actualizado: {new Date(taxCase.updatedAt).toLocaleDateString("es-CL")}
      </p>
    </aside>
  );
}
