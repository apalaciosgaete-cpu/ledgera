"use client";

import { useEffect, useState, useCallback } from "react";
import {
  type LAIOSState,
  type OperatingStatus,
  type EngineState,
  OPERATING_LABELS,
  OPERATING_EMOJIS,
  ENGINE_EMOJIS,
  operatingColor,
  engineColor,
} from "@/modules/laios/domain/laiosKernel";

export default function OperatingSystemPage() {
  const [state, setState] = useState<LAIOSState | null>(null);
  const [loading, setLoading] = useState(true);
  const [rebuilding, setRebuilding] = useState(false);
  const [cycleResult, setCycleResult] = useState<string | null>(null);

  const fetchState = useCallback(async () => {
    try {
      const res = await fetch("/api/laios/state");
      if (!res.ok) return;
      const json = await res.json();
      setState(json.data ?? null);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchState();
  }, [fetchState]);

  async function handleRebuild() {
    setRebuilding(true);
    setCycleResult(null);
    try {
      const res = await fetch("/api/laios/rebuild", { method: "POST" });
      if (!res.ok) return;
      const json = await res.json();
      const data = json.data;
      if (data.ok) {
        setState(data.state);
        setCycleResult(`✅ Ciclo completado en ${data.duration}ms`);
      }
      await fetchState();
    } catch {
      setCycleResult("❌ Error al ejecutar ciclo operativo.");
    } finally {
      setRebuilding(false);
    }
  }

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "40vh" }}>
        <p style={{ color: "var(--text-soft)", fontSize: 16 }}>Cargando sistema operativo LAIOS...</p>
      </div>
    );
  }

  const engines = state?.engineStates ?? [];

  return (
    <div style={{ display: "grid", gap: 24, maxWidth: 1100, margin: "0 auto" }}>
      {/* Header */}
      <section style={{ background: "var(--bg-elev)", border: "1px solid var(--border)", borderRadius: 18, padding: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
          <div>
            <p style={{ color: "var(--accent)", fontSize: 12, fontWeight: 850, letterSpacing: "0.06em", margin: "0 0 8px", textTransform: "uppercase" }}>
              LEDGERA AI Operating System
            </p>
            <h1 style={{ color: "var(--text)", fontSize: "2rem", fontWeight: 900, margin: "0 0 8px" }}>
              Estado Operativo
            </h1>
            <p style={{ color: "var(--text-soft)", fontSize: 15, lineHeight: 1.6, margin: 0, maxWidth: 600 }}>
              LAIOS coordina todos los motores tributarios bajo un estado operativo unificado.
            </p>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            {cycleResult && (
              <span style={{ fontSize: 13, color: cycleResult.startsWith("✅") ? "var(--accent)" : "var(--loss)", fontWeight: 700 }}>
                {cycleResult}
              </span>
            )}
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
              }}
            >
              {rebuilding ? "Ejecutando ciclo..." : "Ejecutar ciclo operativo"}
            </button>
          </div>
        </div>
      </section>

      {!state ? (
        <section style={{ background: "var(--bg-sunken)", border: "1px solid var(--border)", borderRadius: 18, padding: 32, textAlign: "center" }}>
          <p style={{ color: "var(--text-soft)", fontSize: 15, margin: 0 }}>
            No hay datos de estado LAIOS. Ejecuta un ciclo operativo para generar el primer estado.
          </p>
        </section>
      ) : (
        <>
          {/* Operating Status */}
          <section style={{
            background: "var(--bg-elev)",
            border: `2px solid ${operatingColor(state.operatingStatus)}44`,
            borderRadius: 20,
            padding: 28,
            textAlign: "center",
            display: "grid",
            gap: 12,
          }}>
            <span style={{ fontSize: 48 }}>
              {OPERATING_EMOJIS[state.operatingStatus]}
            </span>
            <h2 style={{
              color: operatingColor(state.operatingStatus),
              fontSize: 28,
              fontWeight: 900,
              margin: 0,
            }}>
              {OPERATING_LABELS[state.operatingStatus]}
            </h2>
          </section>

          {/* Executive Summary */}
          <section style={{ background: "var(--bg-elev)", border: "1px solid var(--border)", borderRadius: 18, padding: 22 }}>
            <p style={{ color: "var(--text-soft)", fontSize: 11, fontWeight: 700, textTransform: "uppercase", margin: "0 0 8px" }}>
              Resumen Ejecutivo
            </p>
            <p style={{ color: "var(--text)", fontSize: 15, lineHeight: 1.7, margin: 0 }}>
              {state.executiveSummary}
            </p>
            <p style={{ color: "var(--text-soft)", fontSize: 11, margin: "12px 0 0" }}>
              Generado: {new Date(state.generatedAt).toLocaleString("es-CL")}
            </p>
          </section>

          {/* KPIs */}
          <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 14 }}>
            <Kpi label="Casos activos" value={state.activeCases} color="#3FA687" />
            <Kpi label="Workflows" value={state.activeWorkflows} color="#3FA687" />
            <Kpi label="Decisiones" value={state.pendingDecisions} color="#E8B84B" />
            <Kpi label="Ejecuciones" value={state.pendingExecutions} color="#3FA687" />
            <Kpi
              label="Tax Health"
              value={state.taxHealthScore ?? "—"}
              color={state.taxHealthScore != null && state.taxHealthScore < 50 ? "#C4634A" : "#3FA687"}
            />
            <Kpi
              label="Perfil Adaptativo"
              value={state.adaptiveProfileScore != null ? `${Math.round(state.adaptiveProfileScore * 100)}%` : "—"}
              color={state.adaptiveProfileScore != null && state.adaptiveProfileScore < 0.3 ? "#E8B84B" : "#3FA687"}
            />
          </section>

          {/* Engine States */}
          <section style={{ background: "var(--bg-elev)", border: "1px solid var(--border)", borderRadius: 18, padding: 22, display: "grid", gap: 12 }}>
            <h2 style={{ color: "var(--text)", fontSize: 17, fontWeight: 900, margin: 0 }}>Estado de Motores</h2>
            <div style={{ display: "grid", gap: 10 }}>
              {engines.map((engine) => (
                <div
                  key={engine.name}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "14px 18px",
                    borderRadius: 12,
                    background: engine.status === "CRITICAL" ? "rgba(196,99,74,0.14)" : engine.status === "ATTENTION" ? "rgba(232,184,75,0.14)" : "var(--bg-sunken)",
                    border: "1px solid",
                    borderColor: engine.status === "CRITICAL" ? "rgba(196,99,74,0.14)" : engine.status === "ATTENTION" ? "rgba(232,184,75,0.14)" : "var(--border)",
                  }}
                >
                  <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    <span style={{ fontSize: 22 }}>{ENGINE_EMOJIS[engine.name] ?? "🔧"}</span>
                    <div>
                      <p style={{ color: "var(--text)", fontSize: 14, fontWeight: 800, margin: 0 }}>{engine.name}</p>
                      <p style={{ color: "var(--text-soft)", fontSize: 12, margin: "2px 0 0" }}>{engine.summary}</p>
                    </div>
                  </div>
                  <span style={{
                    padding: "3px 12px",
                    borderRadius: 999,
                    fontSize: 12,
                    fontWeight: 800,
                    color: engineColor(engine.status),
                    background: `${engineColor(engine.status)}14`,
                  }}>
                    {engine.status === "OK" ? "✅ OK" : engine.status === "ATTENTION" ? "⚠️ Atención" : engine.status === "CRITICAL" ? "🔴 Crítico" : "⚪ Desactivado"}
                  </span>
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function Kpi({ label, value, color }: { label: string; value: number | string; color: string }) {
  return (
    <article style={{ background: "var(--bg-elev)", border: "1px solid var(--border)", borderRadius: 16, padding: 18 }}>
      <p style={{ color: "var(--text-soft)", fontSize: 13, fontWeight: 800, margin: "0 0 8px" }}>{label}</p>
      <p style={{ color, fontSize: 26, fontWeight: 900, margin: 0 }}>{value}</p>
    </article>
  );
}
