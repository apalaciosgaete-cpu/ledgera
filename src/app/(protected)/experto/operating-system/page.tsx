"use client";

import { useEffect, useState, useCallback } from "react";
import {
  type OperatingStatus,
  OPERATING_LABELS,
  OPERATING_EMOJIS,
  operatingColor,
} from "@/modules/laios/domain/laiosKernel";

interface ExpertState {
  userId: string;
  operatingStatus: OperatingStatus;
  executiveSummary: string;
  generatedAt: string;
}

interface ExpertData {
  total: number;
  statusDistribution: Record<string, number>;
  items: ExpertState[];
}

export default function ExpertOperatingSystemPage() {
  const [data, setData] = useState<ExpertData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStates = useCallback(async () => {
    try {
      const res = await fetch("/api/expert/laios");
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
    fetchStates();
  }, [fetchStates]);

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "40vh" }}>
        <p style={{ color: "var(--text-soft)", fontSize: 16 }}>Cargando panel LAIOS...</p>
      </div>
    );
  }

  const items = data?.items ?? [];
  const dist = data?.statusDistribution ?? {};

  return (
    <div style={{ display: "grid", gap: 24 }}>
      {/* Header */}
      <section style={{ background: "var(--bg-elev)", border: "1px solid var(--border)", borderRadius: 18, padding: 24 }}>
        <p style={{ color: "var(--accent)", fontSize: 12, fontWeight: 850, letterSpacing: "0.06em", margin: "0 0 8px", textTransform: "uppercase" }}>
          Panel Experto • LAIOS
        </p>
        <h1 style={{ color: "var(--text)", fontSize: "1.8rem", fontWeight: 900, margin: "0 0 6px" }}>
          LEDGERA AI Operating System
        </h1>
        <p style={{ color: "var(--text-soft)", fontSize: 14, margin: 0 }}>
          Consolidado de estados operativos de todos los usuarios LEDGERA. Monitorea la salud global del sistema.
        </p>
      </section>

      {/* Status Distribution KPIs */}
      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 14 }}>
        <Kpi label="Usuarios totales" value={data?.total ?? 0} color="var(--text)" />
        <Kpi label="🟢 Óptimo" value={dist.OPTIMAL ?? 0} color="#3FA687" />
        <Kpi label="🔵 Normal" value={dist.NORMAL ?? 0} color="#3FA687" />
        <Kpi label="🟡 Atención" value={dist.ATTENTION ?? 0} color="#E8B84B" />
        <Kpi label="🔴 Crítico" value={dist.CRITICAL ?? 0} color="#C4634A" />
      </section>

      {items.length === 0 ? (
        <section style={{ background: "var(--bg-elev)", border: "1px solid var(--border)", borderRadius: 18, padding: 32, textAlign: "center" }}>
          <p style={{ color: "var(--text-soft)", fontSize: 15, margin: 0 }}>
            No hay estados LAIOS registrados. Los usuarios deben ejecutar al menos un ciclo operativo.
          </p>
        </section>
      ) : (
        <section style={{ background: "var(--bg-elev)", border: "1px solid var(--border)", borderRadius: 18, overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
              <thead>
                <tr style={{ background: "var(--bg-sunken)", borderBottom: "1px solid var(--border)" }}>
                  <th style={{ padding: "12px 16px", textAlign: "left", color: "var(--text-soft)", fontWeight: 800, fontSize: 11, textTransform: "uppercase" }}>Usuario</th>
                  <th style={{ padding: "12px 16px", textAlign: "left", color: "var(--text-soft)", fontWeight: 800, fontSize: 11, textTransform: "uppercase" }}>Estado</th>
                  <th style={{ padding: "12px 16px", textAlign: "left", color: "var(--text-soft)", fontWeight: 800, fontSize: 11, textTransform: "uppercase" }}>Resumen Ejecutivo</th>
                  <th style={{ padding: "12px 16px", textAlign: "left", color: "var(--text-soft)", fontWeight: 800, fontSize: 11, textTransform: "uppercase" }}>Última Actualización</th>
                </tr>
              </thead>
              <tbody>
                {items.map((s) => {
                  const status: OperatingStatus = s.operatingStatus;
                  return (
                    <tr key={s.userId} style={{ borderBottom: "1px solid var(--border)" }}>
                      <td style={{ padding: "14px 16px", color: "var(--text)", fontWeight: 700 }}>
                        {s.userId.slice(0, 8)}...
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        <span style={{
                          display: "inline-block",
                          padding: "3px 12px",
                          borderRadius: 999,
                          fontSize: 12,
                          fontWeight: 800,
                          color: operatingColor(status),
                          background: `${operatingColor(status)}14`,
                        }}>
                          {OPERATING_EMOJIS[status] ?? ""} {OPERATING_LABELS[status] ?? status}
                        </span>
                      </td>
                      <td style={{ padding: "14px 16px", color: "var(--text-soft)", fontSize: 13, maxWidth: 400 }}>
                        {s.executiveSummary.slice(0, 120)}...
                      </td>
                      <td style={{ padding: "14px 16px", color: "var(--text-soft)", fontSize: 13 }}>
                        {new Date(s.generatedAt).toLocaleDateString("es-CL")}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div style={{ padding: "12px 22px", borderTop: "1px solid var(--border)", textAlign: "center" }}>
            <span style={{ color: "var(--text-soft)", fontSize: 13 }}>
              {items.length} usuario(s) • {dist.CRITICAL ?? 0} crítico(s) • {dist.ATTENTION ?? 0} en atención
            </span>
          </div>
        </section>
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
