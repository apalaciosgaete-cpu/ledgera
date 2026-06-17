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
        <p style={{ color: "#94A3B8", fontSize: 16 }}>Cargando casos tributarios...</p>
      </div>
    );
  }

  const items = data?.items ?? [];

  return (
    <div style={{ display: "grid", gap: 24, maxWidth: 1200, margin: "0 auto" }}>
      {/* Header */}
      <section style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 18, padding: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
          <div>
            <p style={{ color: "#0F766E", fontSize: 12, fontWeight: 850, letterSpacing: "0.06em", margin: "0 0 8px", textTransform: "uppercase" }}>
              Casos Tributarios
            </p>
            <h1 style={{ color: "#0F2A3D", fontSize: "2rem", fontWeight: 900, margin: "0 0 8px" }}>
              Expedientes Inteligentes
            </h1>
            <p style={{ color: "#64748B", fontSize: 15, lineHeight: 1.6, margin: 0, maxWidth: 600 }}>
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
              background: rebuilding ? "#94A3B8" : "#0F766E",
              color: "#FFFFFF",
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
        <KpiCard label="Casos abiertos" value={data?.openCount ?? 0} detail="Requieren acción" color="#2563EB" />
        <KpiCard label="Críticos" value={data?.criticalCount ?? 0} detail="Atención inmediata" color="#B91C1C" />
        <KpiCard label="En investigación" value={data?.investigatingCount ?? 0} detail="Siendo analizados" color="#B45309" />
        <KpiCard label="Resueltos" value={data?.resolvedCount ?? 0} detail="Gestionados" color="#047857" />
        <KpiCard label="Total" value={data?.totalCount ?? 0} detail="Todos los casos" color="#0F2A3D" />
      </section>

      {items.length === 0 ? (
        <section style={{ background: "#ECFDF5", border: "1px solid #BBF7D0", borderRadius: 18, padding: 24, textAlign: "center" }}>
          <p style={{ color: "#166534", fontSize: 18, fontWeight: 800, margin: "0 0 6px" }}>✅ Sin casos activos</p>
          <p style={{ color: "#166534", fontSize: 14, margin: 0 }}>LEDGERA no detectó situaciones que requieran un caso tributario.</p>
        </section>
      ) : (
        <div style={{ display: "grid", gap: 16, gridTemplateColumns: selectedCase ? "1fr 380px" : "1fr" }}>
          {/* Table */}
          <section style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 18, overflow: "hidden" }}>
            <div style={{ padding: "18px 22px", borderBottom: "1px solid #E2E8F0" }}>
              <h2 style={{ color: "#0F2A3D", fontSize: 18, fontWeight: 900, margin: 0 }}>Casos activos</h2>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
                <thead>
                  <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0" }}>
                    <th style={{ padding: "12px 16px", textAlign: "left", color: "#64748B", fontWeight: 800, fontSize: 12, textTransform: "uppercase" }}>Prioridad</th>
                    <th style={{ padding: "12px 16px", textAlign: "left", color: "#64748B", fontWeight: 800, fontSize: 12, textTransform: "uppercase" }}>Caso</th>
                    <th style={{ padding: "12px 16px", textAlign: "left", color: "#64748B", fontWeight: 800, fontSize: 12, textTransform: "uppercase" }}>Estado</th>
                    <th style={{ padding: "12px 16px", textAlign: "left", color: "#64748B", fontWeight: 800, fontSize: 12, textTransform: "uppercase" }}>Origen</th>
                    <th style={{ padding: "12px 16px", textAlign: "left", color: "#64748B", fontWeight: 800, fontSize: 12, textTransform: "uppercase" }}>Actualización</th>
                    <th style={{ padding: "12px 16px", textAlign: "center", color: "#64748B", fontWeight: 800, fontSize: 12, textTransform: "uppercase" }}></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((tc) => (
                    <tr
                      key={tc.id}
                      style={{
                        borderBottom: "1px solid #F1F5F9",
                        cursor: "pointer",
                        background: selectedCase?.id === tc.id ? "#F0FDF4" : "transparent",
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
                      <td style={{ padding: "14px 16px", color: "#0F2A3D", fontWeight: 700 }}>{tc.title}</td>
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
                      <td style={{ padding: "14px 16px", color: "#64748B", fontSize: 13 }}>{tc.sourceType.replace(/_/g, " ")}</td>
                      <td style={{ padding: "14px 16px", color: "#94A3B8", fontSize: 13 }}>
                        {new Date(tc.updatedAt).toLocaleDateString("es-CL")}
                      </td>
                      <td style={{ padding: "14px 16px", textAlign: "center" }}>
                        <span style={{ color: "#0F766E", fontSize: 18 }}>→</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Side Panel */}
          {selectedCase && (
            <CaseDetailPanel taxCase={selectedCase} onClose={() => setSelectedCase(null)} />
          )}
        </div>
      )}
    </div>
  );
}

