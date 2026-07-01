"use client";

import { useEffect, useState, useCallback } from "react";
import {
  type TaxCase,
  type TaxCaseStatus,
  type TaxCasePriority,
  STATUS_LABELS,
  PRIORITY_LABELS,
  TAX_CASE_STATUSES,
  TAX_CASE_PRIORITIES,
  statusColor,
  priorityColor,
} from "@/modules/tax-cases/domain/taxCase";

interface ExpertData {
  totalUsers: number;
  criticalCount: number;
  openCount: number;
  resolvedCount: number;
  items: TaxCase[];
}

export default function ExpertCasosPage() {
  const [data, setData] = useState<ExpertData | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [priorityFilter, setPriorityFilter] = useState<string>("ALL");

  const fetchCases = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      if (priorityFilter !== "ALL") params.set("priority", priorityFilter);
      const res = await fetch(`/api/expert/tax-cases?${params.toString()}`);
      if (!res.ok) return;
      const json = await res.json();
      setData(json.data ?? null);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [statusFilter, priorityFilter]);

  useEffect(() => {
    fetchCases();
  }, [fetchCases]);

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "40vh" }}>
        <p style={{ color: "var(--text-soft)", fontSize: 16 }}>Cargando panel de casos...</p>
      </div>
    );
  }

  const items = data?.items ?? [];

  return (
    <div style={{ display: "grid", gap: 24 }}>
      {/* Header */}
      <section style={{ background: "var(--bg-elev)", border: "1px solid var(--border)", borderRadius: 18, padding: 24 }}>
        <p style={{ color: "var(--accent)", fontSize: 12, fontWeight: 850, letterSpacing: "0.06em", margin: "0 0 8px", textTransform: "uppercase" }}>
          Panel Experto • Casos Tributarios
        </p>
        <h1 style={{ color: "var(--text)", fontSize: "1.8rem", fontWeight: 900, margin: "0 0 6px" }}>
          Consolidado de Casos
        </h1>
        <p style={{ color: "var(--text-soft)", fontSize: 14, margin: 0 }}>
          Vista global de todos los casos tributarios generados por LEDGERA. Monitorea usuarios afectados, casos críticos y resueltos.
        </p>
      </section>

      {/* KPIs */}
      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14 }}>
        <KpiCard label="Usuarios afectados" value={data?.totalUsers ?? 0} detail="Con casos activos" color="#3FA687" />
        <KpiCard label="Casos críticos" value={data?.criticalCount ?? 0} detail="Requieren acción" color="#C4634A" />
        <KpiCard label="Casos abiertos" value={data?.openCount ?? 0} detail="En curso" color="#E8B84B" />
        <KpiCard label="Casos resueltos" value={data?.resolvedCount ?? 0} detail="Gestionados" color="#3FA687" />
      </section>

      {/* Filters */}
      <section style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
        <span style={{ color: "var(--text-soft)", fontSize: 13, fontWeight: 700 }}>Filtros:</span>
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
          {TAX_CASE_STATUSES.map((s) => (
            <option key={s} value={s}>{STATUS_LABELS[s]}</option>
          ))}
        </select>
        <select
          value={priorityFilter}
          onChange={(e) => { setPriorityFilter(e.target.value); setLoading(true); }}
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
          <option value="ALL">Todas las prioridades</option>
          {TAX_CASE_PRIORITIES.map((p) => (
            <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>
          ))}
        </select>
      </section>

      {/* Table */}
      {items.length === 0 ? (
        <section style={{ background: "var(--bg-elev)", border: "1px solid var(--border)", borderRadius: 18, padding: 32, textAlign: "center" }}>
          <p style={{ color: "var(--text-soft)", fontSize: 15, margin: 0 }}>No se encontraron casos con los filtros seleccionados.</p>
        </section>
      ) : (
        <section style={{ background: "var(--bg-elev)", border: "1px solid var(--border)", borderRadius: 18, overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
              <thead>
                <tr style={{ background: "var(--bg-sunken)", borderBottom: "1px solid var(--border)" }}>
                  <th style={{ padding: "12px 16px", textAlign: "left", color: "var(--text-soft)", fontWeight: 800, fontSize: 11, textTransform: "uppercase" }}>Prioridad</th>
                  <th style={{ padding: "12px 16px", textAlign: "left", color: "var(--text-soft)", fontWeight: 800, fontSize: 11, textTransform: "uppercase" }}>Caso</th>
                  <th style={{ padding: "12px 16px", textAlign: "left", color: "var(--text-soft)", fontWeight: 800, fontSize: 11, textTransform: "uppercase" }}>Usuario</th>
                  <th style={{ padding: "12px 16px", textAlign: "left", color: "var(--text-soft)", fontWeight: 800, fontSize: 11, textTransform: "uppercase" }}>Estado</th>
                  <th style={{ padding: "12px 16px", textAlign: "left", color: "var(--text-soft)", fontWeight: 800, fontSize: 11, textTransform: "uppercase" }}>Origen</th>
                  <th style={{ padding: "12px 16px", textAlign: "left", color: "var(--text-soft)", fontWeight: 800, fontSize: 11, textTransform: "uppercase" }}>Actualización</th>
                </tr>
              </thead>
              <tbody>
                {items.map((tc) => (
                  <tr key={tc.id} style={{ borderBottom: "1px solid var(--border)" }}>
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
                    <td style={{ padding: "14px 16px", color: "var(--text)", fontWeight: 700, maxWidth: 280 }}>
                      <p style={{ margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{tc.title}</p>
                    </td>
                    <td style={{ padding: "14px 16px", color: "var(--text-soft)", fontSize: 13 }}>{tc.userId.slice(0, 8)}...</td>
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ padding: "12px 22px", borderTop: "1px solid var(--border)", textAlign: "center" }}>
            <span style={{ color: "var(--text-soft)", fontSize: 13 }}>
              {items.length} caso(s) • {data?.totalUsers ?? 0} usuario(s) afectado(s)
            </span>
          </div>
        </section>
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
