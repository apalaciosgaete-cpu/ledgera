"use client";

import { FormEvent, useMemo, useState } from "react";
import type { SimulationScenarioType, SimulationResult } from "@/modules/simulation/domain/simulation";

type Scenario = {
  type: SimulationScenarioType;
  title: string;
  description: string;
  payload: Record<string, unknown>;
};

type SimulationResponse = {
  input: { scenarioType: SimulationScenarioType; payload: Record<string, unknown> };
  result: SimulationResult;
};

const scenarios: Scenario[] = [
  {
    type: "INCOME",
    title: "Aumentar ingresos",
    description: "Simula qué pasa si tus ingresos suben 20%.",
    payload: { increasePercentage: 20 },
  },
  {
    type: "COMPLIANCE",
    title: "Regularizar documentos",
    description: "Simula el efecto de ordenar documentos pendientes o rechazados.",
    payload: { regularize: true },
  },
  {
    type: "INVESTMENT",
    title: "Invertir",
    description: "Simula una inversión documentada y bien clasificada.",
    payload: { investmentType: "GENERAL" },
  },
  {
    type: "COMPLIANCE",
    title: "Atrasar cumplimiento",
    description: "Simula el impacto de atrasar declaraciones o documentos.",
    payload: { regularize: false },
  },
  {
    type: "CUSTOM",
    title: "Personalizado",
    description: "Escenario general para revisar una decisión tributaria.",
    payload: { note: "custom" },
  },
];

export default function SimuladorPage() {
  const [selected, setSelected] = useState<Scenario>(scenarios[0]);
  const [increasePercentage, setIncreasePercentage] = useState("20");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [simulation, setSimulation] = useState<SimulationResponse | null>(null);

  const payload = useMemo(() => {
    if (selected.type === "INCOME") {
      return { increasePercentage: Number(increasePercentage || "20") };
    }
    return selected.payload;
  }, [increasePercentage, selected]);

  async function run(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/simulations/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenarioType: selected.type, payload }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.message || "No se pudo ejecutar la simulación.");
      }
      setSimulation(json.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al simular.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ maxWidth: 1100, margin: "0 auto", display: "grid", gap: 24 }}>
      <section style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 18, padding: 24 }}>
        <p style={{ color: "#0F766E", fontSize: 12, fontWeight: 850, letterSpacing: "0.06em", margin: "0 0 8px", textTransform: "uppercase" }}>
          Simulación Tributaria
        </p>
        <h1 style={{ color: "#0F2A3D", fontSize: "2rem", fontWeight: 900, margin: "0 0 8px" }}>
          ¿Qué pasa si...?
        </h1>
        <p style={{ color: "#64748B", fontSize: 15, lineHeight: 1.6, margin: 0 }}>
          Proyecta riesgo, score e impacto estimado antes de tomar una decisión. Esta simulación es orientativa y no ejecuta cambios reales.
        </p>
      </section>

      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 14 }}>
        {scenarios.map((scenario) => {
          const active = selected.title === scenario.title;
          return (
            <button
              key={`${scenario.type}-${scenario.title}`}
              type="button"
              onClick={() => {
                setSelected(scenario);
                setSimulation(null);
                setError("");
              }}
              style={{
                textAlign: "left",
                background: active ? "#ECFDF5" : "#FFFFFF",
                border: active ? "2px solid #0F766E" : "1px solid #E2E8F0",
                borderRadius: 14,
                padding: 18,
                cursor: "pointer",
              }}
            >
              <p style={{ color: "#0F2A3D", fontSize: 16, fontWeight: 850, margin: "0 0 6px" }}>{scenario.title}</p>
              <p style={{ color: "#64748B", fontSize: 13, lineHeight: 1.45, margin: 0 }}>{scenario.description}</p>
            </button>
          );
        })}
      </section>

      <form onSubmit={run} style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 18, padding: 22, display: "grid", gap: 16 }}>
        <div>
          <h2 style={{ color: "#0F2A3D", fontSize: 20, fontWeight: 850, margin: "0 0 6px" }}>{selected.title}</h2>
          <p style={{ color: "#64748B", fontSize: 14, margin: 0 }}>{selected.description}</p>
        </div>

        {selected.type === "INCOME" && (
          <label style={{ display: "grid", gap: 8, maxWidth: 320 }}>
            <span style={{ color: "#334155", fontSize: 13, fontWeight: 800 }}>Aumento estimado de ingresos (%)</span>
            <input
              type="number"
              min="1"
              max="200"
              value={increasePercentage}
              onChange={(event) => setIncreasePercentage(event.target.value)}
              style={{ border: "1px solid #CBD5E1", borderRadius: 10, padding: "11px 12px", fontSize: 14 }}
            />
          </label>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{
            background: "#0F766E",
            border: "none",
            borderRadius: 12,
            color: "#FFFFFF",
            cursor: loading ? "not-allowed" : "pointer",
            fontSize: 14,
            fontWeight: 850,
            justifySelf: "start",
            padding: "12px 18px",
          }}
        >
          {loading ? "Simulando…" : "Simular escenario"}
        </button>

        {error && (
          <p style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 10, color: "#991B1B", fontSize: 14, fontWeight: 750, margin: 0, padding: 12 }}>
            {error}
          </p>
        )}
      </form>

      {simulation && <SimulationResultView result={simulation.result} />}
    </main>
  );
}