function KpiCard({ label, value, detail, color }: { label: string; value: number; detail: string; color: string }) {
  return (
    <article style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 16, padding: 18 }}>
      <p style={{ color: "#64748B", fontSize: 13, fontWeight: 800, margin: "0 0 8px" }}>{label}</p>
      <p style={{ color, fontSize: 26, fontWeight: 900, margin: 0 }}>{value}</p>
      <p style={{ color: "#94A3B8", fontSize: 13, margin: "4px 0 0" }}>{detail}</p>
    </article>
  );
}

function CaseDetailPanel({ taxCase, onClose }: { taxCase: TaxCase; onClose: () => void }) {
  return (
    <aside style={{
      background: "#FFFFFF",
      border: "1px solid #E2E8F0",
      borderRadius: 18,
      padding: 22,
      position: "sticky",
      top: 100,
      alignSelf: "flex-start",
      display: "grid",
      gap: 18,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h3 style={{ color: "#0F2A3D", fontSize: 18, fontWeight: 900, margin: 0 }}>Detalle del caso</h3>
        <button
          onClick={onClose}
          style={{
            background: "none",
            border: "none",
            color: "#94A3B8",
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
        <p style={{ color: "#0F2A3D", fontSize: 16, fontWeight: 800, margin: "0 0 4px" }}>{taxCase.title}</p>
        <p style={{ color: "#64748B", fontSize: 14, lineHeight: 1.55, margin: 0 }}>{taxCase.description}</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <div>
          <p style={{ color: "#94A3B8", fontSize: 11, fontWeight: 700, textTransform: "uppercase", margin: "0 0 3px" }}>Estado</p>
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
          <p style={{ color: "#94A3B8", fontSize: 11, fontWeight: 700, textTransform: "uppercase", margin: "0 0 3px" }}>Prioridad</p>
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
        <p style={{ color: "#94A3B8", fontSize: 11, fontWeight: 700, textTransform: "uppercase", margin: "0 0 3px" }}>Origen</p>
        <p style={{ color: "#0F2A3D", fontSize: 14, fontWeight: 600, margin: 0 }}>{taxCase.sourceType.replace(/_/g, " ")}</p>
      </div>

      <div>
        <p style={{ color: "#94A3B8", fontSize: 11, fontWeight: 700, textTransform: "uppercase", margin: "0 0 3px" }}>Resumen AI</p>
        <p style={{ color: "#475569", fontSize: 13, lineHeight: 1.55, margin: 0 }}>{taxCase.aiSummary}</p>
      </div>

      <div>
        <p style={{ color: "#94A3B8", fontSize: 11, fontWeight: 700, textTransform: "uppercase", margin: "0 0 6px" }}>Recomendaciones</p>
        <ul style={{ margin: 0, paddingLeft: 18, display: "grid", gap: 4 }}>
          {taxCase.aiRecommendation.split("\n").filter(Boolean).map((step, i) => (
            <li key={i} style={{ color: "#475569", fontSize: 13, lineHeight: 1.5 }}>{step}</li>
          ))}
        </ul>
      </div>

      <div style={{ display: "grid", gap: 8 }}>
        <p style={{ color: "#94A3B8", fontSize: 11, fontWeight: 700, textTransform: "uppercase", margin: 0 }}>Acciones rápidas</p>
        <Link
          href={`/tareas?caso=${taxCase.id}`}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "10px",
            borderRadius: 10,
            background: "#0F766E",
            color: "#FFFFFF",
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
            background: "#F1F5F9",
            color: "#0F2A3D",
            fontSize: 14,
            fontWeight: 800,
            textDecoration: "none",
          }}
        >
          Ver documentos relacionados
        </Link>
      </div>

      <p style={{ color: "#94A3B8", fontSize: 11, margin: 0 }}>
        Creado: {new Date(taxCase.createdAt).toLocaleDateString("es-CL")} • Actualizado: {new Date(taxCase.updatedAt).toLocaleDateString("es-CL")}
      </p>
    </aside>
  );
}