function SimulationResultView({ result }: { result: SimulationResult }) {
  return (
    <section style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 18, padding: 22, display: "grid", gap: 18 }}>
      <div>
        <p style={{ color: "#0F766E", fontSize: 12, fontWeight: 850, letterSpacing: "0.06em", margin: "0 0 8px", textTransform: "uppercase" }}>
          Resultado proyectado
        </p>
        <h2 style={{ color: "#0F2A3D", fontSize: 22, fontWeight: 900, margin: "0 0 6px" }}>{result.summary}</h2>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 14 }}>
        <ImpactCard label="Riesgo" current={result.impact.currentRisk} projected={result.impact.projectedRisk} suffix="/100" lowerIsBetter />
        <ImpactCard label="Score" current={result.impact.currentScore} projected={result.impact.projectedScore} suffix="/100" />
        <article style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 14, padding: 18 }}>
          <p style={{ color: "#64748B", fontSize: 12, fontWeight: 850, margin: "0 0 8px", textTransform: "uppercase" }}>Impacto estimado</p>
          <p style={{ color: "#0F2A3D", fontSize: 26, fontWeight: 900, margin: 0 }}>{result.impact.taxImpact}</p>
          <p style={{ color: "#64748B", fontSize: 13, margin: "4px 0 0" }}>Estimación simple del motor</p>
        </article>
      </div>

      <div>
        <h3 style={{ color: "#0F2A3D", fontSize: 17, fontWeight: 850, margin: "0 0 10px" }}>Recomendaciones</h3>
        <div style={{ display: "grid", gap: 8 }}>
          {result.recommendations.map((recommendation: string, index: number) => (
            <p key={`${recommendation}-${index}`} style={{ background: "#ECFDF5", border: "1px solid #BBF7D0", borderRadius: 10, color: "#166534", fontSize: 14, fontWeight: 700, margin: 0, padding: 12 }}>
              {recommendation}
            </p>
          ))}
        </div>
      </div>
    </section>
  );
}

function ImpactCard({ label, current, projected, suffix, lowerIsBetter = false }: { label: string; current: number; projected: number; suffix: string; lowerIsBetter?: boolean }) {
  const delta = projected - current;
  const isGood = lowerIsBetter ? delta <= 0 : delta >= 0;
  return (
    <article style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 14, padding: 18 }}>
      <p style={{ color: "#64748B", fontSize: 12, fontWeight: 850, margin: "0 0 8px", textTransform: "uppercase" }}>{label}</p>
      <p style={{ color: "#0F2A3D", fontSize: 24, fontWeight: 900, margin: "0 0 6px" }}>
        {current}{suffix} → {projected}{suffix}
      </p>
      <p style={{ color: isGood ? "#15803D" : "#B45309", fontSize: 13, fontWeight: 800, margin: 0 }}>
        Variación: {delta > 0 ? "+" : ""}{delta}
      </p>
    </article>
  );
}
